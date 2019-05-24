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

import {DSBINInflate} from './DSBINInflate';

/**
 * Loads a DSBIN from a set of blobs.
 * @param {Uint32Array} indices - A SharedArrayBuffer-backed array with the current index of the chunk being loaded and the total number of chunks.
 * @param {Array} chunks - The chunks to load.
 * @param {SharedArrayBuffer} uncompressed - Memory where to store the uncompressed chunks.
 * @return {Promise<void>}
 * @memberof DSBINLoaderWorker
 * @private
 */
async function loadFromBlobs(indices, chunks, uncompressed) {
    const reader = new FileReader();
    let readerResolve;
    reader.addEventListener('loadend', () => {
        readerResolve(new Uint8Array(reader.result));
    });
    const readBlob = function(blob) {
        return new Promise(resolve => {
            readerResolve = resolve;
            reader.readAsArrayBuffer(blob);
        });
    };

    let compressedBuffer;
    let uncompressedBuffer;
    for (let i = Atomics.add(indices, 0, 1); i < indices[1]; i = Atomics.add(indices, 0, 1)) {
        compressedBuffer = await readBlob(chunks[i].compressedBlob);
        uncompressedBuffer = new Uint8Array(uncompressed, chunks[i].uncompressedOffset, chunks[i].uncompressedSize);
        DSBINInflate.inflate(compressedBuffer, uncompressedBuffer, chunks[i].uncompressedSize);
    }
}

/**
 * Loads a chunk of a DSBIN form the specified buffer.
 * @param {Uint8Array} compressedBuffer - The compressed memory.
 * @param {SharedArrayBuffer} uncompressed - Memory where to store the uncompressed buffer.
 * @param {number} offset - Offset, in bytes, where to write the uncompressed memory.
 * @param {number} size - The expected uncompressed size of the buffer.
 * @memberof DSBINLoaderWorker
 * @private
 */
function loadBuffer(compressedBuffer, uncompressed, offset, size) {
    // console.log(`compressedBuffer:${compressedBuffer} uncompressed:${uncompressed} offset:${offset} size:${size}`);
    const uncompressedBuffer = new Uint8Array(uncompressed, offset, size);
    DSBINInflate.inflate(compressedBuffer, uncompressedBuffer, size);
}

/**
 * Message event handler for messages sent from this worker's  "owner"
 * @param {Event} e - The event containing the message.
 * @return {Promise<void>}
 * @memberof DSBINLoaderWorker
 * @private
 */
self.onmessage = async function DSBINLoaderWorkerOnMessage(e) {
    const message = e.data;

    if (message.type === 'loadBlobs') {
        await loadFromBlobs(message.indices, message.chunks, message.uncompressed);
        self.postMessage({
            type: 'success',
        });
    } else if (message.type === 'loadBuffer') {
        loadBuffer(message.buffer, message.uncompressed, message.uncompressedOffset, message.uncompressedSize);
        self.postMessage({
            type: 'success',
        });
    } else if (message.type === 'close') {
        self.postMessage({
            type: 'success',
        });
        close();
    } else {
        throw `ERROR: Unrecognized message type ${message.type}`;
    }
};
