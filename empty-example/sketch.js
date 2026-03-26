// ----- GLOBAL STATE -----
let state = "MENU"; // MENU, MODE_SELECT, INSTRUCTIONS, OPTIONS, TIPS, GAME
let gameMode = null; // "journey", "multiplayer", "endurance"
let buttons = [];
let level = 1; // journey level
let maxLevel = 10; // arbitrary
let journeyUnlocked = [true]; // level 1 always unlocked
let enduranceScore = 0;
let gameOver = false;
let gameWinner = null;
let aiCount = 1; // for endurance spawn

// Physics globals
let wrestlers = [];
let ringRadius = 250;
let wrestlerRadius = 20;
let ringCenter;

// Keys tracking
let keysPressed = {};

// Saved data
let savedLevel = 1;

// ----- HELPER FUNCTIONS -----
class Button {
    constructor(x, y, w, h, label, action) {
        this.x = x; this.y = y; this.w = w; this.h = h; this.label = label; this.action = action;
    }
    display() {
        push();
        stroke(80, 50, 20); strokeWeight(3); fill(220, 180, 120);
        rect(this.x, this.y, this.w, this.h, 12);
        fill(40, 20, 5); noStroke(); textAlign(CENTER, CENTER); textSize(20);
        text(this.label, this.x + this.w/2, this.y + this.h/2);
        pop();
    }
    isMouseInside(mx, my) {
        return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
    }
}

// ----- RESET GAME FUNCTIONS -----
function startJourney() {
    gameMode = "journey";
    level = savedLevel; // load saved level
    if (level > maxLevel) level = maxLevel;
    startLevel(level);
    state = "GAME";
}

function startLevel(lvl) {
    wrestlers = [];
    // Player
    wrestlers.push(new Wrestler(ringCenter.x - 50, ringCenter.y, wrestlerRadius, color(200, 70, 70), false, "player"));
    // AI opponent (stronger with level)
    let aiSpeed = 2 + lvl * 0.3;
    wrestlers.push(new Wrestler(ringCenter.x + 50, ringCenter.y, wrestlerRadius, color(70, 70, 200), true, "ai", aiSpeed));
}

function startMultiplayer() {
    gameMode = "multiplayer";
    wrestlers = [];
    // 4 players with different colors and control schemes
    wrestlers.push(new Wrestler(ringCenter.x - 60, ringCenter.y - 30, wrestlerRadius, color(200, 70, 70), false, "p1")); // red
    wrestlers.push(new Wrestler(ringCenter.x + 60, ringCenter.y + 30, wrestlerRadius, color(70, 200, 70), false, "p2")); // green
    wrestlers.push(new Wrestler(ringCenter.x - 30, ringCenter.y + 60, wrestlerRadius, color(70, 70, 200), false, "p3")); // blue
    wrestlers.push(new Wrestler(ringCenter.x + 30, ringCenter.y - 60, wrestlerRadius, color(200, 200, 70), false, "p4")); // yellow
    state = "GAME";
}

function startEndurance() {
    gameMode = "endurance";
    wrestlers = [];
    wrestlers.push(new Wrestler(ringCenter.x, ringCenter.y, wrestlerRadius, color(200, 70, 70), false, "player"));
    // start with 2 AI
    for (let i = 0; i < 2; i++) {
        let angle = random(TWO_PI);
        let r = random(100, 180);
        wrestlers.push(new Wrestler(ringCenter.x + cos(angle)*r, ringCenter.y + sin(angle)*r, wrestlerRadius, color(70, 70, 200), true, "ai", 2.5));
    }
    enduranceScore = 0;
    state = "GAME";
}

// ----- WRESTLER CLASS -----
class Wrestler {
    constructor(x, y, r, col, isAI, id, speed=2.5) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.r = r;
        this.col = col;
        this.isAI = isAI;
        this.id = id; // "player", "p1", "p2", "p3", "p4", "ai"
        this.speed = speed;
        this.active = true;
        this.mass = 1; // all equal for simplicity
    }

    applyForce(force) {
        this.vel.add(force);
    }

    update() {
        if (!this.active) return;
        // AI movement
        if (this.isAI) {
            if (gameMode === "journey" || gameMode === "endurance") {
                // find player (non-AI)
                let target = wrestlers.find(w => w.active && !w.isAI);
                if (target) {
                    let dir = p5.Vector.sub(target.pos, this.pos);
                    if (dir.mag() > 5) {
                        dir.setMag(this.speed * 0.15);
                        this.vel.add(dir);
                    }
                }
            } else if (gameMode === "multiplayer") {
                // In multiplayer, AI not used; but just in case, do nothing
            }
        } else {
            // Human controls based on id
            let acc = createVector(0, 0);
            if (this.id === "player" || this.id === "p1") { // arrow keys
                if (keysPressed['ArrowUp']) acc.y -= 1;
                if (keysPressed['ArrowDown']) acc.y += 1;
                if (keysPressed['ArrowLeft']) acc.x -= 1;
                if (keysPressed['ArrowRight']) acc.x += 1;
            } else if (this.id === "p2") { // WASD
                if (keysPressed['w'] || keysPressed['W']) acc.y -= 1;
                if (keysPressed['s'] || keysPressed['S']) acc.y += 1;
                if (keysPressed['a'] || keysPressed['A']) acc.x -= 1;
                if (keysPressed['d'] || keysPressed['D']) acc.x += 1;
            } else if (this.id === "p3") { // TFGH (T up, F down, G left, H right)
                if (keysPressed['t'] || keysPressed['T']) acc.y -= 1;
                if (keysPressed['f'] || keysPressed['F']) acc.y += 1;
                if (keysPressed['g'] || keysPressed['G']) acc.x -= 1;
                if (keysPressed['h'] || keysPressed['H']) acc.x += 1;
            } else if (this.id === "p4") { // IJKL (I up, K down, J left, L right)
                if (keysPressed['i'] || keysPressed['I']) acc.y -= 1;
                if (keysPressed['k'] || keysPressed['K']) acc.y += 1;
                if (keysPressed['j'] || keysPressed['J']) acc.x -= 1;
                if (keysPressed['l'] || keysPressed['L']) acc.x += 1;
            }
            if (acc.mag() > 0) {
                acc.setMag(this.speed * 0.2);
                this.vel.add(acc);
            }
        }

        // friction
        this.vel.mult(0.98);

        // update position
        this.pos.add(this.vel);
    }

    display() {
        if (!this.active) return;
        push();
        translate(this.pos.x, this.pos.y);
        fill(this.col);
        stroke(40); strokeWeight(2);
        ellipse(0, 0, this.r*2);
        // face indicator
        fill(255);
        noStroke();
        ellipse(-6, -6, 8); ellipse(6, -6, 8);
        fill(0);
        ellipse(-6, -6, 4); ellipse(6, -6, 4);
        pop();
    }
}

// ----- COLLISION HANDLING -----
function handleCollisions() {
    for (let i = 0; i < wrestlers.length; i++) {
        if (!wrestlers[i].active) continue;
        for (let j = i+1; j < wrestlers.length; j++) {
            if (!wrestlers[j].active) continue;
            let a = wrestlers[i];
            let b = wrestlers[j];
            let delta = p5.Vector.sub(b.pos, a.pos);
            let dist = delta.mag();
            let minDist = a.r + b.r;
            if (dist < minDist) {
                // push apart
                let overlap = minDist - dist;
                let dir = delta.copy().normalize();
                if (dist === 0) dir = p5.Vector.random2D(); // rare
                // equal mass => move both
                a.pos.sub(dir.copy().mult(overlap * 0.5));
                b.pos.add(dir.copy().mult(overlap * 0.5));

                // elastic collision (equal mass)
                let vRel = p5.Vector.sub(a.vel, b.vel);
                let velAlong = vRel.dot(dir);
                if (velAlong > 0) continue; // moving apart
                let impulse = 2 * velAlong / (a.mass + b.mass);
                a.vel.sub(dir.copy().mult(impulse * b.mass));
                b.vel.add(dir.copy().mult(impulse * a.mass));
            }
        }
    }
}

// ----- RING BOUNDARY CHECK -----
function checkBoundary() {
    for (let i = wrestlers.length-1; i >= 0; i--) {
        let w = wrestlers[i];
        if (!w.active) continue;
        let fromCenter = p5.Vector.sub(w.pos, ringCenter);
        let dist = fromCenter.mag();
        if (dist + w.r > ringRadius) { // center + radius outside ring
            w.active = false;
            if (!w.isAI) {
                // player lost
                if (gameMode === "journey") {
                    gameOver = true;
                    // stay in game to show loss, then back
                } else if (gameMode === "multiplayer") {
                    // check if only one left
                } else if (gameMode === "endurance") {
                    // player lost, game over
                    if (w.id === "player") gameOver = true;
                }
            } else {
                // AI lost
                if (gameMode === "endurance") enduranceScore++;
                if (gameMode === "journey") {
                    // player wins the level
                    if (!gameOver) {
                        if (level < maxLevel) {
                            level++;
                            savedLevel = level;
                            localStorage.setItem('pushOutLevel', level);
                            startLevel(level); // reload with new level
                        } else {
                            // beat the game
                            gameOver = true;
                        }
                    }
                }
            }
        }
    }

    // remove inactive
    wrestlers = wrestlers.filter(w => w.active);

    // check win conditions for multiplayer
    if (gameMode === "multiplayer") {
        let activePlayers = wrestlers.filter(w => w.active);
        if (activePlayers.length === 1) {
            gameWinner = activePlayers[0].id;
            gameOver = true;
        } else if (activePlayers.length === 0) {
            gameWinner = "Nobody";
            gameOver = true;
        }
    }

    // endurance: spawn new AI if less than 2
    if (gameMode === "endurance" && !gameOver) {
        let aiWrestlers = wrestlers.filter(w => w.isAI);
        if (aiWrestlers.length < 2) {
            let angle = random(TWO_PI);
            let r = random(150, 200);
            wrestlers.push(new Wrestler(ringCenter.x + cos(angle)*r, ringCenter.y + sin(angle)*r, wrestlerRadius, color(70, 70, 200), true, "ai", 2.5 + level*0.2));
        }
    }
}

// ----- P5 FUNCTIONS -----
function setup() {
    createCanvas(800, 600);
    ringCenter = createVector(width/2, height/2);
    // load saved level
    let stored = localStorage.getItem('pushOutLevel');
    if (stored) savedLevel = int(stored);
    else savedLevel = 1;
    level = savedLevel;

    // define buttons (will be positioned in draw depending on state)
}

function draw() {
    background(140, 190, 220); // sky blue
    // draw ring (dohyo)
    push();
    stroke(100, 70, 30); strokeWeight(6); fill(210, 180, 140);
    ellipse(ringCenter.x, ringCenter.y, ringRadius*2);
    stroke(150, 120, 80); strokeWeight(2); noFill();
    ellipse(ringCenter.x, ringCenter.y, ringRadius*2 - 10);
    pop();

    if (state === "MENU") drawMenu();
    else if (state === "MODE_SELECT") drawModeSelect();
    else if (state === "INSTRUCTIONS") drawInstructions();
    else if (state === "OPTIONS") drawOptions();
    else if (state === "TIPS") drawTips();
    else if (state === "GAME") drawGame();

    // back button if in sub-screens (except menu and game)
    if (state !== "MENU" && state !== "GAME") {
        fill(80, 50, 30); noStroke(); rect(20, height-60, 100, 40, 10);
        fill(240); textAlign(CENTER, CENTER); textSize(18); text("Back", 70, height-40);
    }
}

function mousePressed() {
    // check back button
    if (state !== "MENU" && state !== "GAME") {
        if (mouseX > 20 && mouseX < 120 && mouseY > height-60 && mouseY < height-20) {
            state = "MENU";
            return;
        }
    }

    if (state === "MENU") {
        // Play, Instructions, Option
        if (mouseX > 300 && mouseX < 500 && mouseY > 200 && mouseY < 260) state = "MODE_SELECT";
        if (mouseX > 300 && mouseX < 500 && mouseY > 280 && mouseY < 340) state = "INSTRUCTIONS";
        if (mouseX > 300 && mouseX < 500 && mouseY > 360 && mouseY < 420) state = "OPTIONS";
    }
    else if (state === "MODE_SELECT") {
        // Journey, Multiplayer, Endurance, Tips, Main Menu
        if (mouseX > 300 && mouseX < 500 && mouseY > 150 && mouseY < 200) startJourney();
        if (mouseX > 300 && mouseX < 500 && mouseY > 210 && mouseY < 260) startMultiplayer();
        if (mouseX > 300 && mouseX < 500 && mouseY > 270 && mouseY < 320) startEndurance();
        if (mouseX > 300 && mouseX < 500 && mouseY > 330 && mouseY < 380) state = "TIPS";
        if (mouseX > 300 && mouseX < 500 && mouseY > 390 && mouseY < 440) state = "MENU";
    }
    else if (state === "OPTIONS") {
        // clear saved data button
        if (mouseX > 250 && mouseX < 550 && mouseY > 300 && mouseY < 360) {
            savedLevel = 1;
            level = 1;
            localStorage.setItem('pushOutLevel', 1);
        }
    }
    else if (state === "GAME") {
        // if game over, click anywhere to return to mode select
        if (gameOver) {
            state = "MODE_SELECT";
            gameOver = false;
        }
    }
}

function keyPressed() {
    keysPressed[key] = true;
    // prevent page scrolling
    if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight" ||
        key === "w" || key === "W" || key === "s" || key === "S" || key === "a" || key === "A" || key === "d" || key === "D" ||
        key === "t" || key === "T" || key === "f" || key === "F" || key === "g" || key === "G" || key === "h" || key === "H" ||
        key === "i" || key === "I" || key === "j" || key === "J" || key === "k" || key === "K" || key === "l" || key === "L") {
        return false;
    }
}

function keyReleased() {
    delete keysPressed[key];
}

// ----- DRAW SCREENS -----
function drawMenu() {
    push();
    textAlign(CENTER); textSize(64); fill(80, 40, 20); stroke(240, 200, 100); strokeWeight(4);
    text("Push Out!", width/2, 120);
    noStroke(); fill(0); textSize(18); fill(50); text("Sumo Wrestling Game", width/2, 170);

    // Buttons
    fill(180, 130, 70); stroke(80, 40, 10); strokeWeight(3);
    rect(300, 200, 200, 60, 15); rect(300, 280, 200, 60, 15); rect(300, 360, 200, 60, 15);
    fill(255); textSize(28); noStroke();
    text("Play", 400, 230); text("Instructions", 400, 310); text("Option", 400, 390);
    pop();
}

function drawModeSelect() {
    push();
    textAlign(CENTER); textSize(40); fill(80, 40, 20); text("Choose Your Mode", width/2, 80);
    textSize(20); fill(0); text("(Select a game mode)", width/2, 120);

    let yStart = 150;
    let labels = ["Journey Mode", "Multiplayer", "Endurance", "Tips and Tricks", "Main Menu"];
    for (let i=0; i<labels.length; i++) {
        fill(200, 160, 100); stroke(80,40,10); strokeWeight(2);
        rect(300, yStart + i*60, 200, 50, 10);
        fill(30); noStroke(); textSize(20);
        text(labels[i], 400, yStart + i*60 + 25);
    }
    pop();
}

function drawInstructions() {
    push();
    textAlign(LEFT); textSize(28); fill(50); text("Instructions", 80, 80);
    textSize(16); fill(0); textLeading(22);
    text("Control your character and attempt to bump the other players off of the sides in 3 different exciting gameplay modes.\n\n*Journey Mode: Travel through “Sumo Land” and try to place first on every level. Beating a level will unlock it for play in multiplayer mode, and allow you to compete in the next location.\n- 1 Player Controls (arrow keys)\n\n*Multiplayer mode: Up to four people may play in multiplayer mode.\n- Player1: arrow keys | Player2: WASD | Player3: TFGH | Player4: IJKL\n\n*Endurance mode: Defeat as many other Sumo players as possible before falling off. (1 player)", 80, 130, 640, 400);
    pop();
}

function drawOptions() {
    push();
    textAlign(CENTER); textSize(40); fill(50); text("Options", width/2, 80);
    fill(200, 100, 100); stroke(80,0,0); strokeWeight(3);
    rect(250, 300, 300, 60, 15);
    fill(255); textSize(24); noStroke(); text("Clear Saved Data", 400, 330);
    textSize(16); fill(100,0,0); text("WARNING: This will set you back to level one in story mode!", width/2, 400);
    pop();
}

function drawTips() {
    push();
    textAlign(CENTER); textSize(40); fill(50); text("Tips & Tricks", width/2, 80);
    textSize(20); fill(0); textLeading(30);
    text("• Use momentum to push heavier opponents.\n• Circle around to attack from the side.\n• In multiplayer, coordinate pushes.\n• Endurance mode gets harder over time.", width/2, 200);
    pop();
}

function drawGame() {
    if (gameOver) {
        push();
        textAlign(CENTER); textSize(40); fill(255,0,0);
        if (gameMode === "journey") {
            if (wrestlers.length === 0) text("You lost!", width/2, height/2);
            else if (level > maxLevel) text("You beat all levels!", width/2, height/2);
            else text("Level Complete!", width/2, height/2-40);
        } else if (gameMode === "multiplayer") {
            text("Winner: " + gameWinner, width/2, height/2);
        } else if (gameMode === "endurance") {
            text("Game Over! Score: " + enduranceScore, width/2, height/2);
        }
        textSize(20); fill(100); text("Click to continue", width/2, height/2+60);
        pop();
        return;
    }

    // update physics
    for (let w of wrestlers) w.update();
    handleCollisions();
    checkBoundary();

    // draw wrestlers
    for (let w of wrestlers) w.display();

    // show level/score
    push();
    fill(0); textSize(18); textAlign(LEFT);
    if (gameMode === "journey") text("Level: " + level + "/" + maxLevel, 20, 30);
    else if (gameMode === "endurance") text("Score: " + enduranceScore, 20, 30);
    else if (gameMode === "multiplayer") text("Battle Royale", 20, 30);
    pop();
}
