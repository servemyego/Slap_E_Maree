let baseW = 380;
let baseH = 640;
let img;
let scaleFactor;

function preload() {
  img = loadImage("woman_8bit.png"); // ใส่ชื่อไฟล์ภาพให้ตรงกับโปรเจกต์
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
}

function draw() {
  background('#FF4B4B');

  // หาสเกลที่เหมาะสมที่สุดเพื่อให้ภาพไม่หลุดขอบ
  scaleFactor = min(width / baseW, height / baseH);

  // คำนวณตำแหน่งเริ่มต้นให้ภาพอยู่กลางจอ
  let offsetX = (width - baseW * scaleFactor) / 2;
  let offsetY = (height - baseH * scaleFactor) / 2;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // วาดภาพพื้นหลัง (ขนาด 380x640)
  image(img, 0, 0, baseW, baseH);

  // วาดปุ่มด้านซ้ายล่าง
  fill(255);
  ellipse(40, baseH - 40, 50, 50);

  // วาดปุ่มด้านขวาล่าง
  ellipse(baseW - 40, baseH - 40, 50, 50);

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
