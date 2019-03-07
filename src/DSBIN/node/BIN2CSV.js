/*
 * Copyright (c) 2019 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const fs = require('fs');
const pako = require('pako');
const path = require('path');
const cliProgress = require('cli-progress');

function getRowGetter(header, view, offset) {
    return i => {
        const ret = {};
        header.columnOrder.forEach(column => {
            if (header.columns[column].type === 'Float32') {
                ret[column] = view.readFloatLE(offset + i * header.rowSize + header.columns[column].offset);
            } else if (header.columns[column].type === 'Uint32') {
                ret[column] = view.readUInt32LE(offset + i * header.rowSize + header.columns[column].offset);
            } else if (header.columns[column].type === 'Int32') {
                ret[column] = view.readInt32LE(offset + i * header.rowSize + header.columns[column].offset);
            } else {
                const sOff = offset + i * header.rowSize + header.columns[column].offset;
                const size = view.readUInt8(sOff);
                let b;
                ret[column] = '';
                for (let i = 0; i < size; ++i) {
                    b = view.readUInt8(sOff + i + 1);
                    if (b === 0) {
                        break;
                    } else {
                        ret[column] += String.fromCharCode(b);
                    }
                }
            }
        });
        return ret;
    }
}

async function main(argv) {
    if (argv.length < 4) {
        if (argv.length < 3 || (argv[2] !== '-h' && argv[2] !== '--help')) {
            console.error('Not enough arguments.');
        }
        console.log('Usage: BIN2CSV [INPUT_FILE] [OUTPUT_FILE]');
        return;
    }

    const input = path.resolve(process.cwd(), argv[2]);
    const output = path.resolve(process.cwd(), argv[3]);

    console.log('LOADING FILE...');
    const compressed = fs.readFileSync(input, null);

    console.log('INFLATING FILE...');
    const uncompressed = pako.inflate(compressed);

    console.log('READING HEADER...');
    const view = Buffer.from(uncompressed.buffer);
    const headerSize = view.readUInt32LE(0);

    let headerString = '';
    let b;
    for (let i = 0; i < headerSize; ++i) {
        b = view.readUInt8(4 + i);
        if (b === 0) {
            break;
        } else {
            headerString += String.fromCharCode(b);
        }
    }

    const header = JSON.parse(headerString);
    const rowGetter = getRowGetter(header, view, headerSize + 4);

    const outputStream = fs.createWriteStream(output);
    const progressBar = new cliProgress.Bar({
        format: '{task}: [{bar}] {percentage}% | ETA: {eta_formatted} | Elapsed: {duration_formatted}',
        fps: 2,
        etaBuffer: Math.floor(header.count / 10),
    }, cliProgress.Presets.shades_classic);

    let rowString = '';

    header.columnOrderOriginal.forEach(column => {
        if (rowString.length) {
            rowString += ',';
        }
        rowString += `"${column}"`;
    });
    rowString += '\n';
    outputStream.write(rowString);

    progressBar.start(header.count, 0, { task: 'WRITING CSV' });

    let row;
    for (let i = 0; i < header.count; ++i) {
        row = rowGetter(i);
        rowString = '';
        header.columnOrderOriginal.forEach(column => {
            if (rowString.length) {
                rowString += ',';
            }
            rowString += `"${row[column]}"`;
        });
        rowString += '\n';
        outputStream.write(rowString);
        progressBar.update(i + 1);
    }

    progressBar.stop();

    console.log('DONE!');
}

main(process.argv);
