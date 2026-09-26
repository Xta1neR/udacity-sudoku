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


def test_check_without_game_returns_error(client):
    response = client.post("/check", json={"board": []})

    assert response.status_code == 400
    assert response.get_json() == {"error": "No game in progress"}


def test_check_returns_coordinates_that_differ_from_solution(client):
    solution = [[0 for _ in range(sudoku_logic.SIZE)] for _ in range(sudoku_logic.SIZE)]
    board = [row[:] for row in solution]
    board[0][2] = 3
    board[7][8] = 9
    sudoku_app.CURRENT["solution"] = solution

    response = client.post("/check", json={"board": board})

    assert response.status_code == 200
    assert response.get_json() == {"incorrect": [[0, 2], [7, 8]]}