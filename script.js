const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 画像の読み込み
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

// テキスト描画関数
function drawText(text, x, y, size = 24, color = "white", align = "center") {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

// 残機の表示
function drawLives() {
  for (let i = 0; i < 3; i++) {
    drawText(i < lives ? "♥" : "♡", canvas.width - 80 + i * 20, 30, 24, "pink", "left");
  }
}

// 弾の発射
function shoot() {
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10
  });
}

// 敵の生成
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

// 回復アイテムの生成
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

// ゲームの更新
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "title") {
    drawText("学力爆上げ↑↑", canvas.width / 2, 250, 36, "white");
    drawText("モテ期よ、今すぐ来い！", canvas.width / 2, 300, 24, "white");
    drawText("ぎんとの青春改造計画", canvas.width / 2, 350, 24, "yellow");
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

  // 背景線の描画
  ctx.strokeStyle = "#333";
  for (let i = 0; i < canvas.height / 40; i++) {
    let y = (i * 40 + backgroundOffset) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // スピードアップ処理
  if (score - lastSpeedUpScore >= 10) {
    playerSpeed += 1;
    enemySpeed = Math.min(enemySpeed + 0.5, 10);
    enemySpawnRate = Math.min(enemySpawnRate + 0.005, 0.08);
    lastSpeedUpScore = score;
  }

  spawnEnemy();
  spawnRecoveryItem();

  // 弾の移動
  bullets.forEach(b => b.y -= 5);
  bullets = bullets.filter(b => b.y > 0);

  // 敵の移動
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

  // ぎんとと松永の衝突判定
for (let i = enemies.length - 1; i >= 0; i--) {
  const e = enemies[i];
  const hitPlayer =
    player.x < e.x + e.width &&
    player.x + player.width > e.x &&
    player.y < e.y + e.height &&
    player.y + player.height > e.y;

  if (hitPlayer && e.type === "blue" && invincibleTimer <= 0) {
    lives -= 1;
    invincibleTimer = 60;
    if (lives <= 0) gameState = "gameover";
    enemies.splice(i, 1);
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

  // プレイヤーの描画
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
  drawText(`TIME: ${Math.floor((Date.now() - startTime) / 1000)}s`, 10, 60, 20, "white", "left");
  drawLives();
}

let isTouching = false;

// 弾を撃つ処理（300ms制限付き）
function shoot() {
  const now = Date.now();
  if (now - lastShotTime < 300) return; // 300ms間隔
  lastShotTime = now;
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10
  });
}

canvas.addEventListener("touchstart", (e) => {
  if (gameState === "playing") {
    shoot(); // タップで弾を撃つ
    isTouching = true;
  } else if (gameState === "title" || gameState === "gameover") {
    // ゲームスタート時の初期化
    gameState = "playing";
    score = 0;
    lives = 3;
    enemies = [];
    bullets = [];
    recoveryItems = [];
    player.x = canvas.width / 2 - player.width / 2;
    playerSpeed = 10;
    enemySpeed = 2;
    enemySpawnRate = 0.02;
    gameoverImg.style.display = "none";
    startTime = Date.now();
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (!isTouching) return;
  const touch = e.touches[0];
  player.x = touch.clientX - player.width / 2;
});


canvas.addEventListener("touchend", () => {
  isTouching = false;
});


// ゲームループ
function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
