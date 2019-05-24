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

import DSBINLoaderWorker from 'web-worker:./DSBINLoader.worker';
import {coreCount} from '../core/CoreCount';

/**
 * Minimum number of chunks needed in a file to multi-thread the process.
 * @type {number}
 * @private
 */
const kMinChunksForThreading = 11;

/**
 * Minimum number of web workers.
 * @type {number}
 * @private
 */
const kMinWorkerCount = 1;

/**
 * Multi-threaded DSBIN file loader.
 * @class DSBINLoader
 */
export class DSBINLoader {
    /**
     * Loads a DSBIN from a local file.
     * @param {File} file - The local file to load.
     * @param {Heap} heap - The heap where the file will be loaded.
     * @return {Promise<MemoryBlock>}
     */
    static async loadFromFile(file, heap) {
        return new Promise(resolve => {
            const header = file.slice(0, 8);
            const reader = new FileReader();
            const chunks = [];

            let memory;
            let mode = 0;
            let uncompressedSize;
            let chunkCount;

            reader.addEventListener('loadend', () => {
                const view = new DataView(reader.result);
                if (mode === 0) {
                    uncompressedSize = view.getUint32(0, true);
                    chunkCount = view.getUint32(4, true);
                    mode = 1;

                    memory = heap.malloc(uncompressedSize);

                    const chunkMeta = file.slice(8, 8 + chunkCount * 8);
                    reader.readAsArrayBuffer(chunkMeta);
                } else {
                    const chunksOffset = chunkCount * 8 + 8;
                    const address = memory.address;
                    let chunksCompressedSize = 0;
                    let chunksUncompressedSize = 0;
                    let compressedSize;
                    let compressedOffset;
                    let blob;

                    for (let i = 0; i < chunkCount; ++i) {
                        compressedSize = view.getUint32(i * 8 + 4, true);
                        compressedOffset = chunksOffset + chunksCompressedSize;
                        blob = file.slice(compressedOffset, compressedOffset + compressedSize);
                        const chunk = {
                            compressedBlob: blob,

                            uncompressedSize: view.getUint32(i * 8, true),
                            uncompressedOffset: address + chunksUncompressedSize,
                        };
                        chunksCompressedSize += compressedSize;
                        chunksUncompressedSize += chunk.uncompressedSize;
                        chunks.push(chunk);
                    }

                    if (chunksCompressedSize !== file.size - chunksOffset || chunksUncompressedSize !== uncompressedSize) {
                        throw 'ERROR: Chunks sizes are inconsistent';
                    }

                    this._scheduleBlobLoadingWorkers(chunkCount, chunks, memory.buffer).then(() => resolve(memory));
                }
            });
            reader.readAsArrayBuffer(header);
        });
    }

    /**
     * Loads a DSBIN from a URL.
     * @param {string} url - The URL from which the DSBIN should be loaded.
     * @param {Heap} heap - The heap where the file will be loaded.
     * @return {Promise<MemoryBlock>}
     */
    static async loadFromURL(url, heap) {
        const response = await fetch(url);
        const reader = response.body.getReader();
        const sizesBuffer = new ArrayBuffer(8);
        const sizesView = new DataView(sizesBuffer);

        let bufferOffset = 0;
        let targetRead = 8;
        let read = 0;
        let offset;
        let received;

        while (read < targetRead) {
            received = await reader.read();
            read += received.value.length;
            for (offset = 0; offset < received.value.length && bufferOffset < 8; ++offset) {
                sizesView.setUint8(bufferOffset++, received.value[offset]);
            }
        }

        const totalUncompressedSize = sizesView.getUint32(0, true);
        const chunkCount = sizesView.getUint32(4, true);
        const memory = heap.malloc(totalUncompressedSize);
        const address = memory.address;

        const maxWorkerCount = await coreCount();
        const threadableChunks = chunkCount - kMinChunksForThreading + maxWorkerCount;
        const workerCount = Math.min(maxWorkerCount, Math.max(kMinWorkerCount, threadableChunks));
        const workers = [];
        const workersPromises = [];
        const workersAvailable = [];
        let workersFull = Promise.resolve();
        let workersFullResolve = null;
        for (let i = 0; i < workerCount; ++i) {
            const worker = new DSBINLoaderWorker();
            workers.push(worker);
            workersPromises.push(Promise.resolve());
            workersAvailable.push(true);
        }

        const chunkMetaSize = chunkCount * 8;
        const chunkMetaBuffer = new ArrayBuffer(chunkMetaSize);
        const chunkMetaView = new DataView(chunkMetaBuffer);

        targetRead = chunkMetaSize + 8;
        bufferOffset = 0;

        for (; offset < received.value.length && bufferOffset < chunkMetaSize; ++offset) {
            chunkMetaView.setUint8(bufferOffset++, received.value[offset]);
        }

        while (read < targetRead) {
            received = await reader.read();
            read += received.value.length;
            for (offset = 0; offset < received.value.length && bufferOffset < chunkMetaSize; ++offset) {
                chunkMetaView.setUint8(bufferOffset++, received.value[offset]);
            }
        }

        let chunksUncompressedSize = 0;
        let uncompressedSize;
        let compressedSize;
        let compressedBuffer;
        let compressedView;

        for (let i = 0; i < chunkCount; ++i) {
            uncompressedSize = chunkMetaView.getUint32(i * 8, true);
            compressedSize = chunkMetaView.getUint32(i * 8 + 4, true);
            compressedBuffer = new ArrayBuffer(compressedSize);
            compressedView = new Uint8Array(compressedBuffer);

            targetRead += compressedSize;
            bufferOffset = 0;
            for (; offset < received.value.length && bufferOffset < compressedSize; ++offset) {
                compressedView[bufferOffset++] = received.value[offset];
            }

            while (read < targetRead) {
                received = await reader.read();
                read += received.value.length;
                if (read <= targetRead) {
                    compressedView.set(received.value, bufferOffset);
                    offset = received.value.length;
                    bufferOffset += offset;
                } else {
                    for (offset = 0; offset < received.value.length && bufferOffset < compressedSize; ++offset) {
                        compressedView[bufferOffset++] = received.value[offset];
                    }
                }
            }

            await workersFull;

            let scheduled = false;
            let available = false;
            for (let ii = 0; ii < workerCount; ++ii) {
                if (workersAvailable[ii]) {
                    if (scheduled) {
                        available = true;
                    } else {
                        const index = ii;
                        workersAvailable[index] = false;
                        workersPromises[index] = new Promise(resolve => { // eslint-disable-line
                            workers[index].onmessage = () => {
                                workers[index].onmessage = null;
                                workersAvailable[index] = true;
                                if (workersFullResolve) {
                                    workersFullResolve();
                                    workersFullResolve = null;
                                }
                                resolve();
                            };
                        });

                        workers[index].postMessage({
                            type: 'loadBuffer',
                            buffer: compressedBuffer,
                            uncompressed: memory.buffer,
                            uncompressedOffset: address + chunksUncompressedSize,
                            uncompressedSize: uncompressedSize,
                        }, [ compressedBuffer ]);
                        scheduled = true;
                    }
                }
            }

            if (!available) {
                workersFull = new Promise(resolve => { // eslint-disable-line
                    workersFullResolve = resolve;
                });
            }

            chunksUncompressedSize += uncompressedSize;
        }

        await Promise.all(workersPromises).then(() => {
            for (let i = 0; i < workers.length; ++i) {
                workers[i].postMessage({ type: 'close' });
            }
        });

        return memory;
    }

    /**
     * Schedules workers to load a set of DSBIN chunks into memory.
     * @param {number} chunkCount - The number of chunks to load.
     * @param {Array} chunks - An array of chunks to load.
     * @param {ArrayBufferLike} uncompressed - Memory where to write the uncompressed chunks.
     * @private
     */
    static async _scheduleBlobLoadingWorkers(chunkCount, chunks, uncompressed) {
        const maxWorkerCount = await coreCount();
        const threadableChunks = chunkCount - kMinChunksForThreading + maxWorkerCount;
        const workerCount = Math.min(maxWorkerCount, Math.max(kMinWorkerCount, threadableChunks));
        const indicesBuffer = new SharedArrayBuffer(8);
        const indices = new Uint32Array(indicesBuffer);
        const workers = [];
        indices[0] = 0;
        indices[1] = chunkCount;
        const promises = [];
        for (let i = 0; i < workerCount; ++i) {
            const worker = new DSBINLoaderWorker();
            workers.push(worker);
            promises.push(new Promise(r => {
                worker.onmessage = () => {
                    worker.onmessage = null;
                    r();
                };
            }));
            worker.postMessage({
                type: 'loadBlobs',
                uncompressed,
                indices,
                chunks,
            });
        }
        await Promise.all(promises).then(() => {
            for (let i = 0; i < workers.length; ++i) {
                workers[i].postMessage({ type: 'close' });
            }
        });
    }
}
