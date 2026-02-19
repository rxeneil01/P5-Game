// Push Out! Arena Game
let players = [];
let aiControllers = [];
let powerUps = [];
let arena = { x: 400, y: 300, radius: 250 };
let round = 1;
let scores = [0, 0];
let state = "MENU";
let countdown = 0;
let controlMode = "COMPUTER";

function setup() {
  createCanvas(800, 600);
  detectControls();
  startGame();
}

function startGame() {
  players = [
    new Player(arena.x - 100, arena.y, color(0, 150, 255)),
    new Player(arena.x + 100, arena.y, color(255, 80, 80))
  ];
  aiControllers = [];
  powerUps = [];
  round = 1;
  scores = [0, 0];
  state = "COUNTDOWN";
  countdown = 3;
}

function draw() {
  background(40);
  drawArena();
  if (state === "MENU") {
    drawMenuButton();
    // ...menu rendering...
    return;
  }
  if (state === "COUNTDOWN") {
    drawCountdown();
    updateCountdown();
    return;
  }
  if (state === "FIGHT") {
    for (let p of players) p.update();
    for (let p of players) p.draw();
    for (let ai of aiControllers) ai.update();
    for (let pu of powerUps) pu.draw();
    checkRingOut();
    drawHUD();
  }
  if (state === "KO") {
    drawKO();
  }
}

function drawArena() {
  fill(80);
  ellipse(arena.x, arena.y, arena.radius * 2);
}

function checkRingOut() {
  for (let i = 0; i < players.length; i++) {
    let p = players[i];
    let d = dist(p.x, p.y, arena.x, arena.y);
    if (!p.isKO && d > arena.radius) {
      p.isKO = true;
      scores[i === 0 ? 1 : 0]++;
      state = "KO";
      setTimeout(nextRound, 1200);
    }
  }
}

function nextRound() {
  if (scores[0] === 2 || scores[1] === 2) {
    state = "MENU";
    // ...show winner...
    return;
  }
  players[0].x = arena.x - 100;
  players[0].y = arena.y;
  players[1].x = arena.x + 100;
  players[1].y = arena.y;
  players[0].vel.set(0, 0);
  players[1].vel.set(0, 0);
  players[0].isKO = false;
  players[1].isKO = false;
  round++;
  state = "COUNTDOWN";
  countdown = 3;
}

function drawCountdown() {
  textSize(60);
  fill(255);
  textAlign(CENTER, CENTER);
  text(countdown > 0 ? countdown : "FIGHT", width / 2, height / 2);
}

function updateCountdown() {
  if (frameCount % 60 === 0 && countdown > 0) countdown--;
  if (countdown <= 0) state = "FIGHT";
}

function drawHUD() {
  drawMenuButton();
  textSize(24);
  fill(255);
  textAlign(CENTER, TOP);
  text(`Round: ${round}`, width / 2, 10);
  drawExpBar(players[0]);
  drawExpBar(players[1]);
}

function detectControls() {
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
    controlMode = "PHONE";
  } else {
    controlMode = "COMPUTER";
  }
}

function expToLevel(level) {
  return 100 + level * 50;
}