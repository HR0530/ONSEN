const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 画像
const gintoImg = new Image();
gintoImg.src = "path_to_ginto_image.jpg";
const redImg = new Image();
redImg.src = "path_to_kyoukasho_image.jpg";
const blueImg = new Image();
blueImg.src = "path_to_matsunaga_image.jpg";
const greenImg = new Image();
greenImg.src = "path_to_x_icon.PNG";

let gameState = "title"; // "title", "playing", "gameover"

const player = { x: canvas.width / 2 - 25, y: canvas.height - 100, width: 50, height: 50 };
let score = 0;
let lives = 3;
let enemies = [];
let recoveryItems = [];
let bullets = [];
let lastShotTime = 0;
let startTime = null;
let invincibleTimer = 0;
let backgroundOffset = 0;
let lastSpeedUpScore = 0;
let playerSpeed = 10;
let enemySpeed = 2;
let enemySpawnRate = 0.02;
let gameoverImg = document.getElementById("gameoverImage");

function drawText(text, x, y, size = 24, color = "white", align = "center") {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLives() {
  for (let i = 0; i < 3; i++) {
    drawText(i < lives ? "♥" : "♡", canvas.width - 80 + i * 20, 30, 24, "pink", "left");
  }
}

function spawnEnemy() {
  if (Math.random() < enemySpawnRate) {
    const isMatsunaga = Math.random() < 1 / 3;
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      width: 40,
      height: 40,
      type: isMatsunaga ? "blue" : "red",
      dx: (Math.random() - 0.5) * 6,
      dy: Math.random() * 1 + 1.5
    });
  }
}

function spawnRecoveryItem() {
  if (Math.random() < 0.0001) {
    recoveryItems.push({
      x: Math.random() * (canvas.width - 20),
      y: -20,
      width: 20,
      height: 20,
      speed: 2
    });
  }
}

function shootAuto() {
  const now = Date.now();
  if (now - lastShotTime > 500) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10
    });
    lastShotTime = now;
  }
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "title") {
    drawText("学力爆上げ↑↑", canvas.width / 2, 250, 36, "white");
    drawText("モテ期よ、今すぐ来い！", canvas.width / 2, 300, 24, "white");
    drawText("タップでスタート", canvas.width / 2, 400, 20, "gray");
    return;
  }

  if (gameState === "gameover") {
    drawText("GAME OVER", canvas.width / 2, 280, 40, "red");
    drawText(`偏差値: ${score}`, canvas.width / 2, 330, 20);
    gameoverImg.style.display = "block";
    return;
  }

  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  backgroundOffset += 2;

  // 背景線
  ctx.strokeStyle = "#333";
  for (let i = 0; i < canvas.height / 40; i++) {
    let y = (i * 40 + backgroundOffset) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  if (score - lastSpeedUpScore >= 10) {
    playerSpeed += 1;
    enemySpeed = Math.min(enemySpeed + 0.5, 10);
    enemySpawnRate = Math.min(enemySpawnRate + 0.005, 0.08);
    lastSpeedUpScore = score;
  }

  shootAuto();
  spawnEnemy();
  spawnRecoveryItem();

  bullets.forEach(b => b.y -= 5);
  bullets = bullets.filter(b => b.y > 0);

  enemies.forEach(e => {
    e.x += e.dx;
    e.y += e.dy;
    if (e.x < 0 || e.x > canvas.width - e.width) e.dx *= -1;
  });
  enemies = enemies.filter(e => e.y < canvas.height);

  recoveryItems.forEach(item => item.y += item.speed);

  // 衝突処理
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
        if (e.type === "red") score += 1;
        else if (e.type === "blue") {
          if (invincibleTimer <= 0) {
            lives -= 1;
            invincibleTimer = 60;
            if (lives <= 0) gameState = "gameover";
          }
        }
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
  }

  if (invincibleTimer > 0) invincibleTimer--;

  recoveryItems = recoveryItems.filter(item => {
    const hit = player.x < item.x + item.width &&
                player.x + player.width > item.x &&
                player.y < item.y + item.height &&
                player.y + player.height > item.y;
    if (hit && lives < 3) {
      lives++;
      return false;
    }
    return item.y < canvas.height;
  });

  // 描画
  ctx.drawImage(gintoImg, player.x, player.y, player.width, player.height);
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
  enemies.forEach(e => {
    const img = e.type === "red" ? redImg : blueImg;
    ctx.drawImage(img, e.x, e.y, e.width, e.height);
  });
  recoveryItems.forEach(item => {
    ctx.drawImage(greenImg, item.x, item.y, item.width, item.height);
  });

  drawText(`偏差値: ${score}`, 10, 30, 20, "white", "left");
  drawText(`TIME: ${elapsedTime}s`, 10, 60, 20, "white", "left");
  drawLives();
}

canvas.addEventListener("touchstart", () => {
  if (gameState === "title" || gameState === "gameover") {
    gameState = "playing";
    score = 0;
    lives = 3;
    enemies = [];
    bullets = [];
    recoveryItems = [];
    player.x = canvas.width / 2 - 25;
    playerSpeed = 10;
    enemySpeed = 2;
    enemySpawnRate = 0.02;
    gameoverImg.style.display = "none";
    startTime = Date.now();
  }
});

let lastTouchX = null;
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  const touch = e.touches[0];
  if (lastTouchX !== null) {
    const dx = touch.clientX - lastTouchX;
    player.x += dx * 1.5;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  }
  lastTouchX = touch.clientX;
});
canvas.addEventListener("touchend", () => {
  lastTouchX = null;
});

function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
