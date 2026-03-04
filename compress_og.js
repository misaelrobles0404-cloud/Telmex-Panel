const sharp = require('sharp');
const fs = require('fs');

sharp('public/og-telmex.png')
    .jpeg({ quality: 80, mozjpeg: true })
    .resize(1200, 630)
    .toFile('public/og-telmex-v2.jpg')
    .then(info => {
        console.log('Successfully compressed to JPG. Final size:', (info.size / 1024).toFixed(2), 'KB');
    })
    .catch(err => {
        console.error('Error compressing image', err);
    });
