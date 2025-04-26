const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const playerImg = new Image();
playerImg.src = 'path_to_ginto_image.jpg';

const enemyImg = new Image();
enemyImg.src = 'path_to_kyoukasho_image.jpg';

const dangerImg = new Image();
dangerImg.src = 'path_to_matsunaga_image.jpg';

const recoveryImg = new Image();
recoveryImg.src = 'path_to_x_icon.PNG';

const gameoverImg = document.getElementById('gameoverImage');

let player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  width: 50,
  height: 50
};

let score = 0;
let lives = 3;
let items = [];
let speed = 2;
let gameOver = false;
let isTouching = false;
let lastTouchX = null;

function drawPlayer() {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawItems() {
  for (let item of items) {
    let img;
    switch (item.type) {
      case 'score': img = enemyImg; break;
      case 'danger': img = dangerImg; break;
      case 'life': img = recoveryImg; break;
    }
    ctx.drawImage(img, item.x, item.y, item.size, item.size);
  }
}

function updateItems() {
  for (let item of items) {
    item.y += speed;
  }

  items = items.filter(item => item.y < canvas.height);
}

function checkCollisions() {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const dx = player.x + player.width / 2 - (item.x + item.size / 2);
    const dy = player.y + player.height / 2 - (item.y + item.size / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const combinedRadius = (player.width + item.size) / 2;

    if (distance < combinedRadius) {
      if (item.type === 'score') {
        score++;
      } else if (item.type === 'danger') {
        lives--;
        if (lives <= 0) {
          gameOver = true;
          showGameOver();
        }
      } else if (item.type === 'life') {
        lives = Math.min(lives + 1, 3);
      }
      items.splice(i, 1);
    }
  }
}

function showGameOver() {
  gameoverImg.style.display = 'block';
}

function spawnItem() {
  const types = ['score', 'danger', 'life'];
  const type = types[Math.floor(Math.random() * types.length)];
  const size = 50;
  const x = Math.random() * (canvas.width - size);
  items.push({ x, y: -size, size, type });
}

function drawUI() {
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`偏差値: ${score}`, 20, 40);

  for (let i = 0; i < lives; i++) {
    ctx.drawImage(recoveryImg, 20 + i * 40, 60, 30, 30);
  }
}

function updateSpeed() {
  if (score % 20 === 0 && score !== 0) {
    speed += 0.5;
  }
}

function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();
  drawItems();
  updateItems();
  checkCollisions();
  drawUI();
  updateSpeed();

  requestAnimationFrame(gameLoop);
}

setInterval(spawnItem, 1000);

// タッチ操作
canvas.addEventListener('touchstart', (e) => {
  isTouching = true;
  lastTouchX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
  if (!isTouching) return;
  const touchX = e.touches[0].clientX;
  const dx = touchX - lastTouchX;
  player.x += dx;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  lastTouchX = touchX;
});

canvas.addEventListener('touchend', () => {
  isTouching = false;
  lastTouchX = null;
});

// 開始
gameLoop();
