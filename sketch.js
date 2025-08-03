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
  image(images[currentImage], width/2, height/2);

  image(leftHandImg, leftButton.x, leftButton.y, leftButton.size, leftButton.size);
  image(rightHandImg, rightButton.x, rightButton.y, rightButton.size, rightButton.size);
}

function mousePressed() {
  if (dist(mouseX, mouseY, leftButton.x, leftButton.y) < leftButton.size / 2) {
    currentImage = 1;
  }

  if (dist(mouseX, mouseY, rightButton.x, rightButton.y) < rightButton.size / 2) {
    currentImage = 2;
  }
}

function mouseReleased() {
  currentImage = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
