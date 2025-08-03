let currentImage = 0;
let images = [];
let leftButton, rightButton;
let leftHandImg, rightHandImg;

function preload() {
  images[0] = loadImage('woman_8bit.png');
  images[1] = loadImage('alt_image_1.png');
  images[2] = loadImage('alt_image_2.png');

  leftHandImg = loadImage('left-hand.png');
  rightHandImg = loadImage('right-hand.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  leftButton = { x: 80, y: height - 80, size: 80 };
  rightButton = { x: width - 80, y: height - 80, size: 80 };
}

function draw() {
  background(currentImage === 0 ? '#1E90FF' : '#FF4444');

  // ขนาดภาพที่ฟิตจอ โดยยังรักษาสัดส่วนเดิม
  let img = images[currentImage];
  let scaleFactor = min(width / img.width, height / img.height) * 0.6;
  let imgW = img.width * scaleFactor;
  let imgH = img.height * scaleFactor;
  image(img, width / 2, height / 2, imgW, imgH);

  image(leftHandImg, leftButton.x, leftButton.y, leftButton.size, leftButton.size);
  image(rightHandImg, rightButton.x, rightButton.y, rightButton.size, rightButton.size);
}

// Desktop
function mousePressed() {
  handlePress(mouseX, mouseY);
}

function mouseReleased() {
  currentImage = 0;
}

// Mobile
function touchStarted() {
  handlePress(touchX, touchY);
  return false;
}

function touchEnded() {
  currentImage = 0;
  return false;
}

function handlePress(x, y) {
  if (dist(x, y, leftButton.x, leftButton.y) < leftButton.size / 2) {
    currentImage = 1;
  }
  if (dist(x, y, rightButton.x, rightButton.y) < rightButton.size / 2) {
    currentImage = 2;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
