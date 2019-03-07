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
import {Pointer} from '../../core/Pointer';
import * as Types from '../../core/Types';
import FilterWorker from 'worker-loader!./Filter.worker';

/**
 * Default, immutable object, representing a result index with the row index in it.
 * @type {Object}
 * @private
 */
const kRowIndexResult = {
    type: Types.Uint32.name,
    size: Types.Uint32.byteSize,
    column: null,
};
Object.freeze(kRowIndexResult);

/**
 * Class to create and run filters on tables.
 */
export class Filter {
    /**
     * Returns an object that can be added to the `resultDescription` array to include the index of the resulting rows
     * @return {Object}
     */
    static get rowIndexResult() {
        return kRowIndexResult;
    }

    /**
     * Creates a Filter instance bound to the specified table.
     * @param {Table} table - The table this filter will be bound to.
     * @param {number=} workerCount - The number of workers to spawn, should be the same as physical cores in the system, defaults to 4.
     * @param {Heap=} heap - The heap to use to allocate the filter results memory, defaults to using the same heap where the table is allocated.
     */
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

    /**
     * The size, in bytes, of a results row.
     * @return {number}
     */
    get resultRowSize() {
        return this.mResultRowSize;
    }

    /**
     * An array of objects describing the desired fields in the filter's result.
     * WARNING: Do not modify this array, assign a brand new array instead.
     * @return {Object[]}
     */
    get resultDescription() {
        return this.mResultDescription;
    }

    /**
     * Sets an array ob objects describing the desired fields in the filter's result.
     * @param {Object[]} value - The new object array.
     */
    set resultDescription(value) {
        this.mResultDescription = value;
        this.mResultRowSize = 0;
        for (let i = 0; i < this.mResultDescription.length; ++i) {
            this.mResultRowSize += this.mResultDescription[i].size;
        }
    }

    /**
     * Utility function to create an object describing a result field for the column with the specified name.
     * If the `columnName` parameter is omitted or is set to `null`, an object that adds the index of the resulting row
     * will be returned.
     * @param {string|null=} columnName - The name of the column for which to create a result field object. Defaults to `null`.
     * @return {Object}
     */
    resultFieldForColumn(columnName = null) {
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

    /**
     * Runs this filter with the specified set of rules.
     * Rules are an array of arrays containing objects describing the rules for this filter. Each object has the following structure:
     * {
     *     name: string - The name of the column this rule applies to
     *     value: * - The value to compare the column's values with
     *     operation: string - Which operation to perform, must be one of the following: "equal", "notEqual", "lessThan", "moreThan" or "contains"
     * }
     *
     * Rule objects within the same array are treated as `AND`ed and separate rule arrays are `OR`ed.
     * Here's an example of a valid `rules` array:
     *
     ```
     [
         [
                {
                    name: 'Origin_airport',
                    value: 'SEA',
                    operation: 'equal',
                },
                {
                    name: 'Destination_airport',
                    value: 'LAX',
                    operation: 'notEqual',
                },
         ],
         [
                {
                    name: 'Origin_airport',
                    value: 'MCO',
                    operation: 'equal',
                },
                {
                    name: 'Passengers',
                    value: 180,
                    operation: 'moreThan',
                },
         ],
     ]
     ```
     *
     * In the example above, the filter requires that in the results:
     * {
     *     The value of column `Origin_airport` is equal to `SEA`
     *     AND
     *     The value of column `Destination_airport` is not equal to `LAX`
     * }
     * OR
     * {
     *     The value of column `Origin_airport` is equal to `MCO`
     *     AND
     *     The value of column `Passengers` is more than 180
     * }
     *
     * @param {Array<Object[]>} rules - The rules to run this filter with.
     * @return {Promise<{memory: MemoryBlock, count: number}>}
     */
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

    /**
     * Utility function to allocate the memory needed to store the maximum number of results.
     * @return {MemoryBlock}
     * @private
     */
    _allocateResultMemory() {
        return this.mHeap.malloc(this.mResultRowSize * this.mTable.rowCount);
    }
}
