const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = { x: canvas.width / 2 - 25, y: canvas.height - 100, width: 50, height: 50 };
let isGameStarted = false;
let isGameOver = false;
let score = 0;
let lives = 3;
let enemies = [];
let recoveryItems = [];
let bullets = [];
let playerSpeed = 10;
let enemySpeed = 2;
let enemySpawnRate = 0.02;
let lastSpeedUpScore = 0;
let backgroundOffset = 0;
let invincibleTimer = 0;
let lastShotTime = 0;
let startTime = null;
const gameoverImg = document.getElementById('gameoverImage');
const gameoverText = document.getElementById('gameoverText');

// タイトルの要素を追加
const title = document.createElement('div');
title.id = 'title';
title.innerHTML = 'ぎんとがモテ男になるように';
document.body.appendChild(title);

// 画像の読み込み
const playerImage = new Image();
playerImage.src = 'path_to_ginto_image.jpg'; // ぎんとの写真

const enemyImage = new Image();
enemyImage.src = 'path_to_kyoukasho_image.jpg'; // 教科書の写真

const blueEnemyImage = new Image();
blueEnemyImage.src = 'path_to_matsunaga_image.jpg'; // 松永の写真

const xIcon = new Image();
xIcon.src = 'path_to_x_icon.jpg'; // Xアイコン

let xIconItems = []; // Xアイコンのアイテムリスト

// 描画関数
function drawRect(obj, color) {
  ctx.fillStyle = color;
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

function drawImage(obj, img) {
  ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
}

function drawText(text, x, y, size = 20, color = 'white', align = 'left') {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLives() {
  for (let i = 0; i < lives; i++) {
    drawImage({ x: canvas.width - 80 + i * 20, y: 30, width: 20, height: 20 }, xIcon); // Xアイコンをライフとして描画
  }
}

// アイテム生成
function spawnEnemy() {
  if (Math.random() < enemySpawnRate) {
    const enemyType = Math.random() < 0.2 ? 'blue' : 'red'; // 松永は教科書の5分の1の確率
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      width: 40,
      height: 40,
      dx: Math.random() > 0.5 ? 2 : -2,
      color: enemyType // こちらが教科書か松永かを決める
    });
  }
}

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

function spawnXIcon() {
  if (Math.random() < 0.001) {
    xIconItems.push({
      x: Math.random() * (canvas.width - 20),
      y: -20,
      width: 20,
      height: 20,
      speed: 2
    });
  }
}

// 衝突処理
function handleXIconCollision() {
  for (let i = 0; i < xIconItems.length; i++) {
    const item = xIconItems[i];
    if (player.x < item.x + item.width && player.x + player.width > item.x && player.y < item.y + item.height && player.y + player.height > item.y) {
      if (lives < 3) {
        lives += 1; // Xアイコンを取るとライフが増える
      }
      item.collected = true; // アイコンを取った後は収集済みとする
    }
  }
}

function handleEnemyCollision() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.color === 'blue' && player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
      lives -= 1;
      if (lives <= 0) isGameOver = true;
      enemies.splice(i, 1); // 松永に当たった場合は消す
    } else if (e.color === 'red' && player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
      score += 1; // 教科書に当たった場合はスコアを加算
      enemies.splice(i, 1); // 教科書を消す
    }
  }
}

function shootAuto() {
  const now = Date.now();
  if (now - lastShotTime > 500) { // 500msごとに弾を発射
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

  if (!isGameStarted) {
    return;
  }

  if (isGameOver) {
    gameoverText.style.display = 'block';
    gameoverImg.style.display = 'block';
    return;
  }

  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

  ctx.strokeStyle = '#333';
  for (let i = 0; i < canvas.height / 40; i++) {
    let y = (i * 40 + backgroundOffset) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  backgroundOffset += 2;

  if (score - lastSpeedUpScore >= 2000) {
    playerSpeed += 1;
    enemySpeed = Math.min(enemySpeed + 0.5, 10);
    enemySpawnRate = Math.min(enemySpawnRate + 0.005, 0.08);
    lastSpeedUpScore = score;
  }

  shootAuto(); // 弾を自動発射

  spawnEnemy();
  spawnRecoveryItem();
  spawnXIcon(); // Xアイコンをスポーン

  // 進行処理
  enemies.forEach(e => {
    e.y += enemySpeed;
    e.x += e.dx;
    if (e.x < 0 || e.x > canvas.width - e.width) e.dx *= -1;
  });

  bullets.forEach(b => {
    b.y -= 5;
  });
  bullets = bullets.filter(b => b.y > 0);

  handleEnemyCollision(); // 敵との衝突チェック
  handleXIconCollision(); // Xアイコンの衝突チェック

  // キャラやアイテムの描画
  drawImage({x: player.x, y: player.y, width: 50, height: 50}, playerImage); // ぎんとの画像
  bullets.forEach(b => drawRect(b, 'cyan'));
  enemies.forEach(e => {
    if (e.color === 'blue') {
      drawImage(e, blueEnemyImage); // 松永の画像
    } else {
      drawImage(e, enemyImage); // 教科書の画像
    }
  });
  recoveryItems.forEach(item => drawImage(item, enemyImage)); // 教科書のアイテム
  xIconItems.forEach(item => drawImage(item, xIcon)); // Xアイコンの描画

  drawText(`SCORE: ${score}`, 10, 30);
  drawText(`TIME: ${elapsedTime}s`, 10, 60);
  drawLives();
}

canvas.addEventListener('touchstart', e => {
  if (!isGameStarted || isGameOver) {
    isGameStarted = true;
    isGameOver = false;
    score = 0;
    lives = 3;
    enemies = [];
    bullets = [];
    recoveryItems = [];
    player.x = canvas.width / 2 - 25;
    gameoverImg.style.display = 'none';
    gameoverText.style.display = 'none';
    title.style.display = 'none';
    startTime = Date.now();
  }
});

let lastTouchX = null;
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  if (lastTouchX !== null) {
    const dx = touch.clientX - lastTouchX;
    player.x += dx * 1.5;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  }
  lastTouchX = touch.clientX;
});
canvas.addEventListener('touchend', () => {
  lastTouchX = null;
});

function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
