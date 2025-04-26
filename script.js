const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// スクロールを防ぐ
document.body.addEventListener("touchmove", (e) => {
  e.preventDefault();  // スクロールを防止
}, { passive: false });


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

// 敵の生成
function spawnEnemy() {
  if (Math.random() < enemySpawnRate) {
    const isMatsunaga = Math.random() < 1 / 3;
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      width: 40,
      height: 40,
      type: isMatsunaga ? "blue" : "red", // 青は松永、赤は教科書
      dx: (Math.random() - 0.5) * 6,
      dy: Math.random() * 1 + 1.5
    });
  }
}

// 回復アイテムの生成
function spawnRecoveryItem() {
  if (Math.random() < 0.001) {
    recoveryItems.push({
      x: Math.random() * (canvas.width - 20),
      y: -20,
      width: 20,
      height: 20,
      speed: 2
    });
  }
}

// 衝突判定関数
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// 衝突処理
// プレイヤーとアイテムの衝突判定
function checkCollisions() {
  // 敵（赤・青）の処理
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].type === "red" && isColliding(player, enemies[i])) {
      score += 1;
      enemies.splice(i, 1);
    } else if (enemies[i].type === "blue" && isColliding(player, enemies[i])) {
      lives -= 1;
      enemies.splice(i, 1);
      if (lives <= 0) {
        gameState = "gameover";
        gameoverImg.style.display = "block";
      }
    }
  }

  // アイテム（緑など）の処理
  for (let i = items.length - 1; i >= 0; i--) {
    if (isColliding(player, items[i])) {
      if (items[i].type === "green") {
        if (lives < 3) {
          lives++;
          updateLivesDisplay?.(); // 関数があるなら実行
        }
      }
      items.splice(i, 1); // 衝突したアイテム削除
    }
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

  // 敵の移動
  enemies.forEach(e => {
    e.x += e.dx;
    e.y += e.dy;
    if (e.x < 0 || e.x > canvas.width - e.width) e.dx *= -1;
  });
  enemies = enemies.filter(e => e.y < canvas.height);

  recoveryItems.forEach(item => item.y += item.speed);

  // 衝突チェック
  checkCollisions();

  // プレイヤーの描画
  ctx.drawImage(gintoImg, player.x, player.y, player.width, player.height);
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

let startX = 0;
let isTouching = false;

// ゲームスタート時の初期化
canvas.addEventListener("touchstart", (e) => {
  if (gameState === "title" || gameState === "gameover") {
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

  const touch = e.touches[0];
  startX = touch.clientX;
  isTouching = true;
});

// プレイヤーの移動処理（スライド）
canvas.addEventListener("touchmove", (e) => {
  if (!isTouching) return;
  const touch = e.touches[0];
  const dx = touch.clientX - startX;
  player.x += dx; // スライドの距離だけ移動
  startX = touch.clientX; // 新しいタッチ位置を保存
  player.x = Math.max(0, Math.min(player.x, canvas.width - player.width)); // 範囲外に出ないように
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
