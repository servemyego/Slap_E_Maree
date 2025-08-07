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
let button1Img, button2Img; // ตัวแปรเก็บรูปปุ่ม
let buttonSize = 120; // ขนาดปุ่มที่ต้องการ (สามารถเปลี่ยนได้)
let buttonScaleLeft = 1;
let buttonScaleRight = 1;

function preload() {
  img = loadImage("woman_8bit.png");      
  altImg1 = loadImage("alt_image_1.png"); 
  altImg2 = loadImage("alt_image_2.png"); 
  button1Img = loadImage('Button_1.png'); // โหลดปุ่มซ้าย
  button2Img = loadImage('Button_2.png'); // โหลดปุ่มขวา

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

    // ปุ่มซ้าย
image(
  button1Img,
  80 - (buttonSize * buttonScaleLeft) / 2,
  baseH - 60 - (buttonSize * buttonScaleLeft) / 2,
  buttonSize * buttonScaleLeft,
  buttonSize * buttonScaleLeft
);

// ปุ่มขวา
image(
  button2Img,
  baseW - 80 - (buttonSize * buttonScaleRight) / 2,
  baseH - 60 - (buttonSize * buttonScaleRight) / 2,
  buttonSize * buttonScaleRight,
  buttonSize * buttonScaleRight
);
    
    // แสดง Slap Count
    textAlign(LEFT, TOP);
    fill('#FFD700');
    textSize(30); // กำหนดขนาดตาม base
    text(`Slap : ${slapCount}`, 10, 10);

    // แสดงเวลา
    textAlign(RIGHT, TOP);
    fill(255);
    textSize(30);
    text(`Time Left : ${timeLeft} `, baseW - 10, 10);

    pop();

    

  } else if (gameState === "gameover") {
    // คำนวณ scale และตำแหน่ง offset ให้ภาพและตัวอักษรอยู่กลางจอ
    let scaleFactor = Math.min(width / baseW, height / baseH);
    let offsetX = (width - baseW * scaleFactor) / 2;
    let offsetY = (height - baseH * scaleFactor) / 2;

    push();
    translate(offsetX, offsetY);
    scale(scaleFactor);

    // พื้นหลัง
    background('#FF0000');

    // ข้อความ Game Over
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(60);
    text("GAME OVER", baseW / 2, baseH / 2 - 60);

    // แสดง Slap Count
    textSize(48);
    text(`Slap Count : ${slapCount}`, baseW / 2, baseH / 2);

    // ปุ่ม Play Again
    textSize(30);
    fill('#FFD700');
    text("PLAY AGAIN", baseW / 2, baseH / 2 + 100);

    pop();
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

  let scaleFactor = min(width / baseW, height / baseH);
  let offsetX = (width - baseW * scaleFactor) / 2;
  let offsetY = (height - baseH * scaleFactor) / 2;
  let imgX = (x - offsetX) / scaleFactor;
  let imgY = (y - offsetY) / scaleFactor;

  // ปุ่มซ้าย
  let dLeft = dist(imgX, imgY, 80, baseH - 60);
  if (dLeft < buttonSize / 2) {
    buttonScaleLeft = 1.25; // ขยายเฉพาะปุ่มซ้าย
    currentImage = 2;
    bgColor = color('#FF0000');
    slapCount++;
    if (punchSound1.isLoaded()) punchSound1.play();
    return;
  }

  // ปุ่มขวา
  let dRight = dist(imgX, imgY, baseW - 80, baseH - 60);
  if (dRight < buttonSize / 2) {
    buttonScaleRight = 1.25; // ขยายเฉพาะปุ่มขวา
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
    buttonScaleLeft = 1;  // รีเซ็ตปุ่มซ้าย
    buttonScaleRight = 1; // รีเซ็ตปุ่มขวา
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
  // หยุดเพลง Game Over ถ้ายังเล่นอยู่
  if (endMusic.isPlaying()) {
    endMusic.stop();
  }

  // หยุดเพลง BGM เดิมกันเสียงซ้อน
  if (bgm.isPlaying()) {
    bgm.stop();
  }

  slapCount = 0;
  timeLeft = 30; // หรือ 60 ตามที่ต้องการ
  gameState = "playing";
  bgColor = color('#2443ad');

  // ตั้งค่าฟอนต์และสไตล์ตัวหนังสือใหม่
  textFont(myFont);
  textSize(48);
  fill('#FFD700');
  noStroke();

  // เล่นเพลงหลักใหม่
  playBGM();

  lastTimeUpdate = millis();
}
