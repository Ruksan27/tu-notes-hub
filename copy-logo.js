const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'public', 'top nav log o.png');
const destLogo = path.join(__dirname, 'public', 'logo.png');
const destIcon = path.join(__dirname, 'public', 'icon.png');
const destFavicon = path.join(__dirname, 'public', 'favicon.ico');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, destLogo);
  fs.copyFileSync(src, destIcon);
  console.log('Successfully copied logo files to public/logo.png and public/icon.png');
} else {
  console.log('Source logo file not found');
}
