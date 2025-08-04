let baseW = 380;
let baseH = 640;
let scaleFactor;
let img, altImg1, altImg2;
let punchSound1, punchSound2, bgm, endMusic;
let myFont;
let slapCount = 0;
let bgColor;
let currentImage = 0; // 0 = เริ่มต้น, 1 = alt1, 2 = alt2
let gameState = "playing"; // playing, gameover
let timeLeft = 30;
let lastTimeUpdate = 0;

function preload() {
  img = loadImage("woman_8bit.png");      
  altImg1 = loadImage("alt_image_1.png"); 
  altImg2 = loadImage("alt_image_2.png"); 

  punchSound1 = loadSound("punch1.mp3");  
  punchSound2 = loadSound("punch2.mp3");  
  bgm = loadSound("bgm.mp3");
  endMusic = loadSound("end.mp3"); // เพลงจบ

  myFont = loadFont("myFont.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  bgColor = color('#2443ad');
  textFont(myFont);
  textSize(48);
  fill(255);
  noStroke();

  playBGM();
  lastTimeUpdate = millis();
}

function draw() {
  background(bgColor);

  if (gameState === "playing") {
    // จับเวลา
    if (millis() - lastTimeUpdate >= 1000) {
      timeLeft--;
      lastTimeUpdate = millis();
      if (timeLeft <= 0) {
        gameOver();
      }
    }

    // วาดภาพเกม
    scaleFactor = min(width / baseW, height / baseH);
    let offsetX = (width - baseW * scaleFactor) / 2;
    let offsetY = (height - baseH * scaleFactor) / 2;

    push();
    translate(offsetX, offsetY);
    scale(scaleFactor);

    if (currentImage === 1) {
      image(altImg1, 0, 0, baseW, baseH);
    } else if (currentImage === 2) {
      image(altImg2, 0, 0, baseW, baseH);
    } else {
      image(img, 0, 0, baseW, baseH);
    }

    fill(255);
    ellipse(40, baseH - 40, 50, 50);
    ellipse(baseW - 40, baseH - 40, 50, 50);

    pop();

    // แสดง Slap Count
    textAlign(LEFT, TOP);
    fill('#FFD700');
    text(`Slap Count : ${slapCount}`, 10, 10);

    // แสดงเวลา
    textAlign(RIGHT, TOP);
    fill(255);
    text(`Time ${timeLeft} sec`, width - 10, 10);

  } else if (gameState === "gameover") {
    // หน้าจอ Game Over
    background('#FF0000');
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(48);
    text("GAME OVER", width / 2, height / 2 - 60);
    textSize(32);
    text(`Slap Count : ${slapCount}`, width / 2, height / 2);

    textSize(28);
    fill('#FFD700');
    text("PLAY AGAIN", width / 2, height / 2 + 100);
  }
}

function handlePress(x, y) {
  if (gameState === "gameover") {
    // ตรวจปุ่ม Play Again
    let btnX = width / 2;
    let btnY = height / 2 + 100;
    if (dist(x, y, btnX, btnY) < 100) {
      restartGame();
      return;
    }
    return;
  }

  let offsetX = (width - baseW * scaleFactor) / 2;
  let offsetY = (height - baseH * scaleFactor) / 2;
  let imgX = (x - offsetX) / scaleFactor;
  let imgY = (y - offsetY) / scaleFactor;

  let dLeft = dist(imgX, imgY, 40, baseH - 40);
  if (dLeft < 25) {
    currentImage = 2;
    bgColor = color('#FF0000');
    slapCount++;
    if (punchSound1.isLoaded()) punchSound1.play();
    return;
  }

  let dRight = dist(imgX, imgY, baseW - 40, baseH - 40);
  if (dRight < 25) {
    currentImage = 1;
    bgColor = color('#FF0000');
    slapCount++;
    if (punchSound2.isLoaded()) punchSound2.play();
    return;
  }
}

function handleRelease() {
  if (gameState === "playing") {
    currentImage = 0;
    bgColor = color('#2443ad');
  }
}

function mousePressed() {
  handlePress(mouseX, mouseY);
}

function mouseReleased() {
  handleRelease();
}

function touchStarted() {
  handlePress(touchX, touchY);
  return false;
}

function touchEnded() {
  handleRelease();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function playBGM() {
  if (bgm.isLoaded() && !bgm.isPlaying()) {
    bgm.loop();
    bgm.setVolume(0.5);
  }
}

function gameOver() {
  gameState = "gameover";
  bgColor = color('#FF0000');
  if (bgm.isPlaying()) bgm.stop();
  if (endMusic.isLoaded()) endMusic.play();
}

function restartGame() {
  slapCount = 0;
  timeLeft = 30; // หรือ 60 ตามที่ต้องการ
  gameState = "playing";
  bgColor = color('#2443ad');

  // ตั้งค่าฟอนต์และสไตล์ตัวหนังสือใหม่
  textFont(myFont);
  textSize(48); // ขนาดตัวหนังสือที่ต้องการ
  fill('#FFD700'); // สีเหลืองทอง หรือเปลี่ยนเป็นสีที่ต้องการ
  noStroke();

  playBGM();
  lastTimeUpdate = millis();
}

