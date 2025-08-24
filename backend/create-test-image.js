const sharp = require('sharp');

// Create a simple blue test image
sharp({
  create: {
    width: 800,
    height: 600,
    channels: 4,
    background: { r: 0, g: 100, b: 200, alpha: 1 }
  }
})
.png()
.toFile('test-hotel.png')
.then(() => {
  console.log('Test image created: test-hotel.png');
})
.catch(err => {
  console.error('Error creating test image:', err);
});