// AIController class for Push Out!
class AIController {
  constructor(player, target) {
    this.player = player;
    this.target = target;
  }

  update() {
    let dir = createVector(
      this.target.x - this.player.x,
      this.target.y - this.player.y
    );
    dir.normalize();
    this.player.applyForce(dir);
    if (dir.mag() < 80) {
      this.player.dash();
    }
  }
}
