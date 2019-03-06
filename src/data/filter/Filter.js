/**
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
import {Pointer} from '../../core/Pointer';
import * as Types from '../../core/Types';
import FilterWorker from 'worker-loader!./Filter.worker';

const kRowIndexResult = {
    type: Types.Uint32.name,
    size: Types.Uint32.byteSize,
    column: null,
};
Object.freeze(kRowIndexResult);

export class Filter {
    static get rowIndexResult() {
        return kRowIndexResult;
    }

    constructor(table, workerCount = 4, heap = table.memory.heap) {
        this.mTable = table;
        this.mHeap = heap;
        this.mResultDescription = [ kRowIndexResult ];
        this.mResultRowSize = kRowIndexResult.size;
        this.mMemory = null;
        this.mWorkers = [];

        for (let i = 0; i < workerCount; ++i) {
            const worker = new FilterWorker();
            this.mWorkers.push(worker);
            worker.postMessage({
                type: 'initialize',
                heapBuffer: this.mTable.memory.heap.buffer,
                tableAddress: this.mTable.memory.address,
                tableSize: this.mTable.memory.size,
            });
        }
    }

    get resultRowSize() {
        return this.mResultRowSize;
    }

    get resultDescription() {
        return this.mResultDescription;
    }

    set resultDescription(value) {
        this.mResultDescription = value;
        this.mResultRowSize = 0;
        for (let i = 0; i < this.mResultDescription.length; ++i) {
            this.mResultRowSize += this.mResultDescription[i].size;
        }
    }

    resultForColumn(columnName = null) {
        if (columnName === null) {
            return kRowIndexResult;
        }

        const columns = this.mTable.header.columns;
        return {
            type: columns[columnName].type === 'string' ? 'ByteString' : columns[columnName].type,
            size: columns[columnName].size,
            column: columnName,
        };
    }

    run(rules) {
        const promises = [];
        const resultMemory = this._allocateResultMemory();
        const indices = this.mHeap.malloc(8);
        for (let i = 0; i < this.mWorkers.length; ++i) {
            const worker = this.mWorkers[i];
            const promise = new Promise((resolve, reject) => {
                worker.onmessage = e => {
                    const message = e.data;
                    worker.onmessage = null;
                    if (message.type === 'success') {
                        resolve();
                    } else if (message.type === 'error') {
                        reject(message.reason);
                    } else {
                        reject(`ERROR: Unrecognized worker message [${message.type}]`);
                    }
                };
                worker.postMessage({
                    type: 'processFilters',
                    rules: rules,
                    resultDescription: this.mResultDescription,
                    resultAddress: resultMemory.address,
                    resultSize: resultMemory.size,
                    indicesAddress: indices.address,
                    rowBatchSize: 1024,
                });
            });
            promises.push(promise);
        }
        return Promise.all(promises).then(() => {
            const indicesPtr = new Pointer(indices, 0, Types.Uint32);
            const resultCount = indicesPtr.getValueAt(1);
            indices.free();
            return {
                memory: resultMemory,
                count: resultCount,
            };
        });
    }

    _allocateResultMemory() {
        return this.mHeap.malloc(this.mResultRowSize * this.mTable.rowCount);
    }
}
