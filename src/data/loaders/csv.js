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

import {coreCount} from '../../core/CoreCount';
import {Header} from '../table/Header';
import {Table} from '../table/Table';
import dekkai from 'dekkai';
/**
 * Creates a {@link Table} instance and fills its contents from the specified local CSV file.
 * @param {File} file - A file instance, representing the file to load.
 * @param {Heap} heap - The heap where the loaded table will be stored.
 * @return {Table}
 */
export async function tableFromLocalCSV(file, heap) {
    const workerCount = await coreCount();
    const DataTools = dekkai.DataTools;
    await dekkai.init(workerCount);
    const dataFile = new dekkai.DataFile(file);
    const config = Object.assign({}, DataTools.defaultConfig);
    const {header, offset} = await DataTools.readHeader(dataFile, config);
    const blobs = await DataTools.sliceFile(dataFile, offset, config);
    const result = await DataTools.binaryChunksFromBlobs(blobs, header, config);

    const tableHeader = Header.buildBinaryHeader(result.header);
    const memory = heap.malloc(result.header.dataLength + tableHeader.byteLength);

    const headerView = new Uint8Array(tableHeader);
    const memoryView = new Uint8Array(memory.buffer);
    memoryView.set(headerView, memory.address);

    config.output = {
        buffer: memory.buffer,
        offset: memory.address + tableHeader.byteLength,
    };

    const merged = await DataTools.mergeChunksIntoBuffer(result.chunks, result.header, config);
    if (!heap.shared) {
        heap._restoreBuffer(merged.data.buffer);
    }

    dekkai.terminate();
    return new Table(memory);
}

/**
 * Creates a {@link Table} instance and fills its contents from the specified remote CSV file.
 * @param {string} url - The URL from which the CSV file will be loaded.
 * @return {Promise<Table>}
 */
export async function tableFromRemoteCSV(url) {

}
