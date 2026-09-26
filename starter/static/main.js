// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = 'sudokuLeaderboard';
const CLUES_BY_DIFFICULTY = {easy: 40, medium: 35, hard: 30};
let puzzle = [];
let startedAt = null;
let completedInSeconds = null;
let timerInterval = null;
let hintsUsed = 0;
let gameComplete = false;
let scoreSaved = false;

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
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
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
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
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
  const res = await fetch(`/new?clues=${clues}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').textContent = '';
  document.getElementById('score-form').hidden = true;
  document.getElementById('player-name').value = '';
  hintsUsed = 0;
  gameComplete = false;
  scoreSaved = false;
  startTimer();
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
    difficulty: document.getElementById('difficulty').value,
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
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    msg.textContent = 'Congratulations! You solved it!';
    if (!gameComplete) {
      gameComplete = true;
      stopTimer();
      document.getElementById('score-form').hidden = false;
      document.getElementById('player-name').focus();
    }
  } else {
    msg.style.color = '#d32f2f';
    msg.textContent = 'Some cells are incorrect.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('score-form').addEventListener('submit', saveScore);
  window.addEventListener('storage', (event) => {
    if (event.key === LEADERBOARD_KEY) renderLeaderboard();
  });
  renderLeaderboard();
  // initialize
  newGame();
});