// UI functions for Push Out!
function drawMenuButton() {
  fill(0);
  rect(10, 10, 40, 40, 5);
  fill(255);
  textSize(20);
  text("≡", 18, 38);
}

function drawExpBar(player) {
  let ratio = player.exp / expToLevel(player.level);
  fill(50);
  rect(20, 20, 200, 20);
  fill(0, 255, 100);
  rect(20, 20, 200 * ratio, 20);
  fill(255);
  text(`Lv ${player.level}`, 20, 15);
}

function drawKO() {
  textSize(80);
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  text("KO!", width / 2, height / 2);
}
