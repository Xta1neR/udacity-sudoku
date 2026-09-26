import random

from flask import Flask, render_template, jsonify, request

import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None
}


def json_error(message, status_code=400):
    return jsonify({'error': message}), status_code


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/new')
def new_game():
    clues_raw = request.args.get('clues')
    if clues_raw is None:
        clues = 35
    else:
        try:
            clues = int(clues_raw)
        except (TypeError, ValueError):
            return json_error('Clues must be an integer')
        if clues < 17 or clues > 81:
            return json_error('Clues must be between 17 and 81')

    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    return jsonify({'puzzle': puzzle})


@app.route('/check', methods=['POST'])
def check_solution():
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or 'board' not in data:
        return json_error('Expected a 9x9 board of integers 0–9')

    board = data.get('board')
    if not isinstance(board, list) or len(board) != sudoku_logic.SIZE:
        return json_error('Expected a 9x9 board of integers 0–9')

    for row in board:
        if not isinstance(row, list) or len(row) != sudoku_logic.SIZE:
            return json_error('Expected a 9x9 board of integers 0–9')
        for value in row:
            if type(value) is not int or value < 0 or value > 9:
                return json_error('Expected a 9x9 board of integers 0–9')

    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])
    return jsonify({'incorrect': incorrect})


@app.route('/hint')
def give_hint():
    puzzle = CURRENT.get('puzzle')
    solution = CURRENT.get('solution')
    if puzzle is None or solution is None:
        return json_error('No game in progress')

    empty_cells = []
    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if puzzle[row][col] == 0:
                empty_cells.append((row, col))

    if not empty_cells:
        return json_error('No empty cells left to hint')

    row, col = random.choice(empty_cells)
    if puzzle[row][col] != 0:
        return json_error('No empty cells left to hint')

    puzzle[row][col] = solution[row][col]
    return jsonify({'row': row, 'col': col, 'value': solution[row][col]})


if __name__ == '__main__':
    app.run(debug=True)