const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Read .env or .env.local
let envContent = '';
if (fs.existsSync('.env.local')) envContent = fs.readFileSync('.env.local', 'utf8');
if (fs.existsSync('.env')) envContent += '\n' + fs.readFileSync('.env', 'utf8');

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]';
const accounts = JSON.parse(accountsStr);
console.log('Accounts found:', accounts.length);

if (accounts.length > 0) {
  const account = accounts.find(a => a.cloud_name === 'djumuoecv') || accounts[0];
  cloudinary.config({
    cloud_name: account.cloud_name,
    api_key: account.api_key,
    api_secret: account.api_secret,
  });

  const diagonalWatermark = 'l_text:Arial_100_bold:TU%20Notes%20Hub/co_black,o_12,a_-45/fl_layer_apply,g_center';
  const footerLink = 'l_text:Arial_22:tunoteshub.com/co_black,o_60/fl_layer_apply,g_south_east,x_15,y_15';
  const qrLayer = 'l_fetch:aHR0cHM6Ly9hcGkucXJzZXJ2ZXIuY29tL3YxL2NyZWF0ZS1xci1jb2RlLz9zaXplPTEwMHgxMDAmZGF0YT1odHRwcyUzQSUyRiUyRnR1bm90ZXNodWIuY29tJTJGZG93bmxvYWQlMkZjb21wdXRlci1ncmFwaGljcy1hbmQtYW5pbWF0aW9uLTIwMjUtYm9hcmQtZXhhbQ==/c_scale,w_100/fl_layer_apply,g_south_east,x_15,y_45';
  const filename = 'TUNotes_2025';
  const publicId = 'tu-notes-hub/past-papers/zsyemwdngl8ltsj5a3el';
  const version = '1788424995';
  const format = 'png';

  const signedUrl = cloudinary.url(publicId, {
    version,
    format,
    raw_transformation: `fl_attachment:${filename}/${diagonalWatermark}/${qrLayer}/${footerLink}`,
    sign_url: true,
    secure: true
  });
  console.log('Signed URL:', signedUrl);

  fetch(signedUrl).then(res => {
    console.log('Status:', res.status, res.statusText);
  }).catch(err => console.error(err));
}
