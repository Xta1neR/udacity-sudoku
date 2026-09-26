# Flask Sudoku Project

This repository contains a Flask-based Sudoku game with client-side JavaScript, CSS styling, and automated pytest coverage.

## Features

- Unique-solution Sudoku generation with difficulty presets
- Easy / Medium / Hard puzzle selection
- Check-solution validation with incorrect coordinate feedback
- Hint flow returning a single valid cell value
- Locked prefilled cells and lockable hinted cells
- Solve timer and completion flow
- Top 10 localStorage leaderboard with name, time, difficulty, and hints used
- Manual light/dark theme toggle persisted in localStorage
- Responsive board layout for smaller screens

## Run locally

```bash
cd starter
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Then open http://127.0.0.1:5000.

## Test

From the project root:

```bash
pytest -q
```

## Project structure

```text
.
├── README.md
├── pytest.ini
├── starter/
│   ├── app.py
│   ├── instruction.md
│   ├── prompts.md
│   ├── requirements.txt
│   ├── sudoku_logic.py
│   ├── static/
│   │   ├── main.js
│   │   └── styles.css
│   ├── templates/
│   │   └── index.html
│   └── tests/
│       ├── test_app.py
│       └── test_sudoku_logic.py
└── Screenshots/   # optional evidence folder for actual Copilot capture; not generated automatically
```

## Copilot evidence

This repository does not include the required screenshot evidence files by default. Those files must be captured from real GitHub Copilot Chat sessions and stored in the folder below if the rubric requires them:

```text
Screenshots/
├── initial_tests.png
├── copilot_unique_solution.png
├── copilot_leaderboard_localstorage.png
├── copilot_3x3_styling.png
└── copilot_evaluation_or_rejection.png
```

Do not fabricate screenshots or claim they exist without actually capturing them.
