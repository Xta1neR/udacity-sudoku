// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = 'sudokuLeaderboard';
const THEME_KEY = 'sudokuTheme';
const CLUES_BY_DIFFICULTY = {easy: 40, medium: 35, hard: 30};
let puzzle = [];
let startedAt = null;
let completedInSeconds = null;
let timerInterval = null;
let hintsUsed = 0;
let gameComplete = false;
let scoreSaved = false;
let gameDifficulty = null;

function setMessage(text, isError = true) {
  const message = document.getElementById('message');
  message.style.color = isError ? '#d32f2f' : '#388e3c';
  message.textContent = text;
}

function getPreferredTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const isDark = theme === 'dark';
  toggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  toggle.setAttribute('aria-pressed', String(isDark));
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = String(i);
      input.dataset.col = String(j);
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        updateConflictHighlights();
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function updateConflictHighlights() {
  const inputs = Array.from(document.querySelectorAll('.sudoku-cell'));
  const values = inputs.map((input) => input.value);
  const conflicts = new Set();
  const markGroupConflicts = (indices) => {
    const byValue = new Map();
    indices.forEach((index) => {
      const value = values[index];
      if (!value) return;
      if (!byValue.has(value)) byValue.set(value, []);
      byValue.get(value).push(index);
    });
    byValue.forEach((matches) => {
      if (matches.length > 1) matches.forEach((index) => conflicts.add(index));
    });
  };

  for (let group = 0; group < SIZE; group++) {
    markGroupConflicts(Array.from({length: SIZE}, (_, offset) => group * SIZE + offset));
    markGroupConflicts(Array.from({length: SIZE}, (_, offset) => offset * SIZE + group));
  }
  for (let boxRow = 0; boxRow < SIZE; boxRow += 3) {
    for (let boxCol = 0; boxCol < SIZE; boxCol += 3) {
      const indices = [];
      for (let row = boxRow; row < boxRow + 3; row++) {
        for (let col = boxCol; col < boxCol + 3; col++) {
          indices.push(row * SIZE + col);
        }
      }
      markGroupConflicts(indices);
    }
  }

  inputs.forEach((input, index) => input.classList.toggle('conflict', conflicts.has(index)));
  const message = document.getElementById('message');
  if (conflicts.size > 0) {
    setMessage('This entry conflicts with another number.');
  } else if (message.textContent === 'This entry conflicts with another number.') {
    message.textContent = '';
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      inp.className = 'sudoku-cell';
      if (val !== 0) {
        inp.value = String(val);
        inp.disabled = true;
        inp.classList.add('prefilled');
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  const difficulty = document.getElementById('difficulty').value;
  const clues = CLUES_BY_DIFFICULTY[difficulty];

  try {
    const res = await fetch(`/new?clues=${clues}`);
    if (!res.ok) {
      throw new Error('New game request failed');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid game response');
    }

    if (!data || !Array.isArray(data.puzzle)) {
      throw new Error('Invalid game payload');
    }

    renderPuzzle(data.puzzle);
    document.getElementById('message').textContent = '';
    document.getElementById('score-form').hidden = true;
    document.getElementById('player-name').value = '';
    hintsUsed = 0;
    gameComplete = false;
    scoreSaved = false;
    gameDifficulty = difficulty;
    startTimer();
  } catch (error) {
    console.error('Unable to start a new game.', error);
    setMessage('Unable to start a new game. Please try again.');
  }
}

function getElapsedSeconds() {
  if (startedAt === null) return completedInSeconds || 0;
  return Math.floor((Date.now() - startedAt) / 1000);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTimer() {
  document.getElementById('elapsed-time').textContent = formatTime(getElapsedSeconds());
}

function startTimer() {
  if (timerInterval !== null) clearInterval(timerInterval);
  startedAt = Date.now();
  completedInSeconds = null;
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  completedInSeconds = getElapsedSeconds();
  startedAt = null;
  if (timerInterval !== null) clearInterval(timerInterval);
  timerInterval = null;
  updateTimer();
}

function loadLeaderboard() {
  try {
    const stored = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    if (!Array.isArray(stored)) return [];
    const entries = stored.filter((entry) =>
      entry && typeof entry.name === 'string' &&
      Number.isFinite(entry.completionTime) && entry.completionTime >= 0 &&
      ['easy', 'medium', 'hard'].includes(entry.difficulty) &&
      Number.isInteger(entry.hintsUsed) && entry.hintsUsed >= 0
    ).sort((first, second) => first.completionTime - second.completionTime).slice(0, 10);
    if (JSON.stringify(entries) !== JSON.stringify(stored)) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
    }
    return entries;
  } catch {
    return [];
  }
}

function renderLeaderboard() {
  const entries = loadLeaderboard();
  const body = document.getElementById('leaderboard-entries');
  const emptyMessage = document.getElementById('leaderboard-empty');
  body.replaceChildren();
  emptyMessage.hidden = entries.length > 0;

  entries.forEach((entry, index) => {
    const row = document.createElement('tr');
    const values = [
      index + 1,
      entry.name,
      formatTime(entry.completionTime),
      entry.difficulty[0].toUpperCase() + entry.difficulty.slice(1),
      entry.hintsUsed
    ];
    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
}

function saveScore(event) {
  event.preventDefault();
  const name = document.getElementById('player-name').value.trim();
  const message = document.getElementById('message');
  if (!name || !gameComplete || scoreSaved) return;

  const entries = loadLeaderboard();
  entries.push({
    name,
    completionTime: completedInSeconds,
    difficulty: gameDifficulty || document.getElementById('difficulty').value,
    hintsUsed
  });
  entries.sort((first, second) => first.completionTime - second.completionTime);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 10)));
  } catch {
    message.textContent = 'Unable to save the leaderboard in this browser.';
    return;
  }

  scoreSaved = true;
  document.getElementById('score-form').hidden = true;
  message.textContent = 'Score saved to the Top 10.';
  renderLeaderboard();
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }

  try {
    const res = await fetch('/check', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({board})
    });

    if (!res.ok) {
      throw new Error('Check request failed');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid JSON response');
    }

    if (data && typeof data.error === 'string') {
      setMessage(data.error);
      return;
    }

    if (!data || !Array.isArray(data.incorrect)) {
      throw new Error('Invalid check response');
    }

    const incorrect = new Set(data.incorrect.map(([row, col]) => row * SIZE + col));
    for (let idx = 0; idx < inputs.length; idx++) {
      const inp = inputs[idx];
      if (inp.disabled) continue;
      inp.className = 'sudoku-cell';
      if (incorrect.has(idx)) {
        inp.classList.add('incorrect');
      }
    }
    updateConflictHighlights();

    if (incorrect.size === 0) {
      setMessage('Congratulations! You solved it!', false);
      if (!gameComplete) {
        gameComplete = true;
        stopTimer();
        document.getElementById('score-form').hidden = false;
        document.getElementById('player-name').focus();
      }
    } else {
      setMessage('Some cells are incorrect.');
    }
  } catch (error) {
    console.error('Unable to check the solution.', error);
    setMessage('Unable to check the solution. Please try again.');
  }
}

async function requestHint() {
  if (gameComplete) return;

  try {
    const res = await fetch('/hint');
    if (!res.ok) {
      let data = null;
      try {
        data = await res.json();
      } catch {
        // ignore invalid JSON for a hint request failure
      }
      if (data && typeof data.error === 'string') {
        setMessage(data.error);
      }
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      return;
    }

    const row = Number(data.row);
    const col = Number(data.col);
    const value = Number(data.value);

    if (!Number.isInteger(row) || !Number.isInteger(col) || !Number.isInteger(value)) {
      return;
    }

    const cellIndex = row * SIZE + col;
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE || puzzle[row][col] !== 0) {
      return;
    }

    const input = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (!input) {
      return;
    }

    input.value = String(value);
    input.disabled = true;
    input.classList.remove('prefilled');
    input.classList.add('hint');
    puzzle[row][col] = value;
    hintsUsed += 1;
    updateConflictHighlights();
  } catch (error) {
    console.error('Unable to fetch a hint.', error);
    setMessage('Unable to fetch a hint. Please try again.');
  }
}

// Wire buttons
window.addEventListener('load', () => {
  const storedTheme = getPreferredTheme();
  applyTheme(storedTheme);

  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });

  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('hint').addEventListener('click', requestHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('score-form').addEventListener('submit', saveScore);
  window.addEventListener('storage', (event) => {
    if (event.key === LEADERBOARD_KEY) renderLeaderboard();
    if (event.key === THEME_KEY) {
      const nextTheme = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : getPreferredTheme();
      applyTheme(nextTheme);
    }
  });
  renderLeaderboard();
  newGame();
});