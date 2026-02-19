// Player class for Push Out!
class Player {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vel = createVector(0, 0);
    this.dashCooldown = 0;
    this.exp = 0;
    this.level = 1;
    this.isKO = false;
    this.shield = 0;
    this.speedBoost = 0;
    this.pushForce = 1;
    this.animScale = 1;
  }

  applyForce(force) {
    let speed = this.speedBoost > 0 ? 1.5 : 1;
    this.vel.add(p5.Vector.mult(force, speed));
  }

  dash() {
    if (this.dashCooldown <= 0) {
      let dashPower = 10 * this.pushForce;
      this.vel.add(p5.Vector.mult(this.vel.copy().normalize(), dashPower));
      this.dashCooldown = 60;
      this.animScale = 1.3;
    }
  }

  update() {
    this.x += this.vel.x;
    this.y += this.vel.y;
    this.vel.mult(0.9); // friction
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.shield > 0) this.shield--;
    if (this.speedBoost > 0) this.speedBoost--;
    if (this.animScale > 1) this.animScale -= 0.02;
    else this.animScale = 1;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(this.animScale);
    fill(this.color);
    ellipse(0, 0, 40);
    if (this.shield > 0) {
      stroke(0, 255, 200);
      strokeWeight(4);
      noFill();
      ellipse(0, 0, 48);
      noStroke();
    }
    pop();
  }

  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= expToLevel(this.level)) {
      this.exp -= expToLevel(this.level);
      this.level++;
    }
  }

  applyPowerUp(type) {
    switch (type) {
      case 'speed':
        this.speedBoost = 180;
        break;
      case 'force':
        this.pushForce = 1.5;
        setTimeout(() => { this.pushForce = 1; }, 3000);
        break;
      case 'shield':
        this.shield = 180;
        break;
    }
  }
}
