const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 700;

let isGameStarted = false;
let isGameOver = false;

const titleScreen = document.getElementById('titleScreen');
const gameoverImage = document.getElementById('gameoverImage');
const gameoverText = document.getElementById('gameoverText');

canvas.addEventListener('click', () => {
  if (!isGameStarted && !isGameOver) {
    startGame();
  } else if (isGameOver) {
    restartGame();
  }
});

function startGame() {
  isGameStarted = true;
  titleScreen.style.display = 'none';
  gameoverImage.style.display = 'none';
  gameoverText.style.display = 'none';
  // ゲーム初期化処理呼び出し（自作関数）
  initGame();
}

function restartGame() {
  isGameOver = false;
  lives = 3;
  score = 0;
  enemies = [];
  recoveryItems = [];
  isGameStarted = true;
  gameoverImage.style.display = 'none';
  gameoverText.style.display = 'none';
  initGame();
}

let player = { x: 160, y: 550, width: 40, height: 40 };
let bullets = [];
let enemies = [];
let recoveryItems = [];

let score = 0;
let lives = 3;
let lastEnemyTime = 0;
let enemySpawnRate = 0.02;
let lastSpeedUpTime = 0;

canvas.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  player.x = touch.clientX - rect.left - player.width / 2;
  player.y = touch.clientY - rect.top - player.height / 2;
});

function drawText(text, x, y, color = "white", size = "20px") {
  ctx.fillStyle = color;
  ctx.font = `${size} sans-serif`;
  ctx.fillText(text, x, y);
}

function drawImage(obj, id) {
  const img = document.getElementById(id);
  if (img.complete) ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
}

function drawRect(obj, color) {
  ctx.fillStyle = color;
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

function updateBullets() {
  bullets.forEach((b, i) => {
    b.y -= 5;
    if (b.y + b.height < 0) bullets.splice(i, 1);
  });
}

function spawnEnemy() {
  if (Math.random() < enemySpawnRate) {
    const isMatsunaga = Math.random() < 0.25;
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      width: 40,
      height: 40,
      dx: Math.random() > 0.5 ? 2 : -2,
      type: isMatsunaga ? "matsunaga" : "kyoukasho"
    });
  }
}

function spawnRecovery() {
  if (Math.random() < 0.003) {
    recoveryItems.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      width: 40,
      height: 40,
      dy: 2
    });
  }
}

function updateEnemies() {
  enemies.forEach((e, i) => {
    e.x += e.dx;
    e.y += 2;
    if (e.x <= 0 || e.x + e.width >= canvas.width) e.dx *= -1;

    if (e.y > canvas.height) enemies.splice(i, 1);
  });
}

function updateRecoveryItems() {
  recoveryItems.forEach((item, i) => {
    item.y += item.dy;
    if (item.y > canvas.height) recoveryItems.splice(i, 1);

    if (
      item.x < player.x + player.width &&
      item.x + item.width > player.x &&
      item.y < player.y + player.height &&
      item.y + item.height > player.y
    ) {
      if (lives < 3) lives++;
      recoveryItems.splice(i, 1);
    }
  });
}

function checkCollisions() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        bullets.splice(j, 1);
        if (e.type === "kyoukasho") {
          score++;
        } else if (e.type === "matsunaga") {
          lives--;
          if (lives <= 0) {
            isGameOver = true;
            gameoverImage.style.display = "block";
            gameoverText.style.display = "block";
          }
        }
        enemies.splice(i, 1);
        break;
      }
    }
  }
}

function shoot() {
  bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y,
    width: 10,
    height: 20
  });
}

setInterval(shoot, 300);

function gameLoop(timestamp) {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawImage(player, "playerImg");
  bullets.forEach(b => drawRect(b, "cyan"));

  enemies.forEach(e => {
    if (e.type === "kyoukasho") drawImage(e, "enemyImg");
    else drawImage(e, "dangerImg");
  });

  recoveryItems.forEach(item => drawImage(item, "recoveryImg"));

  updateBullets();
  spawnEnemy();
  spawnRecovery();
  updateEnemies();
  updateRecoveryItems();
  checkCollisions();

  drawText(`偏差値: ${score}`, 10, 30);
  drawText("X".repeat(lives), 10, 60, "green");

  if (timestamp - lastSpeedUpTime > 30000) {
    enemySpawnRate += 0.005;
    lastSpeedUpTime = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
