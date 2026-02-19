// PowerUp class for Push Out!
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.duration = 300;
  }

  draw() {
    switch (this.type) {
      case 'speed':
        fill(0, 200, 255);
        break;
      case 'force':
        fill(255, 200, 0);
        break;
      case 'shield':
        fill(100, 255, 100);
        break;
      default:
        fill(200);
    }
    rect(this.x, this.y, 30, 30, 8);
  }
}
