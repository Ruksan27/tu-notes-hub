const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const publicDir = path.join(__dirname, 'public');
  const gifSrc = path.join(publicDir, 'Logo.gif');
  const pngSrc = path.join(publicDir, 'top nav log o.png');
  const sourceFile = fs.existsSync(gifSrc) ? gifSrc : pngSrc;
  const darkBg = { r: 8, g: 10, b: 18, alpha: 1 };

  try {
    await sharp(sourceFile, { page: 0 }).resize(512, 512, { fit: 'contain', background: darkBg }).png().toFile(path.join(publicDir, 'icon-512.png'));
    await sharp(sourceFile, { page: 0 }).resize(192, 192, { fit: 'contain', background: darkBg }).png().toFile(path.join(publicDir, 'icon-192.png'));
    await sharp(sourceFile, { page: 0 }).resize(180, 180, { fit: 'contain', background: darkBg }).png().toFile(path.join(publicDir, 'apple-icon.png'));
    await sharp(sourceFile, { page: 0 }).resize(512, 512, { fit: 'contain', background: darkBg }).png().toFile(path.join(publicDir, 'logo.png'));
    await sharp(sourceFile, { page: 0 }).resize(192, 192, { fit: 'contain', background: darkBg }).png().toFile(path.join(publicDir, 'icon.png'));

    console.log('Successfully generated 1:1 square PNG icons from Logo.gif!');
  } catch (err) {
    console.error('Sharp error:', err.message);
  }
}

generateIcons();
