const GAME_STATE = {
  MENU: "MENU",
  COUNTDOWN: "COUNTDOWN",
  FIGHT: "FIGHT",
  ROUND_OVER: "ROUND_OVER",
  MATCH_OVER: "MATCH_OVER"
};

const MODE = {
  JOURNEY: "JOURNEY",
  MULTI: "MULTI",
  ENDURANCE: "ENDURANCE"
};

const ARENA = {
  x: 0,
  y: 0,
  radius: 0
};

const CONTROL_PRESETS = [
  { name: "P1", up: 87, down: 83, left: 65, right: 68 },
  { name: "P2", up: UP_ARROW, down: DOWN_ARROW, left: LEFT_ARROW, right: RIGHT_ARROW },
  { name: "P3", up: 73, down: 75, left: 74, right: 76 },
  { name: "P4", up: 84, down: 71, left: 70, right: 72 }
];

let state = GAME_STATE.MENU;
let mode = MODE.JOURNEY;
let players = [];
let aiControllers = [];
let powerups = [];

let countdownFrames = 0;
let roundResultText = "";
let roundOverFrames = 0;

let journeyStage = 1;
let journeyBestOfScore = [0, 0];

let multiplayerCount = 2;
let multiplayerWins = [0, 0, 0, 0];
let multiplayerRound = 1;

let enduranceScore = 0;
let enduranceLives = 3;
let enduranceSpawnTimer = 0;

let menuButtons = [];

function setup() {
  createCanvas(960, 640);
  ARENA.x = width * 0.5;
  ARENA.y = height * 0.55;
  ARENA.radius = min(width, height) * 0.33;
  textFont("Verdana");
  configureMenuButtons();
}

function draw() {
  drawBackground();

  if (state === GAME_STATE.MENU) {
    drawMenu();
    return;
  }

  drawArena();

  if (state === GAME_STATE.COUNTDOWN || state === GAME_STATE.FIGHT) {
    if (state === GAME_STATE.FIGHT) {
      updateSimulation();
    }
    drawPlayers();
    drawPowerups();
    drawHud();
    drawCountdownOverlay();
    if (state === GAME_STATE.COUNTDOWN) {
      updateCountdown();
    }
    return;
  }

  if (state === GAME_STATE.ROUND_OVER) {
    drawPlayers();
    drawPowerups();
    drawHud();
    drawRoundOverOverlay();
    updateRoundOver();
    return;
  }

  if (state === GAME_STATE.MATCH_OVER) {
    drawPlayers();
    drawHud();
    drawMatchOverOverlay();
  }
}

function configureMenuButtons() {
  menuButtons = [
    { mode: MODE.JOURNEY, text: "Journey Mode", x: width * 0.5, y: 260, w: 300, h: 60 },
    { mode: MODE.MULTI, text: "Multiplayer Mode", x: width * 0.5, y: 340, w: 300, h: 60 },
    { mode: MODE.ENDURANCE, text: "Endurance Mode", x: width * 0.5, y: 420, w: 300, h: 60 }
  ];
}

function startMode(nextMode) {
  mode = nextMode;
  players = [];
  aiControllers = [];
  powerups = [];

  if (mode === MODE.JOURNEY) {
    journeyStage = max(1, journeyStage);
    journeyBestOfScore = [0, 0];
    setupJourneyRound();
  } else if (mode === MODE.MULTI) {
    multiplayerRound = 1;
    setupMultiplayerRound();
  } else {
    enduranceScore = 0;
    enduranceLives = 3;
    setupEnduranceStart();
  }

  beginCountdown();
}

function setupJourneyRound() {
  players = [];
  aiControllers = [];
  powerups = [];

  const hero = new Player(ARENA.x - 110, ARENA.y, color(52, 157, 255), CONTROL_PRESETS[0], false);
  hero.mass = 1.05;
  hero.maxSpeed = 4.35;

  const enemy = new Player(ARENA.x + 110, ARENA.y, color(255, 100, 64), null, true);
  enemy.mass = 0.98 + journeyStage * 0.1;
  enemy.maxSpeed = 3.9 + min(1.8, journeyStage * 0.18);

  players.push(hero, enemy);
  aiControllers.push(new AIController(enemy));
}

function setupMultiplayerRound() {
  players = [];
  aiControllers = [];
  powerups = [];
  const ringR = ARENA.radius * 0.58;

  for (let i = 0; i < multiplayerCount; i++) {
    const a = (TWO_PI * i) / multiplayerCount;
    const px = ARENA.x + cos(a) * ringR;
    const py = ARENA.y + sin(a) * ringR;
    const c = color(80 + i * 45, 180 - i * 20, 130 + i * 25);
    players.push(new Player(px, py, c, CONTROL_PRESETS[i], false));
  }
}

function setupEnduranceStart() {
  players = [];
  aiControllers = [];
  powerups = [];

  const hero = new Player(ARENA.x, ARENA.y, color(80, 220, 130), CONTROL_PRESETS[0], false);
  hero.mass = 1.08;
  hero.maxSpeed = 4.45;
  players.push(hero);

  spawnEnduranceEnemy();
  spawnEnduranceEnemy();
  enduranceSpawnTimer = 360;
}

function spawnEnduranceEnemy() {
  const a = random(TWO_PI);
  const r = ARENA.radius * random(0.68, 0.86);
  const enemy = new Player(ARENA.x + cos(a) * r, ARENA.y + sin(a) * r, color(255, 180, 70), null, true);
  enemy.mass = random(0.9, 1.28);
  enemy.maxSpeed = random(3.7, 5.0);
  players.push(enemy);
  aiControllers.push(new AIController(enemy));
}

function beginCountdown() {
  state = GAME_STATE.COUNTDOWN;
  countdownFrames = 180;
}

function updateCountdown() {
  countdownFrames--;
  if (countdownFrames <= 0) {
    state = GAME_STATE.FIGHT;
  }
}

function updateSimulation() {
  maybeSpawnPowerup();
  updatePowerups();

  for (let i = aiControllers.length - 1; i >= 0; i--) {
    aiControllers[i].update();
  }

  for (let i = 0; i < players.length; i++) {
    players[i].update();
  }

  handlePlayerCollisions();
  applyArenaFriction();
  checkRingOuts();

  if (mode === MODE.ENDURANCE) {
    updateEnduranceFlow();
  }
}

function applyArenaFriction() {
  for (const p of players) {
    if (p.isOut) {
      continue;
    }
    p.vel.mult(0.988);
  }
}

function handlePlayerCollisions() {
  for (let i = 0; i < players.length; i++) {
    const a = players[i];
    if (a.isOut) {
      continue;
    }
    for (let j = i + 1; j < players.length; j++) {
      const b = players[j];
      if (b.isOut) {
        continue;
      }

      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const d = sqrt(dx * dx + dy * dy);
      const minD = a.radius + b.radius;
      if (d <= 0 || d >= minD) {
        continue;
      }

      const nx = dx / d;
      const ny = dy / d;
      const overlap = minD - d;

      a.pos.x -= nx * overlap * 0.5;
      a.pos.y -= ny * overlap * 0.5;
      b.pos.x += nx * overlap * 0.5;
      b.pos.y += ny * overlap * 0.5;

      const rvx = b.vel.x - a.vel.x;
      const rvy = b.vel.y - a.vel.y;
      const normalVel = rvx * nx + rvy * ny;
      if (normalVel > 0) {
        continue;
      }

      const restitution = 0.85;
      const impulse = (-(1 + restitution) * normalVel) / (1 / a.mass + 1 / b.mass);
      const ix = impulse * nx;
      const iy = impulse * ny;

      a.vel.x -= ix / a.mass;
      a.vel.y -= iy / a.mass;
      b.vel.x += ix / b.mass;
      b.vel.y += iy / b.mass;
    }
  }
}

function checkRingOuts() {
  const ringLimit = ARENA.radius;
  const eliminatedThisFrame = [];

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (p.isOut) {
      continue;
    }
    const d = dist(p.pos.x, p.pos.y, ARENA.x, ARENA.y);
    if (d > ringLimit - p.radius * 0.2) {
      p.isOut = true;
      eliminatedThisFrame.push(i);
    }
  }

  if (eliminatedThisFrame.length > 0) {
    onEliminations(eliminatedThisFrame);
  }
}

function onEliminations(eliminatedIndexes) {
  if (mode === MODE.JOURNEY) {
    const heroOut = players[0].isOut;
    if (heroOut) {
      journeyBestOfScore[1]++;
      roundResultText = "You were ringed out";
    } else {
      journeyBestOfScore[0]++;
      roundResultText = "Enemy ringed out";
    }
    state = GAME_STATE.ROUND_OVER;
    roundOverFrames = 120;
    return;
  }

  if (mode === MODE.MULTI) {
    const alive = getAlivePlayerIndexes();
    if (alive.length <= 1) {
      if (alive.length === 1) {
        multiplayerWins[alive[0]]++;
        roundResultText = `Player ${alive[0] + 1} wins round ${multiplayerRound}`;
      } else {
        roundResultText = `Round ${multiplayerRound} draw`;
      }
      multiplayerRound++;
      state = GAME_STATE.ROUND_OVER;
      roundOverFrames = 120;
    }
    return;
  }

  if (mode === MODE.ENDURANCE) {
    const hero = players[0];
    if (eliminatedIndexes.includes(0)) {
      enduranceLives--;
      if (enduranceLives <= 0) {
        roundResultText = `Endurance over. KO score: ${enduranceScore}`;
        state = GAME_STATE.MATCH_OVER;
      } else {
        roundResultText = "Life lost";
        state = GAME_STATE.ROUND_OVER;
        roundOverFrames = 90;
      }
      return;
    }

    for (const idx of eliminatedIndexes) {
      if (idx !== 0) {
        enduranceScore++;
      }
    }

    const survivorEnemies = players.filter((p, idx) => idx !== 0 && !p.isOut).length;
    if (survivorEnemies < 2) {
      spawnEnduranceEnemy();
    }
  }
}

function updateRoundOver() {
  roundOverFrames--;
  if (roundOverFrames > 0) {
    return;
  }

  if (mode === MODE.JOURNEY) {
    if (journeyBestOfScore[0] >= 2) {
      journeyStage++;
      if (journeyStage > 6) {
        roundResultText = "Journey complete";
        state = GAME_STATE.MATCH_OVER;
      } else {
        journeyBestOfScore = [0, 0];
        setupJourneyRound();
        beginCountdown();
      }
      return;
    }

    if (journeyBestOfScore[1] >= 2) {
      roundResultText = "Journey failed";
      state = GAME_STATE.MATCH_OVER;
      return;
    }

    setupJourneyRound();
    beginCountdown();
    return;
  }

  if (mode === MODE.MULTI) {
    if (multiplayerRound > 5) {
      roundResultText = resolveMultiplayerChampion();
      state = GAME_STATE.MATCH_OVER;
    } else {
      setupMultiplayerRound();
      beginCountdown();
    }
    return;
  }

  if (mode === MODE.ENDURANCE) {
    resetHeroAfterLifeLoss();
    beginCountdown();
  }
}

function resolveMultiplayerChampion() {
  let best = 0;
  for (let i = 1; i < multiplayerCount; i++) {
    if (multiplayerWins[i] > multiplayerWins[best]) {
      best = i;
    }
  }
  return `Player ${best + 1} is champion`;
}

function resetHeroAfterLifeLoss() {
  const hero = players[0];
  hero.isOut = false;
  hero.pos.set(ARENA.x, ARENA.y);
  hero.vel.set(0, 0);

  for (let i = players.length - 1; i >= 1; i--) {
    if (players[i].isOut) {
      players.splice(i, 1);
    }
  }

  aiControllers = aiControllers.filter((ctrl) => !ctrl.player.isOut);
  while (players.filter((p, idx) => idx !== 0 && !p.isOut).length < 2) {
    spawnEnduranceEnemy();
  }
}

function updateEnduranceFlow() {
  enduranceSpawnTimer--;
  if (enduranceSpawnTimer <= 0) {
    spawnEnduranceEnemy();
    enduranceSpawnTimer = int(random(260, 420));
  }
}

function maybeSpawnPowerup() {
  if (powerups.length >= 1) {
    return;
  }
  if (random() < 0.0026) {
    const angle = random(TWO_PI);
    const r = random(ARENA.radius * 0.08, ARENA.radius * 0.6);
    powerups.push(new Powerup(ARENA.x + cos(angle) * r, ARENA.y + sin(angle) * r));
  }
}

function updatePowerups() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const pu = powerups[i];
    pu.life--;
    for (let j = 0; j < players.length; j++) {
      const p = players[j];
      if (p.isOut) {
        continue;
      }
      if (dist(p.pos.x, p.pos.y, pu.pos.x, pu.pos.y) <= p.radius + pu.radius) {
        p.vel.mult(1.32);
        p.maxSpeed = min(6.4, p.maxSpeed + 0.5);
        powerups.splice(i, 1);
        break;
      }
    }
    if (i < powerups.length && pu.life <= 0) {
      powerups.splice(i, 1);
    }
  }
}

function drawBackground() {
  for (let y = 0; y < height; y += 3) {
    const t = y / height;
    const c = lerpColor(color(16, 28, 42), color(7, 11, 20), t);
    stroke(c);
    line(0, y, width, y);
  }
  noStroke();
}

function drawArena() {
  push();
  translate(ARENA.x, ARENA.y);

  noStroke();
  fill(28, 36, 48, 240);
  ellipse(0, 0, ARENA.radius * 2.08);

  stroke(240, 220, 160);
  strokeWeight(8);
  noFill();
  ellipse(0, 0, ARENA.radius * 2);

  stroke(240, 220, 160, 120);
  strokeWeight(2);
  for (let i = -2; i <= 2; i++) {
    line(-ARENA.radius * 0.85, i * 28, ARENA.radius * 0.85, i * 28);
  }

  pop();
}

function drawPlayers() {
  for (const p of players) {
    p.draw();
  }
}

function drawPowerups() {
  for (const pu of powerups) {
    pu.draw();
  }
}

function drawHud() {
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(17);

  if (mode === MODE.JOURNEY) {
    text(`Journey Stage: ${journeyStage}`, 18, 16);
    text(`Round Score: ${journeyBestOfScore[0]} - ${journeyBestOfScore[1]}`, 18, 40);
  } else if (mode === MODE.MULTI) {
    text(`Multiplayer Round: ${multiplayerRound}/5`, 18, 16);
    text(`P1 ${multiplayerWins[0]}  P2 ${multiplayerWins[1]}  P3 ${multiplayerWins[2]}  P4 ${multiplayerWins[3]}`, 18, 40);
  } else {
    text(`Endurance KO: ${enduranceScore}`, 18, 16);
    text(`Lives: ${enduranceLives}`, 18, 40);
  }

  textAlign(RIGHT, TOP);
  textSize(14);
  text("Esc: Menu", width - 16, 16);
}

function drawCountdownOverlay() {
  if (state !== GAME_STATE.COUNTDOWN) {
    return;
  }
  const sec = ceil(countdownFrames / 60);
  let label = "FIGHT";
  if (sec >= 1) {
    label = String(sec);
  }

  push();
  textAlign(CENTER, CENTER);
  textSize(96);
  fill(255, 250, 220);
  stroke(20, 20, 20, 120);
  strokeWeight(8);
  text(label, width * 0.5, height * 0.42);
  pop();
}

function drawRoundOverOverlay() {
  drawOverlayPanel();
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(52);
  text("ROUND OVER", width * 0.5, height * 0.37);
  textSize(24);
  text(roundResultText, width * 0.5, height * 0.47);
}

function drawMatchOverOverlay() {
  drawOverlayPanel();
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(56);
  text("MATCH COMPLETE", width * 0.5, height * 0.34);
  textSize(24);
  text(roundResultText, width * 0.5, height * 0.45);

  textSize(18);
  text("Press Enter to return to menu", width * 0.5, height * 0.56);
}

function drawOverlayPanel() {
  noStroke();
  fill(0, 0, 0, 140);
  rect(0, 0, width, height);
}

function drawMenu() {
  textAlign(CENTER, CENTER);
  fill(245);
  textSize(66);
  text("SUMO RING RUSH", width * 0.5, 126);

  textSize(18);
  fill(220);
  text("Original p5.js arena brawler inspired by classic sumo ring-out games", width * 0.5, 176);

  for (const btn of menuButtons) {
    const hovered = isInside(mouseX, mouseY, btn.x, btn.y, btn.w, btn.h);
    fill(hovered ? color(255, 196, 92) : color(230, 170, 70));
    rectMode(CENTER);
    rect(btn.x, btn.y, btn.w, btn.h, 12);
    fill(20);
    textSize(24);
    text(btn.text, btn.x, btn.y + 2);
  }

  fill(220);
  textSize(17);
  text(`Multiplayer count: ${multiplayerCount} (press 2, 3, or 4 in menu)`, width * 0.5, 520);
  text("Controls: P1 WASD, P2 Arrows, P3 IJKL, P4 TFGH", width * 0.5, 548);

  textSize(15);
  text("Credits: Game by your studio", width * 0.5, 594);
}

function getAlivePlayerIndexes() {
  const alive = [];
  for (let i = 0; i < players.length; i++) {
    if (!players[i].isOut) {
      alive.push(i);
    }
  }
  return alive;
}

function mousePressed() {
  if (state !== GAME_STATE.MENU) {
    return;
  }
  for (const btn of menuButtons) {
    if (isInside(mouseX, mouseY, btn.x, btn.y, btn.w, btn.h)) {
      if (btn.mode === MODE.JOURNEY) {
        journeyStage = 1;
      }
      startMode(btn.mode);
      return;
    }
  }
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    toMenu();
    return;
  }

  if (state === GAME_STATE.MATCH_OVER && keyCode === ENTER) {
    toMenu();
    return;
  }

  if (state === GAME_STATE.MENU && (key === "2" || key === "3" || key === "4")) {
    multiplayerCount = int(key);
  }
}

function toMenu() {
  state = GAME_STATE.MENU;
  players = [];
  aiControllers = [];
  powerups = [];
}

function isInside(px, py, x, y, w, h) {
  return px >= x - w * 0.5 && px <= x + w * 0.5 && py >= y - h * 0.5 && py <= y + h * 0.5;
}

class Player {
  constructor(x, y, skinColor, controls, isAI) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.color = skinColor;
    this.controls = controls;
    this.isAI = isAI;
    this.isOut = false;
    this.radius = 22;
    this.mass = 1;
    this.maxSpeed = 4.2;
    this.accel = 0.4;
  }

  update() {
    if (this.isOut) {
      return;
    }
    if (!this.isAI && this.controls) {
      const input = createVector(0, 0);
      if (keyIsDown(this.controls.up)) input.y -= 1;
      if (keyIsDown(this.controls.down)) input.y += 1;
      if (keyIsDown(this.controls.left)) input.x -= 1;
      if (keyIsDown(this.controls.right)) input.x += 1;

      if (input.magSq() > 0) {
        input.normalize().mult(this.accel);
        this.vel.add(input);
      }
    }

    if (this.vel.mag() > this.maxSpeed) {
      this.vel.setMag(this.maxSpeed);
    }
    this.pos.add(this.vel);
  }

  draw() {
    if (this.isOut) {
      return;
    }
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill(this.color);
    ellipse(0, 0, this.radius * 2.2, this.radius * 2.2);
    fill(255, 220, 190);
    ellipse(0, -this.radius * 0.78, this.radius * 1.15, this.radius * 1.15);
    fill(40);
    ellipse(-4, -this.radius * 0.82, 3.2, 3.2);
    ellipse(4, -this.radius * 0.82, 3.2, 3.2);
    pop();
  }
}

class AIController {
  constructor(player) {
    this.player = player;
    this.retargetTimer = 0;
    this.target = null;
  }

  update() {
    if (this.player.isOut || state !== GAME_STATE.FIGHT) {
      return;
    }
    this.retargetTimer--;
    if (this.retargetTimer <= 0 || !this.target || this.target.isOut) {
      this.target = this.findTarget();
      this.retargetTimer = int(random(14, 34));
    }
    if (!this.target) {
      return;
    }

    const pushVec = p5.Vector.sub(this.target.pos, this.player.pos);
    if (pushVec.magSq() > 0.001) {
      pushVec.normalize().mult(this.player.accel * random(0.75, 1.15));
      this.player.vel.add(pushVec);
    }
  }

  findTarget() {
    let best = null;
    let bestD = Infinity;
    for (const p of players) {
      if (p === this.player || p.isOut) {
        continue;
      }
      const d = p5.Vector.dist(this.player.pos, p.pos);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }
}

class Powerup {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.radius = 10;
    this.life = 420;
  }

  draw() {
    const pulse = 0.86 + sin(frameCount * 0.16) * 0.12;
    noStroke();
    fill(255, 235, 95, 210);
    ellipse(this.pos.x, this.pos.y, this.radius * 2.4 * pulse);
    fill(255, 250, 190);
    ellipse(this.pos.x, this.pos.y, this.radius * 1.2 * pulse);
  }
}