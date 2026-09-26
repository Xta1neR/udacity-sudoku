import sudoku_logic


def is_valid_solution(board):
    expected = set(range(1, sudoku_logic.SIZE + 1))
    rows_valid = all(set(row) == expected for row in board)
    columns_valid = all(
        {board[row][col] for row in range(sudoku_logic.SIZE)} == expected
        for col in range(sudoku_logic.SIZE)
    )
    boxes_valid = all(
        {
            board[row][col]
            for row in range(box_row, box_row + 3)
            for col in range(box_col, box_col + 3)
        }
        == expected
        for box_row in range(0, sudoku_logic.SIZE, 3)
        for box_col in range(0, sudoku_logic.SIZE, 3)
    )
    return rows_valid and columns_valid and boxes_valid


def test_create_empty_board_has_expected_dimensions_and_values():
    board = sudoku_logic.create_empty_board()

    assert len(board) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in board)
    assert all(value == sudoku_logic.EMPTY for row in board for value in row)


def test_deep_copy_is_independent():
    board = sudoku_logic.create_empty_board()

    copied_board = sudoku_logic.deep_copy(board)
    copied_board[0][0] = 1

    assert board[0][0] == sudoku_logic.EMPTY


def test_is_safe_rejects_row_column_and_box_duplicates():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 1
    board[4][4] = 2

    assert not sudoku_logic.is_safe(board, 0, 1, 1)
    assert not sudoku_logic.is_safe(board, 1, 0, 1)
    assert not sudoku_logic.is_safe(board, 5, 5, 2)
    assert sudoku_logic.is_safe(board, 0, 1, 3)


def test_count_solutions_returns_one_for_a_complete_valid_board():
    _, solution = sudoku_logic.generate_puzzle(81)

    assert sudoku_logic.count_solutions(solution) == 1


def test_count_solutions_stops_at_the_requested_limit():
    board = sudoku_logic.create_empty_board()

    assert sudoku_logic.count_solutions(board, limit=2) == 2


def test_generate_puzzle_returns_valid_solution_and_preserves_clues():
    clues = 35

    puzzle, solution = sudoku_logic.generate_puzzle(clues)

    assert is_valid_solution(solution)
    assert sum(value != sudoku_logic.EMPTY for row in puzzle for value in row) == clues
    assert sudoku_logic.count_solutions(puzzle) == 1
    assert all(
        puzzle[row][col] in (sudoku_logic.EMPTY, solution[row][col])
        for row in range(sudoku_logic.SIZE)
        for col in range(sudoku_logic.SIZE)
    )