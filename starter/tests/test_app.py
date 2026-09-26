import pytest

import app as sudoku_app
import sudoku_logic


@pytest.fixture
def client():
    sudoku_app.app.config.update(TESTING=True)
    sudoku_app.CURRENT.update(puzzle=None, solution=None)
    with sudoku_app.app.test_client() as test_client:
        yield test_client
    sudoku_app.CURRENT.update(puzzle=None, solution=None)


def test_index_returns_successful_response(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Sudoku" in response.data


def test_new_game_uses_requested_clue_count_and_stores_game(client, monkeypatch):
    puzzle = [[0 for _ in range(sudoku_logic.SIZE)] for _ in range(sudoku_logic.SIZE)]
    solution = [[1 for _ in range(sudoku_logic.SIZE)] for _ in range(sudoku_logic.SIZE)]
    requested_clues = 42

    def fake_generate_puzzle(clues):
        assert clues == requested_clues
        return puzzle, solution

    monkeypatch.setattr(sudoku_logic, "generate_puzzle", fake_generate_puzzle)

    response = client.get(f"/new?clues={requested_clues}")

    assert response.status_code == 200
    assert response.get_json() == {"puzzle": puzzle}
    assert sudoku_app.CURRENT == {"puzzle": puzzle, "solution": solution}


def test_new_game_uses_default_clues_when_missing(client, monkeypatch):
    puzzle = [[0 for _ in range(sudoku_logic.SIZE)] for _ in range(sudoku_logic.SIZE)]
    solution = [[1 for _ in range(sudoku_logic.SIZE)] for _ in range(sudoku_logic.SIZE)]

    def fake_generate_puzzle(clues):
        assert clues == 35
        return puzzle, solution

    monkeypatch.setattr(sudoku_logic, "generate_puzzle", fake_generate_puzzle)

    response = client.get("/new")

    assert response.status_code == 200
    assert response.get_json() == {"puzzle": puzzle}


def test_new_game_rejects_invalid_clues(client):
    invalid = [
        ("/new?clues=abc", {"error": "Clues must be an integer"}),
        ("/new?clues=16", {"error": "Clues must be between 17 and 81"}),
        ("/new?clues=82", {"error": "Clues must be between 17 and 81"}),
    ]

    for url, expected in invalid:
        response = client.get(url)
        assert response.status_code == 400
        assert response.get_json() == expected

    response = client.get("/new")
    assert response.status_code == 200


def test_check_without_game_returns_error(client):
    response = client.post("/check", json={"board": []})

    assert response.status_code == 400
    assert response.get_json() == {"error": "No game in progress"}


def test_check_rejects_malformed_board_payloads(client):
    sudoku_app.CURRENT["solution"] = [[(i * 3 + j) % 9 + 1 for j in range(sudoku_logic.SIZE)] for i in range(sudoku_logic.SIZE)]

    malformed_payloads = [
        "not-json",
        {},
        {"board": None},
        {"board": [[0] * 8 for _ in range(sudoku_logic.SIZE)]},
        {"board": [[0] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE - 1)]},
        {"board": [["1"] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]},
        {"board": [[-1] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]},
        {"board": [[10] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]},
    ]

    for payload in malformed_payloads:
        if isinstance(payload, str):
            response = client.post("/check", data=payload, content_type="application/json")
        else:
            response = client.post("/check", json=payload)
        assert response.status_code == 400
        assert response.get_json() == {"error": "Expected a 9x9 board of integers 0–9"}

    response = client.post("/check", json={"board": [[0] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]})
    assert response.status_code == 200
    assert isinstance(response.get_json()["incorrect"], list)


def test_check_returns_coordinates_that_differ_from_solution(client):
    solution = [[0 for _ in range(sudoku_logic.SIZE)] for _ in range(sudoku_logic.SIZE)]
    board = [row[:] for row in solution]
    board[0][2] = 3
    board[7][8] = 9
    sudoku_app.CURRENT["solution"] = solution

    response = client.post("/check", json={"board": board})

    assert response.status_code == 200
    assert response.get_json() == {"incorrect": [[0, 2], [7, 8]]}


def test_hint_returns_only_one_valid_empty_cell(client):
    solution = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ]
    puzzle = [row[:] for row in solution]
    puzzle[0][2] = 0
    puzzle[1][8] = 0
    puzzle[8][0] = 0
    sudoku_app.CURRENT["puzzle"] = puzzle
    sudoku_app.CURRENT["solution"] = solution

    response = client.get("/hint")

    assert response.status_code == 200
    data = response.get_json()
    assert set(data.keys()) == {"row", "col", "value"}
    assert puzzle[data["row"]][data["col"]] == 0
    assert data["value"] == solution[data["row"]][data["col"]]


def test_hint_returns_error_when_no_game_or_no_empty_cells(client):
    response = client.get("/hint")
    assert response.status_code == 400
    assert "No game" in response.get_json()["error"]

    solution = [[(i * 3 + j) % 9 + 1 for j in range(sudoku_logic.SIZE)] for i in range(sudoku_logic.SIZE)]
    sudoku_app.CURRENT["puzzle"] = [row[:] for row in solution]
    sudoku_app.CURRENT["solution"] = [row[:] for row in solution]

    response = client.get("/hint")
    assert response.status_code == 400
    assert "No empty cells" in response.get_json()["error"]