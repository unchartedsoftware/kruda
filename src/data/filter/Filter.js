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
import FilterWorker from 'web-worker:./Filter.worker';
import {FilterWorkerDummy} from './Filter.worker.dummy';
import {FilterExpressionMode} from './FilterExpressionMode';
import {coreCount} from '../../core/CoreCount';
import {WorkerPool} from 'dekkai/src/workers/WorkerPool';
import {Header} from '../table/Header';
import {kBinaryTypeMap} from '../table/Column';
import {Table} from '../table/Table';
import {ProxyTable} from '../proxy/ProxyTable';

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
 * Creates a Filter instance bound to the specified table.
 * @class Filter
 * @param {Table} table - The table this filter will be bound to.
 * @param {number=} workerCount - The number of workers to spawn, should be the same as physical cores in the system, defaults to automatically detected.
 * @param {Heap=} heap - The heap to use to allocate the filter results memory, defaults to using the same heap where the table is allocated.
 */
export class Filter {
    constructor(table, workerCount = -1, heap = table.memory.heap) {
        this.mTable = table;
        this.mHeap = heap;
        this.mResultDescription = [kRowIndexResult];
        this.mResultRowSize = kRowIndexResult.size;
        this.mMemory = null;
        this.mWorkerPool = null;

        this.mResultHeader = this._buildResultHeader(this.mResultDescription);

        this.mInitialized = new Promise(resolve => {
            if (workerCount < 1 || isNaN(workerCount)) {
                coreCount().then(count => {
                    this._initializeThreads(count).then(resolve);
                });
            } else {
                this._initializeThreads(Math.max(1, workerCount)).then(resolve);
            }
        });
    }

    /**
     * Returns an object that can be added to the `resultDescription` array to include the index of the resulting rows
     * @type {Object}
     */
    static get rowIndexResult() {
        return kRowIndexResult;
    }

    /**
     * The size, in bytes, of a results row.
     * @type {number}
     */
    get resultRowSize() {
        return this.mResultRowSize;
    }

    /**
     * An array of objects describing the desired fields in the filter's result.
     * WARNING: Do not modify this array, assign a brand new array instead.
     * @type {Object[]}
     */
    get resultDescription() {
        return this.mResultDescription;
    }
    set resultDescription(value) {
        this.mResultDescription = [...value];

        this.mResultRowSize = 0;
        for (let i = 0; i < this.mResultDescription.length; ++i) {
            this.mResultRowSize += this.mResultDescription[i].size;
        }

        this.mResultHeader = this._buildResultHeader(this.mResultDescription);
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
        const names = this.mTable.header.names;
        return {
            type: columns[names[columnName]].type.name,
            size: columns[names[columnName]].size,
            column: columnName,
        };
    }

    /**
     * Utility function to create an object describing a result field for the column with the specified index.
     * If the `columnIndex` parameter is omitted or is set to `null`, an object that adds the index of the resulting row
     * will be returned.
     * @param {number|null=} columnIndex - The index of the column for which to create a result field object. Defaults to `null`.
     * @return {Object}
     */
    resultFieldForColumnIndex(columnIndex = null) {
        if (columnIndex === null) {
            return kRowIndexResult;
        }

        const columns = this.mTable.header.columns;
        return {
            type: columns[columnIndex].type.name,
            size: columns[columnIndex].size,
            column: columns[columnIndex].name,
        };
    }

    /**
     * Runs this filter with the specified set of rules.
     *
     * @param {FilterExpression} rules - The rules to run this filter with.
     * @param {FilterExpressionMode=} mode - The mode in which the specified rules should be interpreted.
     * @return {Promise<Table|ProxyTable>}
     */
    async run(rules, mode = FilterExpressionMode.DNF) {
        await this.mInitialized;
        const promises = [];
        const resultMemory = this._allocateResultMemory();
        const indices = this.mHeap.calloc(8);

        for (let i = 0; i < this.mWorkerPool.workerCount; ++i) {
            const promise = this.mWorkerPool.scheduleTask('processFilters', {
                rules,
                mode,
                resultDescription: this.mResultDescription,
                resultAddress: resultMemory.address + this.mResultHeader.length,
                resultSize: resultMemory.size,
                indicesAddress: indices.address,
                rowBatchSize: 1024,
            }, []);
            promises.push(promise);
        }

        await Promise.all(promises);

        const indicesPtr = new Pointer(indices, 0, Types.Uint32);
        const resultCount = indicesPtr.getValueAt(1);
        indices.free();

        this.mResultHeader.rowCount = resultCount;
        this.mResultHeader.dataLength = this.mResultRowSize * resultCount;

        const binaryHeader = Header.buildBinaryHeader(this.mResultHeader);
        const resultView = new Uint8Array(resultMemory.buffer);
        const headerView = new Uint8Array(binaryHeader);
        resultView.set(headerView, resultMemory.address);

        const finalMemorySize = this.mResultHeader.length + this.mResultHeader.dataLength;
        if (finalMemorySize < resultMemory.size) {
            resultMemory.heap.shrink(resultMemory, finalMemorySize);
        }

        const resultTable = new Table(resultMemory);

        if (this.mResultDescription.length === 1 && this.mResultDescription[0] === kRowIndexResult) {
            return new ProxyTable(this.mTable, resultTable);
        }

        return resultTable;
    }

    /**
     * Utility function to allocate the memory needed to store the maximum number of results.
     * @return {MemoryBlock}
     * @private
     */
    _allocateResultMemory() {
        const maxDataLength = this.mResultRowSize * this.mTable.rowCount;
        const headerLength = this.mResultHeader.length;
        return this.mHeap.malloc(maxDataLength + headerLength);
    }

    /**
     * Utility function to initialize the threads used for processing the filter.
     * @param {number} count - The number of threads to initialize.
     * @private
     */
    async _initializeThreads(count) {
        if (this.mWorkerPool) {
            this.mWorkerPool.killWorkers();
        } else {
            this.mWorkerPool = new WorkerPool();
        }

        const options = {};

        options.heapBuffer = this.mTable.memory.heap.buffer;
        options.tableAddress = this.mTable.memory.address;
        options.tableSize = this.mTable.memory.size;

        const WorkerClass = this.mHeap.shared ? FilterWorker : FilterWorkerDummy;

        for (let i = 0; i < count; ++i) {
            this.mWorkerPool.addWorker(new WorkerClass(), {
                type: 'initialize',
                options,
            });
        }
    }

    /**
     * Utility function to build a preliminary version of the result table's header.
     * @param {Object[]} resultDescription - The result description used to generate the filter result.
     * @return {{rowLength: number, columns: Array, dataLength: number, length: number, rowCount: number}}
     * @private
     */
    _buildResultHeader(resultDescription) {
        const header = {
            length: 0,
            columns: [],
            dataLength: 0,
            rowCount: 0,
            rowLength: this.mResultRowSize,
        };

        let offset = 0;
        let columnNameLength = 0;
        for (let i = 0; i < resultDescription.length; ++i) {
            const column = {
                length: resultDescription[i].size,
                offset: offset,
                name: resultDescription[i].column || '',
            };

            const type = kBinaryTypeMap.get(Types.typeByName(resultDescription[i].type));
            /// #if !_DEBUG
            /*
            /// #endif
            if (type === undefined) {
                throw `ERROR: Unsupported type (${resultDescription[i].type})`;
            }
            /// #if !_DEBUG
             */
            /// #endif

            column.type = type;

            header.columns.push(column);
            offset += resultDescription[i].size;
            columnNameLength += Math.min(255, column.name.length) + 1;
        }

        header.length = (12 * header.columns.length + columnNameLength + 20 + 3) & ~0x03;

        return header;
    }
}
