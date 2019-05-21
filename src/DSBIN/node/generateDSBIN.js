const fs = require('fs');
const pako = require('pako');
const path = require('path');
const cliProgress = require('cli-progress');
const dekkai = require('dekkai/dist/umd/dekkai');
const WebCPU = require('webcpu/dist/umd/webcpu').WebCPU;

function open(file) {
    return new Promise((resolve, reject) => {
        fs.open(path.resolve(file), (err ,fd) => {
            if (err) {
                reject(err);
            } else {
                resolve(fd);
            }
        });
    });
}

function buildBinaryHeader(header) {
    const columnCount = header.columns.length;
    let columnNameLength = 0;

    for (let i = 0; i < columnCount; ++i) {
        columnNameLength += Math.min(255, header.columns[i].name.length) + 1;
    }

    const headerLength = 12 * columnCount + columnNameLength + 20;
    const buffer = new ArrayBuffer(headerLength);
    const view = new DataView(buffer);
    let nameOffset = 12 * columnCount + 20;
    let offset = 0;
    let name;
    let ii;
    let nn;

    view.setUint32(offset, headerLength, true); // header length
    offset += 4;

    view.setUint32(offset, columnCount, true);
    offset += 4;

    view.setUint32(offset, header.rowCount, true);
    offset += 4;

    view.setUint32(offset, header.rowLength, true);
    offset += 4;

    view.setUint32(offset, header.dataLength, true);
    offset += 4;

    for (let i = 0; i < columnCount; ++i) {
        view.setUint32(offset, header.columns[i].length, true);
        offset += 4;

        view.setUint32(offset, header.columns[i].offset, true);
        offset += 4;

        view.setUint32(offset, header.columns[i].type, true);
        offset += 4;

        name = header.columns[i].name;
        nn = Math.min(255, name.length);
        view.setUint8(nameOffset++, nn);

        for (ii = 0; ii < nn; ++ii) {
            view.setUint8(nameOffset++, name.charCodeAt(ii));
        }
    }

    return buffer;
}

async function main(argv) {
    if (argv.length < 4) {
        if (argv.length < 3 || (argv[2] !== '-h' && argv[2] !== '--help')) {
            console.error('Not enough arguments.');
        }
        console.log('Usage: generateDSBIN [INPUT_FILE] [OUTPUT_FILE]');
        return;
    }

    const progressBar = new cliProgress.Bar({
        format: '{task}: [{bar}] {percentage}% | ETA: {eta_formatted} | Elapsed: {duration_formatted}',
        fps: 2,
    }, cliProgress.Presets.shades_classic);

    const input = path.resolve(process.cwd(), argv[2]);
    const output = path.resolve(process.cwd(), argv[3]);
    const file = await open(input);

    const {estimatedPhysicalCores: workerCount} = await WebCPU.detectCPU();
    const DataTools = dekkai.DataTools;
    await dekkai.init(workerCount);
    const dataFile = new dekkai.DataFile(file);
    const config = Object.assign({}, DataTools.defaultConfig);

    progressBar.start(1, 0, { task: 'Chunking' });
    const {header, offset} = await DataTools.readHeader(dataFile, config);
    const blobs = await DataTools.sliceFile(dataFile, offset, config);
    progressBar.update(1);
    progressBar.stop();

    progressBar.start(1, 0, { task: 'Parsing' });
    const result = await DataTools.binaryChunksFromBlobs(blobs, header, config);
    progressBar.update(1);
    progressBar.stop();

    progressBar.start(1, 0, { task: 'Merging' });
    const tableHeader = buildBinaryHeader(result.header);
    const memory = new SharedArrayBuffer(result.header.dataLength + tableHeader.byteLength);

    const headerView = new Uint8Array(tableHeader);
    const memoryView = new Uint8Array(memory);
    memoryView.set(headerView, 0);

    config.output = {
        buffer: memory,
        offset: tableHeader.byteLength,
    };

    await DataTools.mergeChunksIntoBuffer(result.chunks, result.header, config);
    progressBar.update(1);
    progressBar.stop();

    dekkai.terminate();

    // 16777216 = 16 MB
    const sizeOf16MB = 16777216;
    const byteLength = memory.byteLength;
    const chunksCount = Math.ceil(byteLength / sizeOf16MB);
    const chunks = [];
    let totalChunksSize = 0;
    let chunk;
    let end;
    let chunkOffset = 0;

    progressBar.start(chunksCount, 0, { task: 'Compressing' });

    for (let i = 0; i < chunksCount; ++i) {
        end = Math.min(chunkOffset + sizeOf16MB, byteLength);
        chunk = {
            length: end - chunkOffset,
            buffer: new Uint8Array(memory, chunkOffset, end - chunkOffset),
        };

        chunk.compressed = pako.deflate(chunk.buffer, { level: 9 });
        chunk.compressedLength = chunk.compressed.length;
        chunks.push(chunk);

        totalChunksSize += chunk.compressedLength;
        chunkOffset += sizeOf16MB;

        progressBar.update(i + 1);
    }
    progressBar.stop();

    /*
     * Chunks header format (in Uint32 format)
     * 0: Uncompressed data length in bytes
     * 1: Number of compressed chunks
     * N+2: Uncompressed chunk size
     * N+3: Compressed chunk size
     */
    const chunksHeaderSize = 8 + chunks.length * 8;
    const chunksHeader = Buffer.alloc(chunksHeaderSize);
    chunksHeader.writeUInt32LE(byteLength, 0);
    chunksHeader.writeUInt32LE(chunks.length, 4);
    for (let i = 0; i < chunks.length; ++i) {
        chunksHeader.writeUInt32LE(chunks[i].length, i * 8 + 8);
        chunksHeader.writeUInt32LE(chunks[i].compressedLength, i * 8 + 12);
    }

    progressBar.start(chunksHeaderSize + totalChunksSize, 0, { task: 'Writing' });
    fs.writeFile(output + '.json', JSON.stringify(result.header), err => {
        if (err) {
            progressBar.stop();
            console.log(err);
            return;
        }

        const outputStream = fs.createWriteStream(output);
        chunkOffset = 0;
        outputStream.write(chunksHeader);
        chunkOffset += chunksHeaderSize;
        progressBar.update(chunkOffset);

        for (let i = 0; i < chunks.length; ++i) {
            outputStream.write(chunks[i].compressed);
            chunkOffset += chunks[i].compressedLength;
            progressBar.update(chunkOffset);
        }

        progressBar.stop();
        console.log('DONE!');
    });
}

main(process.argv);
