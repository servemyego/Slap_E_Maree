let img;
let aspectRatio = 360 / 640; // อัตราส่วนต้นฉบับ (กว้าง/สูง) เช่น 360x640

function preload() {
  img = loadImage("woman_8bit.png"); // เปลี่ยนชื่อไฟล์ให้ตรงกับโปรเจกต์
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
}

function draw() {
  background('#FF4B4B'); // สีพื้นหลัง

  let canvasAspect = width / height;
  let drawWidth, drawHeight;

  if (canvasAspect > aspectRatio) {
    // จอฟิตความสูง (มือถือแนวนอน)
    drawHeight = height;
    drawWidth = drawHeight * aspectRatio;
  } else {
    // จอฟิตความกว้าง (มือถือแนวตั้ง)
    drawWidth = width;
    drawHeight = drawWidth / aspectRatio;
  }

  image(img, width / 2, height / 2, drawWidth, drawHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
