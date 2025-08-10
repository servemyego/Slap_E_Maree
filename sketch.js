/* =======================
   SLAP THAT BITCH — Web Audio API version (no p5.Sound)
======================= */

let baseW = 380;
let baseH = 640;
const SLAP_LIMIT = 100;       // เปลี่ยนภาพพิเศษหลังเกินนี้
let scaleFactor;

// ==== EFFECT (impact) ====
let impactImg;
let impactFx = {
  active: false,
  x: 0, y: 0,
  frame: 0,
  maxFrames: 6,
  startSize: 200,
  endSize: 350,
  side: 'left'
};

let img, altImg1, altImg2, imgSpecial;
let button1Img, handLeftImg, handRightImg, playAgainImg;
let myFont;

// --- START SCREEN assets & state ---
let gameState = "start";  // start, playing, gameover

let bgTile;               // พื้นหลังต่อเนื่อง
let bgScrollX = 0, bgScrollY = 0;
const BG_SPEED_X = 1, BG_SPEED_Y = 1;

let logoImg;              // โลโก้เกม
let startBtnImg;          // ปุ่มเริ่มเกม (ถ้ามีรูป)

// Start button animation/state
let startBtnScale = 1;
let startBtnTarget = 1;
let startPressing = false;
let startIdlePhase = 0;
let startBtnDelay = 0; // 0 = ไม่หน่วง, >0 = กำลังนับถอยหลัง


const START_IDLE_MIN = 0.96;
const START_IDLE_MAX = 1.06;
const START_IDLE_SPEED = 0.0070;

const START_PRESS_SCALE = 1.18;
const START_LERP = 0.18;

// ตำแหน่ง/ขนาดปุ่มเริ่ม (พิกัด baseW×baseH)
const START_BTN_W = 220;
const START_BTN_H = 70;
const START_BTN_CX = baseW / 2;
const START_BTN_CY = baseH * 0.65;

let slapCount = 0;
let bgColor;
let currentImage = 0; // 0=ปกติ, 1=alt1, 2=alt2
let timeLeft = 30;
let lastTimeUpdate = 0;

let buttonScaleLeft = 1;
let buttonScaleRight = 1;
let buttonWidth = 124;
let buttonHeight = 51.5;

let slapFrameLeft = 0;
let slapFrameRight = 0;
let handW = 200;
let handH = 200;
const HAND_FRAMES = 8;

// Play Again animation
let playAgainScale = 1;
let playAgainAnimating = false;
let playAgainFrames = 0;
const PLAY_AGAIN_BOUNCE = 1.25;       // ขยาย 25%
const PLAY_AGAIN_DELAY_FRAMES = 15;   // หน่วง 15 เฟรมก่อน restart


let slapLinger = 0; // ค้างภาพหลังปล่อยกี่เฟรม

let lastPunchTime = 0;
const punchCooldownMs = 80; // 1 slap / 80ms

/* =======================
   Web Audio (no p5.Sound)
======================= */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null, masterGain = null;

let slapBuf1=null, slapBuf2=null, bgmBuf=null, endBuf=null, buttonBuf=null;
let bgmHandle = null;
const activeSources = new Set();
let audioReady = false;
const MAX_CONCURRENT_SLAPS = 6;

// ✅ สร้าง context อย่างเดียว (ไม่โหลดไฟล์)
function initCtxOnce() {
  if (ctx) return;
  ctx = new AudioCtx({ latencyHint: "interactive" });
  masterGain = ctx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(ctx.destination);
}

// ✅ โหลดเฉพาะเสียงปุ่ม (ไฟล์เล็ก → เร็ว)
async function loadButtonSound() {
  if (!ctx || buttonBuf) return;
  buttonBuf = await loadBuffer("button.mp3"); // แนะนำ .wav จะไวกว่า
}

// ✅ โหลดเสียงที่เหลือ (ทำตามหลัง)
async function loadRestAudio() {
  if (!ctx) return;
  if (slapBuf1 && slapBuf2 && bgmBuf && endBuf) { audioReady = true; return; }
  [slapBuf1, slapBuf2, bgmBuf, endBuf] = await Promise.all([
    loadBuffer("punch1.mp3"),
    loadBuffer("punch2.mp3"),
    loadBuffer("bgm.mp3"),
    loadBuffer("end.mp3"),
  ]);
  audioReady = true;
}

async function loadBuffer(url) {
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  return await new Promise((resolve, reject) => {
    ctx.decodeAudioData(arr, resolve, reject);
  });
}

function ensureResume(){ if (ctx && ctx.state === "suspended") ctx.resume(); }

function playBufferOnce(buffer, { loop=false, volume=1 }={}) {
  if (!ctx || !buffer) return null;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.buffer = buffer;
  src.loop = loop;
  src.connect(gain).connect(masterGain);
  src.start();
  src.onended = () => { try{src.disconnect();}catch(e){} activeSources.delete(src); };
  activeSources.add(src);
  return { src, gain };
}

function playButtonSound(){ if (buttonBuf) playBufferOnce(buttonBuf, {volume:1}); }

function playBGM(){ if (bgmBuf){ stopBGM(); bgmHandle = playBufferOnce(bgmBuf,{loop:true,volume:0.5}); } }

function stopBGM(){ if (bgmHandle && bgmHandle.src){ try{bgmHandle.src.stop(0); bgmHandle.src.disconnect();}catch(e){} activeSources.delete(bgmHandle.src); bgmHandle=null; } }

function playEndMusic() {
  if (!audioReady || !endBuf) return;
  playBufferOnce(endBuf, { loop: false, volume: 1 });
}

function countActiveSlaps() {
  let n = 0;
  activeSources.forEach(s => { if (s && !s.loop) n++; });
  return n;
}

function playSlap(which) {
  if (!audioReady) return;
  const nowMs = performance.now();
  if (nowMs - lastPunchTime < punchCooldownMs) return;
  lastPunchTime = nowMs;
  if (countActiveSlaps() >= MAX_CONCURRENT_SLAPS) return;
  const buf = (which === 1) ? slapBuf1 : slapBuf2;
  playBufferOnce(buf, { loop: false, volume: 1 });
}

function stopAllAudio() {
  stopBGM();
  activeSources.forEach(s => { try { s.stop(0); s.disconnect(); } catch(e){} });
  activeSources.clear();
}

/* =======================
   p5 preload/setup/draw
======================= */
function preload() {
  // หน้า start
  bgTile = loadImage("bg_tile.png");
  logoImg = loadImage("logo.png");
  startBtnImg = loadImage("start_btn.png"); // ถ้ามีไฟล์ปุ่ม

  // รูปเกม
  img = loadImage("woman_8bit.png");
  altImg1 = loadImage("alt_image_1.png");
  altImg2 = loadImage("alt_image_2.png");
  imgSpecial = loadImage("special_image.png");
  impactImg = loadImage("impact.png");
  button1Img = loadImage("Button_1.png");
  handLeftImg = loadImage("hand_left.png");
  handRightImg = loadImage("hand_right.png");
  playAgainImg = loadImage("play_again.png");

  myFont = loadFont("myFont.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  bgColor = color("#FFFFFF"); // พื้นหลังขาวถาวร
  textFont(myFont);
  textSize(48);
  fill(255);
  noStroke();
  lastTimeUpdate = millis();
  pixelDensity(1);
  drawingContext.imageSmoothingEnabled = false;
  frameRate(60);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAllAudio();
  });
}

/* =======================
   EFFECT: Trigger impact
======================= */
function triggerImpact(side) {
  // ปรับตำแหน่งให้ตรงแก้มภาพของคุณ
  const cheekLeft  = { x: baseW/2 - 60, y: baseH/2 - 10 };
  const cheekRight = { x: baseW/2 + 60, y: baseH/2 - 10 };
  const pos = (side === 'left') ? cheekLeft : cheekRight;
  impactFx.x = pos.x;
  impactFx.y = pos.y;
  impactFx.frame = 0;
  impactFx.active = true;
}

function draw() {
  background(bgColor);

  // ===== START SCREEN =====
  if (gameState === "start") {
    const s = Math.min(width / baseW, height / baseH);
    const ox = (width - baseW * s) / 2;
    const oy = (height - baseH * s) / 2;

    push();
    translate(ox, oy);
    scale(s);

    // ===== พื้นหลังลูป (anti-seam) =====
    if (bgTile) {
      bgScrollX = (bgScrollX + BG_SPEED_X) % bgTile.width;
      bgScrollY = (bgScrollY + BG_SPEED_Y) % bgTile.height;

      const sx = Math.floor(- (bgScrollX % bgTile.width));
      const sy = Math.floor(- (bgScrollY % bgTile.height));
      const startX = sx - bgTile.width;
      const startY = sy - bgTile.height;

      for (let x = startX; x <= baseW; x += bgTile.width) {
        for (let y = startY; y <= baseH; y += bgTile.height) {
          image(bgTile, Math.floor(x), Math.floor(y), bgTile.width + 1, bgTile.height + 1);
        }
      }
    }

    // โลโก้
    if (logoImg) {
      imageMode(CENTER);
      image(logoImg, baseW/2, baseH*0.38, 340, 340);
    }

    // ===== ปุ่มเริ่ม (animate + press-hold) =====
    imageMode(CENTER);
    if (!startPressing) {
      startIdlePhase += START_IDLE_SPEED * deltaTime;
      const t = (Math.sin(startIdlePhase) + 1) * 0.5;
      startBtnTarget = START_IDLE_MIN + (START_IDLE_MAX - START_IDLE_MIN) * t;
    }
    startBtnScale = lerp(startBtnScale, startBtnTarget, START_LERP);
    const btnW = Math.round(START_BTN_W * startBtnScale);
    const btnH = Math.round(START_BTN_H * startBtnScale);

    if (startBtnImg) {
      image(startBtnImg, START_BTN_CX, START_BTN_CY, btnW, btnH);
    } else {
      push();
      noStroke();
      fill(0, 0, 0, 200);
      rectMode(CENTER);
      rect(START_BTN_CX, START_BTN_CY, btnW, btnH, 12);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(28 * startBtnScale);
      text("PLAY", START_BTN_CX, START_BTN_CY + 2);
      pop();
    }
    
if (startBtnDelay > 0) {
    startBtnDelay--;
    if (startBtnDelay === 0) {
      gameState = "playing";
    }
  }

    // ===== ข้อความลิขสิทธิ์ด้านล่างสุดของจอ =====
fill(255); // สีขาว
textAlign(CENTER, BOTTOM);
textSize(24);
text("©2025, EGO_SPACE Games", baseW / 2, baseH - 10);
    
    pop();
    return; // ไม่ไปวาดส่วนอื่น
    
  }

  // ===== PLAYING =====
  if (gameState === "playing") {
    if (millis() - lastTimeUpdate >= 1000) {
      timeLeft--;
      lastTimeUpdate = millis();
      if (timeLeft <= 0) gameOver();
    }

    scaleFactor = min(width / baseW, height / baseH);
    const offsetX = (width - baseW * scaleFactor) / 2;
    const offsetY = (height - baseH * scaleFactor) / 2;

    push();
    translate(offsetX, offsetY);
    scale(scaleFactor);

    // พื้นหลังเกม/ตัวละคร — ให้ภาพตอนตบมี priority สูงสุด
    let baseImage;
    if (currentImage === 1) baseImage = altImg1;
    else if (currentImage === 2) baseImage = altImg2;
    else if (slapCount > SLAP_LIMIT) baseImage = imgSpecial;
    else baseImage = img;
    image(baseImage, 0, 0, baseW, baseH);

    // ครอปพื้นที่วาด effect+มือ ให้อยู่ในกรอบ 380×640
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(0, 0, baseW, baseH);
    drawingContext.clip();

    // IMPACT FX
    if (impactFx.active && impactImg) {
      const t = impactFx.frame / (impactFx.maxFrames - 1);
      const impactSize = impactFx.startSize + (impactFx.endSize - impactFx.startSize) * t;
      imageMode(CENTER);
      image(impactImg, impactFx.x, impactFx.y, impactSize, impactSize);
      impactFx.frame++;
      if (impactFx.frame >= impactFx.maxFrames) impactFx.active = false;
    }

    // มือซ้าย/ขวา
    imageMode(CENTER);
    if (slapFrameLeft > 0) {
      const p = (HAND_FRAMES - slapFrameLeft) / HAND_FRAMES;
      const cx = (0 + handW/2) + p * 200;   // เริ่มซ้ายขอบ เข้ามา 200px
      const cy = baseH / 2 + 25;
      image(handLeftImg, cx, cy, handW, handH);
      slapFrameLeft--;
    }
    if (slapFrameRight > 0) {
      const p = (HAND_FRAMES - slapFrameRight) / HAND_FRAMES;
      const cx = (baseW - handW/2) - p * 200; // เริ่มขวาขอบ เข้ามา 200px
      const cy = baseH / 2 + 25;
      image(handRightImg, cx, cy, handW, handH);
      slapFrameRight--;
    }

    // ค้างภาพตอนตบ 2 เฟรมหลังปล่อย
    if (slapFrameLeft <= 0 && slapFrameRight <= 0) {
      if (slapLinger > 0) slapLinger--;
      else currentImage = 0;
    }

    drawingContext.restore();
    pop();

    // ปุ่มซ้าย
    image(
      button1Img,
      80 - (buttonWidth * buttonScaleLeft) / 2,
      baseH - 60 - (buttonHeight * buttonScaleLeft) / 2,
      buttonWidth * buttonScaleLeft,
      buttonHeight * buttonScaleLeft
    );

    // ปุ่มขวา
    image(
      button1Img,
      baseW - 80 - (buttonWidth * buttonScaleRight) / 2,
      baseH - 60 - (buttonHeight * buttonScaleRight) / 2,
      buttonWidth * buttonScaleRight,
      buttonHeight * buttonScaleRight
    );

    // HUD
    textAlign(LEFT, TOP);
    fill("#FFD700");
    textSize(30);
    text(`Slap : ${slapCount}`, 10, 10);

    textAlign(RIGHT, TOP);
    fill("#FFFFFF"); // ให้เห็นชัดบนพื้นขาว
    textSize(30);
    text(`Time : ${timeLeft} `, baseW - 10, 10);

    pop();
  }

  // ===== GAMEOVER =====
  // ===== GAMEOVER =====
else if (gameState === "gameover") {
  const s = Math.min(width / baseW, height / baseH);
  const ox = (width - baseW * s) / 2;
  const oy = (height - baseH * s) / 2;

  push();
  translate(ox, oy);
  scale(s);

  fill("#FFFFFF");
  textAlign(CENTER, CENTER);
  textSize(60);
  text("GAME OVER", baseW / 2, baseH / 2 - 60);

  textSize(48);
  fill("#FFD700");
  text(`Slap Count : ${slapCount}`, baseW / 2, baseH / 2);
  
  // ===== ข้อความลิขสิทธิ์ด้านล่างสุดของจอ =====
fill(255); // สีขาว
textAlign(CENTER, BOTTOM);
textSize(24);
text("©2025, EGO_SPACE Games", baseW / 2, baseH - 10);

  // ---- ปุ่ม Play Again (มีอนิเมชัน) ----
  imageMode(CENTER);
  const btnCX = baseW / 2;
  const btnCY = baseH / 2 + 100;
  const baseBtnW = 200, baseBtnH = 200;

  // ถ้ากำลังอนิเมต ให้ค่อยๆ เข้าเป้าสเกล 1.25 และนับเฟรม
  if (playAgainAnimating) {
    playAgainScale = lerp(playAgainScale, PLAY_AGAIN_BOUNCE, 0.35);
    playAgainFrames++;
    if (playAgainFrames >= PLAY_AGAIN_DELAY_FRAMES) {
      // จบหน่วง → รีสตาร์ทเกม
      playAgainAnimating = false;
      playAgainScale = 1;
      restartGame();
      pop();
      return; // ออกจากสาขานี้เพราะ state เปลี่ยนแล้ว
    }
  }

  image(playAgainImg, btnCX, btnCY, baseBtnW * playAgainScale, baseBtnH * playAgainScale);

  pop();
}
}

/* =======================
   INPUT
======================= */
function handlePress(x, y) {
  // แปลงพิกัดจอ → พิกัดฐาน (baseW×baseH)
  const s  = Math.min(width / baseW, height / baseH);
  const ox = (width - baseW * s) / 2;
  const oy = (height - baseH * s) / 2;
  const imgX = (x - ox) / s;
  const imgY = (y - oy) / s;

  // ====== GAME OVER: ปุ่ม Play Again ======
 if (gameState === "gameover") {
  const btnX = baseW / 2;
  const btnY = baseH / 2 + 100;

  // กดซ้ำระหว่างอนิเมชันไม่ต้องทำอะไร
  if (!playAgainAnimating && dist(imgX, imgY, btnX, btnY) < 80) {
    initCtxOnce();
    ensureResume();
    playButtonSound();        // 🔊 เล่นเสียงทันทีตอนกด
    // เริ่มอนิเมชันเด้ง + หน่วง
    playAgainAnimating = true;
    playAgainFrames = 0;
    playAgainScale = 1;       // เริ่มเด้งจากสเกล 1
  }
  return;
}


  // ====== PLAYING: ปุ่มซ้าย/ขวา ======
  if (gameState !== "playing") return;

  // ปุ่มซ้าย
  if (
    imgX > 80 - buttonWidth / 2 &&
    imgX < 80 + buttonWidth / 2 &&
    imgY > baseH - 60 - buttonHeight / 2 &&
    imgY < baseH - 60 + buttonHeight / 2
  ) {
    buttonScaleLeft = 1.25;
    slapFrameLeft = HAND_FRAMES;
    currentImage = 2;
    slapCount++;
    playSlap(1);
    triggerImpact('left');
    if (!bgmHandle) playBGM();
    return;
  }

  // ปุ่มขวา
  if (
    imgX > baseW - 80 - buttonWidth / 2 &&
    imgX < baseW - 80 + buttonWidth / 2 &&
    imgY > baseH - 60 - buttonHeight / 2 &&
    imgY < baseH - 60 + buttonHeight / 2
  ) {
    buttonScaleRight = 1.25;
    slapFrameRight = HAND_FRAMES;
    currentImage = 1;
    slapCount++;
    playSlap(2);
    triggerImpact('right');
    if (!bgmHandle) playBGM();
    return;
  }
}

function handleRelease() {
  if (gameState === "playing") {
    slapLinger = 2; // ค้างภาพอีก 2 เฟรม
    buttonScaleLeft = 1;
    buttonScaleRight = 1;
    slapFrameLeft = 0;
    slapFrameRight = 0;
  }
}

/* =======================
   MOUSE / TOUCH
======================= */
function mousePressed() {
  if (gameState === "start") {
    const s = Math.min(width / baseW, height / baseH);
    const ox = (width - baseW * s) / 2;
    const oy = (height - baseH * s) / 2;
    const imgX = (mouseX - ox) / s;
    const imgY = (mouseY - oy) / s;

    const btnW = START_BTN_W * startBtnScale;
    const btnH = START_BTN_H * startBtnScale;
    const inBtn = Math.abs(imgX - START_BTN_CX) <= btnW/2 &&
                  Math.abs(imgY - START_BTN_CY) <= btnH/2;

    if (inBtn) {
  startPressing = true;
  startBtnTarget = START_PRESS_SCALE;

  initCtxOnce();
  ensureResume();

  // เล่นเสียงปุ่มทันที
  loadButtonSound().then(() => { playButtonSound(); });

  // โหลดเสียงอื่นๆ ต่อ
  loadRestAudio().then(() => { playBGM(); });

  // เริ่มหน่วงเวลา 15 เฟรม
  startBtnDelay = 15;

  return;
}
  }
  

  if (gameState === "gameover") {
    handlePress(mouseX, mouseY);
    return;
  }

  if (gameState === "playing") {
    if (!ctx) { awaitAudioStart(); } else { ensureResume(); }
    handlePress(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (gameState === "start") {
    if (startPressing) {
      startPressing = false;
      startBtnTarget = 1;
      gameState = "playing";
    }
    return;
  }
  if (gameState === "playing") handleRelease();
}

function touchStarted() {
  if (gameState === "start") {
    const s = Math.min(width / baseW, height / baseH);
    const ox = (width - baseW * s) / 2;
    const oy = (height - baseH * s) / 2;
    const t = touches[0] || { x: mouseX, y: mouseY };
    const imgX = (t.x - ox) / s;
    const imgY = (t.y - oy) / s;

    const btnW = START_BTN_W * startBtnScale;
    const btnH = START_BTN_H * startBtnScale;
    const inBtn = Math.abs(imgX - START_BTN_CX) <= btnW/2 &&
                  Math.abs(imgY - START_BTN_CY) <= btnH/2;

    if (inBtn) {
  startPressing = true;
  startBtnTarget = START_PRESS_SCALE;

  initCtxOnce();
  ensureResume();

  // เล่นเสียงปุ่มทันที
  loadButtonSound().then(() => { playButtonSound(); });

  // โหลดเสียงอื่นๆ ต่อ
  loadRestAudio().then(() => { playBGM(); });

  // เริ่มหน่วงเวลา 15 เฟรม
  startBtnDelay = 15;

  return;
}
  }

  if (gameState === "gameover") {
    const t = touches[0] || { x: mouseX, y: mouseY };
    handlePress(t.x, t.y);
    return false;
  }

  if (gameState === "playing" && touches.length > 0) {
    if (!ctx) { awaitAudioStart(); } else { ensureResume(); }
    handlePress(touches[0].x, touches[0].y);
  }
  return false;
}

function touchEnded() {
  if (gameState === "start") {
    if (startPressing) {
      startPressing = false;
      startBtnTarget = 1;
      gameState = "playing";
    }
    return false;
  }
  handleRelease();
  return false;
}

/* =======================
   HELPERS
======================= */
async function awaitAudioStart() {
  initCtxOnce();
  await loadRestAudio();
  ensureResume();
  playBGM();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

/* =======================
   GAME FLOW
======================= */
function gameOver() {
  gameState = "gameover";
  bgColor = color("#F12718"); // ตั้งสีพื้นหลัง Game Over ที่นี่ครั้งเดียว
  stopBGM();
  playEndMusic();
}

function restartGame() {
  stopAllAudio();
  slapCount = 0;
  timeLeft = 30;
  gameState = "playing";
  currentImage = 0;
  bgColor = color("#FFFFFF");
  buttonScaleLeft = 1;
  buttonScaleRight = 1;
  slapFrameLeft = 0;
  slapFrameRight = 0;
  lastTimeUpdate = millis();
  playBGM();
}
