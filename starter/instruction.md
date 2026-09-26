# Copilot Instructions — Flask Sudoku

## Goal
Maintain a production-quality, beginner-readable Flask Sudoku game that satisfies the project rubric.

## Architecture
- Keep Sudoku rules and generation in `sudoku_logic.py`.
- Keep HTTP/API concerns in `app.py`.
- Keep browser state and interaction in `static/main.js`.
- Keep presentation in `static/styles.css` and `templates/index.html`.
- Prefer small, testable functions over large route handlers.

## Sudoku correctness
- Every generated puzzle must be solvable and have exactly one solution.
- Never assume that removing random cells preserves uniqueness; validate uniqueness with a solution counter.
- Prefilled and hint cells must be locked in the UI.
- Difficulty must change the number of clues: Easy >= Medium >= Hard.

## Frontend behavior
- Use event delegation where practical.
- Validate user input immediately and provide accessible visual feedback.
- Use localStorage only for client-side leaderboard/theme persistence.
- Escape user-provided leaderboard names before inserting them into HTML.
- Keep the UI responsive on mobile and desktop.
- Maintain readable contrast in light and dark modes.
- Do not introduce a frontend framework unless explicitly requested.

## Python quality
- Use Python 3.10+ syntax and type hints where useful.
- Handle invalid API input gracefully.
- Avoid globals for mutable state except the intentionally simple current-game store.
- Keep functions focused and documented when behavior is non-obvious.

## Testing
- Add or update pytest tests for logic and API behavior.
- Run `pytest -q` after meaningful changes.
- Never delete a failing test merely to make the suite green; investigate the underlying behavior.

## Responsible Copilot use
- Explain non-obvious generated code.
- Prefer minimal, reviewable changes.
- If a Copilot suggestion conflicts with the rubric, reject it and document why in the development notes/screenshots.
