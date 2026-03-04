const fs = require('fs');
const https = require('https');

const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Telmex_Logo.svg/1024px-Telmex_Logo.svg.png';
const dest = 'public/telmex-og.png';

const file = fs.createWriteStream(dest);

https.get(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // spoof user agent to bypass wiki blocks
    }
}, function (response) {
    if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', function () {
            file.close();  // close() is async, call cb after close completes.
            console.log('Download complete');
        });
    } else {
        console.error('Server responded with status code ' + response.statusCode);
    }
}).on('error', function (err) {
    fs.unlink(dest, () => { }); // Delete the file async. (But we don't check the result)
    console.error('Error downloading: ' + err.message);
});
