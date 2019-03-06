const csv = require('csv-parser');
const fs = require('fs');

function processCSV(file, options, cb) {
    const csvOptions = Object.assign({}, options);
    return new Promise((resolve, reject) => {
        let totalBytesRead = 0;
        const stream = fs.createReadStream(file)
            .pipe(csv(csvOptions))
            .on('headers', data => {
                totalBytesRead += stream._currentRowBytes;
                cb(null, data, totalBytesRead);
            })
            .on('data', (data) => {
                totalBytesRead += stream._currentRowBytes;
                cb(data, null, totalBytesRead);
            }).on('end', () => {
                stream.destroy();
            }).on('error', e => {
                reject(e);
            }).on('close', () => {
                resolve();
            });
    });
}

module.exports = processCSV;
