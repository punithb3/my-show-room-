/**
 * ==========================================================================
 * NEON SNAKE ARCADE - GAME ENGINE & SYNTHESIZER
 * ==========================================================================
 */

/**
 * 1. SOUND CONTROLLER (Pure Web Audio API Synthesizer)
 * Creates real-time audio waveforms without loading external files,
 * ensuring seamless offline capability and compliance with web standards.
 */
class SoundController {
  constructor() {
    this.ctx = null;
    this.sfxMuted = false;
    this.musicMuted = true; // Starts muted to ensure optimal user experience
    this.beatIndex = 0;
  }

  // Lazy initialize AudioContext on user interaction
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Short click beep for button interactions and direction inputs
  playClick() {
    if (this.sfxMuted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.04);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Play chimes when snake consumes food
  playEat(isGolden) {
    if (this.sfxMuted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isGolden) {
      // Golden food: Play a bright C-major arpeggio sequence
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, t); // C4
      osc.frequency.setValueAtTime(329.63, t + 0.06); // E4
      osc.frequency.setValueAtTime(392.00, t + 0.12); // G4
      osc.frequency.exponentialRampToValueAtTime(783.99, t + 0.3); // G5

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);

      // Harmony note
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, t + 0.12); // C5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, t + 0.35); // C6
      gain2.gain.setValueAtTime(0.06, t + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.12);
      osc2.stop(t + 0.4);
    } else {
      // Normal food: simple pitch sweeping chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(650, t + 0.14);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  }

  // Dynamic sweeping explosion sound when crashing
  playCrash() {
    if (this.sfxMuted) return;
    this.init();
    const t = this.ctx.currentTime;

    // Sawtooth voice plunging in pitch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.linearRampToValueAtTime(30, t + 0.65);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    // Noise wave buffer for textural blast details
    const bufferSize = this.ctx.sampleRate * 0.65;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(600, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(80, t + 0.6);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.7);
    noise.start(t);
    noise.stop(t + 0.7);
  }

  // Metronome beat indicator for pre-game countdowns
  playCountdown(isFinal) {
    if (this.sfxMuted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, t);
    
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // heartbeat synth rhythm synced to game ticks
  playStepBeat() {
    if (this.musicMuted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const isUp = this.beatIndex % 2 === 0;
    const freq = isUp ? 65 : 55;
    this.beatIndex++;

    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }
}

// Instantiate Sound Controller
const sound = new SoundController();


/**
 * 2. CORE GAME ENGINE
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grid setups
const GRID_SIZE = 20; 
const CELL_COUNT = 20; // 20x20 Grid
const CELL_SIZE = canvas.width / CELL_COUNT;

// Prevent 180-degree instant turns
const OPPOSITES = {
  'UP': 'DOWN',
  'DOWN': 'UP',
  'LEFT': 'RIGHT',
  'RIGHT': 'LEFT'
};

// Theme color definitions
const THEMES = {
  cyber: {
    background: '#090d16',
    grid: '#111827',
    snakeHead: '#10b981',
    snakeBodyStart: '#34d399',
    snakeBodyEnd: '#047857',
    food: '#f43f5e',
    foodGlow: '#f43f5e',
    goldenFood: '#fbbf24',
    goldenGlow: '#f59e0b',
    obstacle: '#4b5563',
    text: '#ffffff',
    accentGlow: 'rgba(52, 211, 153, 0.4)'
  },
  synth: {
    background: '#1e112a',
    grid: '#311a45',
    snakeHead: '#f43f5e',
    snakeBodyStart: '#ec4899',
    snakeBodyEnd: '#a21caf',
    food: '#f59e0b',
    foodGlow: '#f59e0b',
    goldenFood: '#38bdf8',
    goldenGlow: '#0ea5e9',
    obstacle: '#6b21a8',
    text: '#fff',
    accentGlow: 'rgba(236, 72, 153, 0.4)'
  },
  retro: {
    background: '#000000',
    grid: '#001a00',
    snakeHead: '#00ff00',
    snakeBodyStart: '#00cc00',
    snakeBodyEnd: '#004400',
    food: '#ff0000',
    foodGlow: '#ff0000',
    goldenFood: '#ffff00',
    goldenGlow: '#ffff00',
    obstacle: '#444444',
    text: '#00ff00',
    accentGlow: 'rgba(0, 255, 0, 0.3)'
  },
  forest: {
    background: '#fafaf9',
    grid: '#e7e5e4',
    snakeHead: '#1e3a1e',
    snakeBodyStart: '#2d6a4f',
    snakeBodyEnd: '#74c69d',
    food: '#bc4749',
    foodGlow: '#bc4749',
    goldenFood: '#d4a373',
    goldenGlow: '#d4a373',
    obstacle: '#78716c',
    text: '#1c1917',
    accentGlow: 'rgba(45, 106, 79, 0.15)'
  }
};

// Config parameters
let activeTheme = 'cyber';
let gameMode = 'classic'; // 'classic' | 'wrap' | 'obstacles'

// Snake & items variables
let snake = [];
let currentDirection = 'RIGHT';
let nextDirection = 'RIGHT';
let inputQueue = []; // Queues inputs to support fluid double-taps
let score = 0;
let food = { x: 0, y: 0, popScale: 0 };
let goldenFood = null;
let obstacles = [];
let foodEatenCount = 0;

// Game timings (Logical step ticks independent of rendering frame-rates)
let lastTickTime = 0;
let tickDelay = 150; 
let isPlaying = false;
let isPaused = false;
let isGameOver = false;
let isCountingDown = false;
let countdownVal = 3;
let countdownTimer = null;

// Visual particles & tickers
let particles = [];
let floatingTexts = [];
let foodPulseAngle = 0;
let frameCount = 0;
let fps = 60;
let lastFpsTime = 0;

// DOM Hookups
const themeSelect = document.getElementById('themeSelect');
const sfxToggleBtn = document.getElementById('sfxToggleBtn');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const dpadToggle = document.getElementById('dpadToggle');
const dpadContainer = document.getElementById('virtualDpad');
const modeContainer = document.getElementById('modeContainer');

const scoreLabel = document.getElementById('scoreLabel');
const highScoreLabel = document.getElementById('highScoreLabel');
const speedLevelLabel = document.getElementById('speedLevelLabel');
const foodEatenLabel = document.getElementById('foodEatenLabel');
const fpsCounter = document.getElementById('fpsCounter');

const goldenFoodBarContainer = document.getElementById('goldenFoodBarContainer');
const goldenFoodProgressBar = document.getElementById('goldenFoodProgressBar');
const goldenFoodTimeLabel = document.getElementById('goldenFoodTimeLabel');

// Overlays DOM Hookups
const menuOverlay = document.getElementById('menuOverlay');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverReason = document.getElementById('gameOverReason');
const gameOverScore = document.getElementById('gameOverScore');
const gameOverBest = document.getElementById('gameOverBest');

// Buttons Hookups
const startGameBtn = document.getElementById('startGameBtn');
const restartGameBtn = document.getElementById('restartGameBtn');
const resumeBtn = document.getElementById('resumeBtn');
const pauseQuitBtn = document.getElementById('pauseQuitBtn');
const gameOverQuitBtn = document.getElementById('gameOverQuitBtn');
const resetAllScoresBtn = document.getElementById('resetAllScoresBtn');

// Virtual Buttons
const dpadUp = document.getElementById('dpadUp');
const dpadDown = document.getElementById('dpadDown');
const dpadLeft = document.getElementById('dpadLeft');
const dpadRight = document.getElementById('dpadRight');
const dpadCenter = document.getElementById('dpadCenter');


/**
 * 3. PARTICLE & FLYING SCORE LABELS (Visual polish)
 */
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6;
    this.size = Math.random() * 5 + 3;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
    this.size = Math.max(0, this.size - 0.1);
  }

  draw(c) {
    c.save();
    c.globalAlpha = this.alpha;
    c.fillStyle = this.color;
    c.shadowBlur = 10;
    c.shadowColor = this.color;
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

class FloatingText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.vy = -1.2;
    this.life = 0;
  }

  update() {
    this.y += this.vy;
    this.life += 1;
    if (this.life > 30) {
      this.alpha -= 0.05;
    }
  }

  draw(c) {
    c.save();
    c.globalAlpha = Math.max(0, this.alpha);
    c.fillStyle = this.color;
    c.font = "bold 14px 'Press Start 2P', sans-serif";
    c.textAlign = "center";
    c.shadowBlur = 6;
    c.shadowColor = this.color;
    c.fillText(this.text, this.x, this.y);
    c.restore();
  }
}

function createFoodExplosion(cellX, cellY, isGolden) {
  const themeColors = THEMES[activeTheme];
  const color = isGolden ? themeColors.goldenFood : themeColors.food;
  const count = isGolden ? 25 : 15;
  
  const px = cellX * CELL_SIZE + CELL_SIZE / 2;
  const py = cellY * CELL_SIZE + CELL_SIZE / 2;

  for (let i = 0; i < count; i++) {
    particles.push(new Particle(px, py, color));
  }
}

function createFloatingText(cellX, cellY, text, color) {
  const px = cellX * CELL_SIZE + CELL_SIZE / 2;
  const py = cellY * CELL_SIZE - 5;
  floatingTexts.push(new FloatingText(px, py, text, color));
}


/**
 * 4. SCORES AND HIGH RECORDS DATA
 */
function getHighScore(mode) {
  const record = localStorage.getItem(`snake_high_score_${mode}`);
  return record ? parseInt(record, 10) : 0;
}

function updateHighScoreUI() {
  const best = getHighScore(gameMode);
  highScoreLabel.innerText = String(best).padStart(3, '0');
}

function saveHighScore() {
  const currentHigh = getHighScore(gameMode);
  if (score > currentHigh) {
    localStorage.setItem(`snake_high_score_${gameMode}`, score);
    updateHighScoreUI();
    return true;
  }
  return false;
}


/**
 * 5. PARAMETERS CALCULATORS
 */
function getSpeedLevel() {
  // gradual multiplier increase based on score landmarks
  const level = Math.min(10, Math.floor(score / 5) + 1);
  return level;
}

function calculateTickDelay() {
  const level = getSpeedLevel();
  // speed shifts down from 150ms step delays down to 60ms
  return Math.max(55, 160 - level * 10);
}

function updateStatsUI() {
  scoreLabel.innerText = String(score).padStart(3, '0');
  speedLevelLabel.innerText = `Level ${getSpeedLevel()}`;
  foodEatenLabel.innerText = String(foodEatenCount);
}


/**
 * 6. COLLISION DETECTORS
 */
function isGridCollision(pos1, pos2) {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

function randomGridPosition() {
  return {
    x: Math.floor(Math.random() * CELL_COUNT),
    y: Math.floor(Math.random() * CELL_COUNT)
  };
}

function isOccupied(pos, excludeTail = false) {
  // Check snake overlap
  const len = excludeTail ? snake.length - 1 : snake.length;
  for (let i = 0; i < len; i++) {
    if (snake[i].x === pos.x && snake[i].y === pos.y) return true;
  }
  // Check obstacle barriers
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].x === pos.x && obstacles[i].y === pos.y) return true;
  }
  return false;
}


/**
 * 7. SPAWNING RULES
 */
function spawnFood() {
  let tries = 0;
  let pos = randomGridPosition();
  
  while (isOccupied(pos) && tries < 1000) {
    pos = randomGridPosition();
    tries++;
  }
  
  food = {
    x: pos.x,
    y: pos.y,
    popScale: 0
  };
}

function spawnGoldenFood() {
  // 40% probability every 5th normal fruit eaten
  if (Math.random() < 0.4) {
    let tries = 0;
    let pos = randomGridPosition();
    while ((isOccupied(pos) || (pos.x === food.x && pos.y === food.y)) && tries < 1000) {
      pos = randomGridPosition();
      tries++;
    }

    goldenFood = {
      x: pos.x,
      y: pos.y,
      timeLeft: 7000, // 7 seconds lifetime
      maxTime: 7000,
      popScale: 0
    };

    goldenFoodBarContainer.classList.remove('hidden');
    goldenFoodBarContainer.classList.add('flex');
    
    sound.playEat(true);
  }
}

function generateObstacles() {
  obstacles = [];
  if (gameMode !== 'obstacles') return;

  const obstacleCount = Math.floor(Math.random() * 4) + 5; 
  
  for (let i = 0; i < obstacleCount; i++) {
    let pos = randomGridPosition();
    
    // Avoid blocking start areas (Y-row 10, X between 2 and 12)
    const inCenterRow = pos.y === 10;
    const tooCloseX = pos.x >= 2 && pos.x <= 12;

    let tries = 0;
    while ((inCenterRow && tooCloseX || isOccupied(pos)) && tries < 100) {
      pos = randomGridPosition();
      tries++;
    }

    if (tries < 100) {
      obstacles.push(pos);
    }
  }
}


/**
 * 8. MOVEMENT INPUT QUEUING (Prevents instant double-tap wall crashes)
 */
function changeDirection(newDir) {
  if (isPaused || isGameOver || isCountingDown || !isPlaying) return;

  const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : currentDirection;
  
  if (newDir !== lastDir && newDir !== OPPOSITES[lastDir]) {
    if (inputQueue.length < 3) {
      inputQueue.push(newDir);
      sound.playClick();
    }
  }
}

// Swipe support calculations
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  const threshold = 40;

  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) changeDirection('RIGHT');
    else changeDirection('LEFT');
  } else {
    if (dy > 0) changeDirection('DOWN');
    else changeDirection('UP');
  }
}


/**
 * 9. LOOP LOGIC RUNNERS
 */
function resetGame() {
  snake = [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 }
  ];
  
  currentDirection = 'RIGHT';
  nextDirection = 'RIGHT';
  inputQueue = [];
  score = 0;
  foodEatenCount = 0;
  goldenFood = null;
  particles = [];
  floatingTexts = [];
  
  goldenFoodBarContainer.classList.add('hidden');
  goldenFoodBarContainer.classList.remove('flex');

  generateObstacles();
  spawnFood();
  updateStatsUI();
  updateHighScoreUI();
  
  isGameOver = false;
  isPaused = false;
}

function triggerGameOver(reason) {
  isPlaying = false;
  isGameOver = true;
  sound.playCrash();

  const newHighRecord = saveHighScore();
  
  gameOverScore.innerText = score;
  gameOverBest.innerText = getHighScore(gameMode);
  
  if (newHighRecord) {
    gameOverReason.innerHTML = `<span class="text-amber-400 font-bold">🏆 NEW HIGH RECORD!</span><br>${reason}`;
  } else {
    gameOverReason.innerText = reason;
  }

  gameOverOverlay.classList.remove('hidden');
}

function togglePause() {
  if (!isPlaying || isGameOver || isCountingDown) return;

  isPaused = !isPaused;
  sound.playClick();

  if (isPaused) {
    pauseOverlay.classList.remove('hidden');
  } else {
    pauseOverlay.classList.add('hidden');
    lastTickTime = performance.now();
  }
}

function exitToMenu() {
  isPlaying = false;
  isPaused = false;
  isGameOver = false;
  isCountingDown = false;
  if (countdownTimer) clearInterval(countdownTimer);

  pauseOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  countdownOverlay.classList.add('hidden');
  menuOverlay.classList.remove('hidden');
  
  sound.playClick();
}


/**
 * 10. PHYSICS TICK LOOP (Grid updates)
 */
function gameTick() {
  if (isPaused || isGameOver || !isPlaying) return;

  if (inputQueue.length > 0) {
    currentDirection = inputQueue.shift();
  }

  sound.playStepBeat();

  const head = snake[0];
  let newHead = { x: head.x, y: head.y };

  switch (currentDirection) {
    case 'UP':    newHead.y -= 1; break;
    case 'DOWN':  newHead.y += 1; break;
    case 'LEFT':  newHead.x -= 1; break;
    case 'RIGHT': newHead.x += 1; break;
  }

  // Check boarder triggers
  if (gameMode === 'classic' || gameMode === 'obstacles') {
    if (newHead.x < 0 || newHead.x >= CELL_COUNT || newHead.y < 0 || newHead.y >= CELL_COUNT) {
      triggerGameOver("The snake collided with the arena wall!");
      return;
    }
  } else if (gameMode === 'wrap') {
    if (newHead.x < 0) newHead.x = CELL_COUNT - 1;
    if (newHead.x >= CELL_COUNT) newHead.x = 0;
    if (newHead.y < 0) newHead.y = CELL_COUNT - 1;
    if (newHead.y >= CELL_COUNT) newHead.y = 0;
  }

  // Self checks
  if (isOccupied(newHead, true)) {
    triggerGameOver("The snake bit itself!");
    return;
  }

  // Obstacle checks
  if (gameMode === 'obstacles') {
    for (let i = 0; i < obstacles.length; i++) {
      if (newHead.x === obstacles[i].x && newHead.y === obstacles[i].y) {
        triggerGameOver("You crashed into a steel barrier!");
        return;
      }
    }
  }

  snake.unshift(newHead);

  let foodEaten = false;

  // Consume normal red food
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    foodEatenCount += 1;
    foodEaten = true;
    
    sound.playEat(false);
    createFoodExplosion(food.x, food.y, false);
    createFloatingText(food.x, food.y, "+1", THEMES[activeTheme].food);
    
    spawnFood();
    updateStatsUI();

    if (foodEatenCount % 5 === 0) {
      spawnGoldenFood();
    }
  }

  // Consume golden food
  if (goldenFood && newHead.x === goldenFood.x && newHead.y === goldenFood.y) {
    score += 3;
    foodEatenCount += 1;
    foodEaten = true;
    
    sound.playEat(true);
    createFoodExplosion(goldenFood.x, goldenFood.y, true);
    createFloatingText(goldenFood.x, goldenFood.y, "+3 GOLD!", THEMES[activeTheme].goldenFood);
    
    goldenFood = null;
    goldenFoodBarContainer.classList.add('hidden');
    goldenFoodBarContainer.classList.remove('flex');
    
    updateStatsUI();
  }

  if (!foodEaten) {
    snake.pop();
  }

  tickDelay = calculateTickDelay();
}


/**
 * 11. CANVAS DRAWINGS (Visuals rendering)
 */
function drawGrid(theme) {
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 0.5;

  for (let i = 0; i <= CELL_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(canvas.width, i * CELL_SIZE);
    ctx.stroke();
  }
}

function drawSnake(theme) {
  if (snake.length === 0) return;

  ctx.save();

  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i];
    const isHead = i === 0;
    
    let segColor;
    if (isHead) {
      segColor = theme.snakeHead;
    } else {
      const ratio = i / (snake.length - 1);
      segColor = lerpColor(theme.snakeBodyStart, theme.snakeBodyEnd, ratio);
    }

    ctx.fillStyle = segColor;
    
    if (activeTheme !== 'forest') {
      ctx.shadowBlur = isHead ? 15 : 6;
      ctx.shadowColor = segColor;
    } else {
      ctx.shadowBlur = 0;
    }

    const scale = isHead ? 0.95 : 0.88 - (i / snake.length) * 0.28;
    const radius = CELL_SIZE * scale;
    const offset = (CELL_SIZE - radius) / 2;

    const x = seg.x * CELL_SIZE + offset;
    const y = seg.y * CELL_SIZE + offset;

    ctx.beginPath();
    drawRoundedRect(ctx, x, y, radius, radius, radius * 0.45);
    ctx.fill();

    if (isHead) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = theme.background === '#ffffff' || theme.background === '#fafaf9' ? '#000000' : '#ffffff';
      
      const eyeSize = radius * 0.22;
      const eyeOffset = radius * 0.26;
      
      let leftEyeX = 0, leftEyeY = 0, rightEyeX = 0, rightEyeY = 0;

      switch (currentDirection) {
        case 'RIGHT':
          leftEyeX = x + radius - eyeOffset; leftEyeY = y + eyeOffset;
          rightEyeX = x + radius - eyeOffset; rightEyeY = y + radius - eyeOffset;
          break;
        case 'LEFT':
          leftEyeX = x + eyeOffset; leftEyeY = y + radius - eyeOffset;
          rightEyeX = x + eyeOffset; rightEyeY = y + eyeOffset;
          break;
        case 'UP':
          leftEyeX = x + eyeOffset; leftEyeY = y + eyeOffset;
          rightEyeX = x + radius - eyeOffset; rightEyeY = y + eyeOffset;
          break;
        case 'DOWN':
          leftEyeX = x + radius - eyeOffset; leftEyeY = y + radius - eyeOffset;
          rightEyeX = x + eyeOffset; rightEyeY = y + radius - eyeOffset;
          break;
      }

      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
      ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, eyeSize * 0.5, 0, Math.PI * 2);
      ctx.arc(rightEyeX, rightEyeY, eyeSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawFood(theme) {
  ctx.save();
  const pRadius = (CELL_SIZE * 0.38) + Math.sin(foodPulseAngle) * 2;
  const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
  const fy = food.y * CELL_SIZE + CELL_SIZE / 2;

  if (food.popScale < 1) {
    food.popScale += 0.08;
  }
  const animRadius = Math.max(0.1, pRadius * Math.min(1, food.popScale));

  ctx.fillStyle = theme.food;
  if (activeTheme !== 'forest') {
    ctx.shadowBlur = 15 + Math.sin(foodPulseAngle) * 5;
    ctx.shadowColor = theme.foodGlow;
  }
  
  ctx.beginPath();
  ctx.arc(fx, fy, animRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(fx - animRadius * 0.35, fy - animRadius * 0.35, animRadius * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (goldenFood) {
    ctx.save();
    const gfx = goldenFood.x * CELL_SIZE + CELL_SIZE / 2;
    const gfy = goldenFood.y * CELL_SIZE + CELL_SIZE / 2;

    if (goldenFood.popScale < 1) {
      goldenFood.popScale += 0.08;
    }
    const gAnimRadius = (CELL_SIZE * 0.42) * Math.min(1, goldenFood.popScale);

    ctx.strokeStyle = theme.goldenFood;
    ctx.lineWidth = 2;
    if (activeTheme !== 'forest') {
      ctx.shadowBlur = 18;
      ctx.shadowColor = theme.goldenGlow;
    }
    
    ctx.beginPath();
    ctx.arc(gfx, gfy, gAnimRadius + Math.sin(foodPulseAngle * 1.5) * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gfx, gfy, gAnimRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    if (frameCount % 6 === 0) {
      particles.push(new Particle(gfx + (Math.random() - 0.5) * 15, gfy + (Math.random() - 0.5) * 15, theme.goldenFood));
    }

    ctx.restore();
  }
}

function drawObstacles(theme) {
  if (gameMode !== 'obstacles' || obstacles.length === 0) return;

  ctx.save();
  ctx.fillStyle = theme.obstacle;
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1.5;

  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    const ox = obs.x * CELL_SIZE;
    const oy = obs.y * CELL_SIZE;

    ctx.beginPath();
    drawRoundedRect(ctx, ox + 2, oy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + 6, oy + 6);
    ctx.lineTo(ox + CELL_SIZE - 6, oy + CELL_SIZE - 6);
    ctx.moveTo(ox + CELL_SIZE - 6, oy + 6);
    ctx.lineTo(ox + 6, oy + CELL_SIZE - 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoundedRect(c, x, y, width, height, radius) {
  c.beginPath();
  c.moveTo(x + radius, y);
  c.lineTo(x + width - radius, y);
  c.quadraticCurveTo(x + width, y, x + width, y + radius);
  c.lineTo(x + width, y + height - radius);
  c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  c.lineTo(x + radius, y + height);
  c.quadraticCurveTo(x, y + height, x, y + height - radius);
  c.lineTo(x, y + radius);
  c.quadraticCurveTo(x, y, x + radius, y);
  c.closePath();
}

function lerpColor(colorA, colorB, amount) {
  const ah = parseInt(colorA.replace(/#/g, ''), 16),
        bh = parseInt(colorB.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1);
}


/**
 * 12. RUNNERS INTERFACES
 */
function updateVisuals(timestamp) {
  frameCount++;
  foodPulseAngle += 0.08;

  // Particle decays
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  // Floating text translations
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].update();
    if (floatingTexts[i].alpha <= 0) {
      floatingTexts.splice(i, 1);
    }
  }

  // Golden timer progress bar updates
  if (goldenFood) {
    goldenFood.timeLeft -= (timestamp - lastFrameTime);
    const pct = Math.max(0, goldenFood.timeLeft / goldenFood.maxTime);
    goldenFoodProgressBar.style.width = `${pct * 100}%`;
    goldenFoodTimeLabel.innerText = `${Math.max(0, (goldenFood.timeLeft / 1000)).toFixed(1)}s`;

    if (goldenFood.timeLeft <= 0) {
      goldenFood = null;
      goldenFoodBarContainer.classList.add('hidden');
      goldenFoodBarContainer.classList.remove('flex');
    }
  }

  // FPS Diagnostics count updates
  if (timestamp - lastFpsTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsTime = timestamp;
    fpsCounter.innerText = fps;
  }
}

function renderCanvas() {
  const themeColors = THEMES[activeTheme];

  ctx.fillStyle = themeColors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid(themeColors);
  drawObstacles(themeColors);
  drawFood(themeColors);
  drawSnake(themeColors);

  for (let i = 0; i < particles.length; i++) {
    particles[i].draw(ctx);
  }
  for (let i = 0; i < floatingTexts.length; i++) {
    floatingTexts[i].draw(ctx);
  }
}

function mainGameLoop(timestamp) {
  if (!lastTickTime) lastTickTime = timestamp;
  if (!lastFrameTime) lastFrameTime = timestamp;

  const elapsedSinceTick = timestamp - lastTickTime;
  if (elapsedSinceTick >= tickDelay) {
    gameTick();
    lastTickTime = timestamp;
  }

  updateVisuals(timestamp);
  renderCanvas();

  lastFrameTime = timestamp;

  if (isPlaying || isPaused || isGameOver || isCountingDown) {
    requestAnimationFrame(mainGameLoop);
  }
}

function triggerCountdown(callback) {
  isCountingDown = true;
  countdownVal = 3;
  countdownOverlay.classList.remove('hidden');
  countdownNumber.innerText = countdownVal;
  
  sound.playCountdown(false);

  if (countdownTimer) clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    countdownVal--;
    
    if (countdownVal > 0) {
      countdownNumber.innerText = countdownVal;
      sound.playCountdown(false);
    } else if (countdownVal === 0) {
      countdownNumber.innerText = "GO!";
      sound.playCountdown(true);
    } else {
      clearInterval(countdownTimer);
      countdownOverlay.classList.add('hidden');
      isCountingDown = false;
      callback();
    }
  }, 1000);
}

function startFullGame() {
  menuOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');

  resetGame();

  triggerCountdown(() => {
    isPlaying = true;
    lastTickTime = performance.now();
    lastFrameTime = performance.now();
    requestAnimationFrame(mainGameLoop);
  });
}

// Window init loads
window.addEventListener('load', () => {
  updateHighScoreUI();
  generateObstacles();
  
  snake = [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 }
  ];
  food = { x: 13, y: 10, popScale: 1 };
  
  renderCanvas();
});
