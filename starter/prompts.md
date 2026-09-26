# Suggested Copilot prompts for required screenshots

Use these prompts in your actual GitHub Copilot Chat and capture the conversation.

## 1. Testing framework
> Before modifying the Sudoku application, inspect the current Flask project and add a pytest testing framework. Create baseline tests for the existing API and Sudoku logic. Explain your test strategy and do not change production behavior just to make tests pass.

## 2. Unique solution
> Refactor the Sudoku generator so every generated puzzle has exactly one solution. Explain why simply removing random cells is insufficient, implement a solution-counting algorithm with an early limit of 2, and add tests proving generated puzzles are unique.

## 3. Top 10 localStorage
> Add a browser-side Top 10 leaderboard that persists in localStorage. Store player name, completion time, difficulty, and hints used. Sort fastest first, keep only 10 entries, escape user-provided names safely, and explain the implementation.

## 4. 3×3 styling
> Improve the Sudoku grid so alternating 3×3 boxes have visually distinct backgrounds while preserving thick boundaries between boxes. Make the styling responsive and readable in both light and dark themes.

## 5. Evaluate/reject a suggestion
> Review your proposed change against the project rubric. Identify any part that could violate the requirements or create a maintenance/security issue, and suggest a safer alternative before applying it.
