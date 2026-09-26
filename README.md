# Flask Sudoku — Copilot Refactoring Project

A modernized Flask Sudoku game built from the Udacity legacy starter project.

## Features

- Easy / Medium / Hard difficulty
- Guaranteed single-solution puzzles
- Locked prefilled cells
- Immediate conflict feedback
- Check Puzzle validation
- One-cell Hint system with locked hint cells
- Solve timer
- Top 10 local leaderboard (name, time, difficulty, hints)
- Persistent leaderboard using browser localStorage
- Light / dark mode persisted with localStorage
- Responsive 9×9 grid with alternating 3×3 box colors
- Basic accessible labels, status messages, and keyboard-friendly controls
- Automated pytest coverage for core Sudoku and API behavior

## Run locally

```bash
cd starter
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000.

## Test

From the `starter` directory:

```bash
pytest -q
```

## Project structure

```text
starter/
├── app.py
├── instruction.md
├── requirements.txt
├── sudoku_logic.py
├── templates/
│   └── index.html
├── static/
│   ├── main.js
│   └── styles.css
└── tests/
    ├── conftest.py
    └── test_sudoku.py
```

## Copilot evidence

The rubric requires screenshots of actual Copilot conversations. Do **not** fabricate these screenshots.

Save screenshots of your real Copilot interactions in:

```text
Screenshots/
├── initial_tests.png
├── copilot_unique_solution.png
├── copilot_leaderboard_localstorage.png
├── copilot_3x3_styling.png
└── copilot_evaluation_or_rejection.png
```

Each screenshot should visibly include your prompt and Copilot's response. At least one should show you evaluating, modifying, or rejecting a suggestion.

Useful prompts are documented in `prompts.md`.

## Rubric checklist

- [x] `instruction.md` gives Copilot project-specific guidance
- [x] Modular Flask + JavaScript + CSS structure
- [x] Pytest baseline and feature tests
- [x] Unique-solution puzzle generation
- [x] Easy / Medium / Hard difficulty
- [x] Locked prefilled cells
- [x] Immediate invalid-entry feedback
- [x] Completion message
- [x] Hint button
- [x] Check button
- [x] Timer
- [x] Top 10 localStorage leaderboard
- [x] Dark mode
- [x] Responsive UI
- [x] Alternating 3×3 box styling
- [ ] Real Copilot milestone screenshots — must be captured by the student
