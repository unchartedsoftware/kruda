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

import {ProxyRow} from './ProxyRow';

/**
 * Class that fetches the data from a source table based on the index numbers of another table, usually resulting from
 * a filter operation.
 * @class ProxyTable
 * @param {Table} sourceTable - The table from which the values will be read.
 * @param {Table} indexTable - The table containing the indices to fetch.
 */
export class ProxyTable {
    constructor(sourceTable, indexTable) {
        this.mSourceTable = sourceTable;
        this.mIndexTable = indexTable;
    }

    /**
     * Destroys this table instance and frees the memory associated with it. This method must be called when the memory
     * associated to this table is no longer needed to avoid memory leaks in kruda's internal memory management system.
     * WARNING: While this method destroys its index table, it does not destroy its source table.
     * DEV NOTE: Implementing a reference counting system could make it more intuitive and allow users to leave memory
     * management to kruda (although retaining and releasing instances would still be the user's responsibility).
     */
    destroy() {
        this.mIndexTable.destroy();
        delete this.mSourceTable;
        delete this.mIndexTable;
    }

    /**
     * The table containing the indices to access the data from the source table.
     * @type {Table}
     */
    get indexTable() {
        return this.mIndexTable;
    }

    /**
     * The table which will be proxied using the indices in the index table.
     * @type {Table}
     */
    get sourceTable() {
        return this.mSourceTable;
    }

    /**
     * The header of the source data table. Contains column names, order in memory, original order and type information.
     * @type {Header}
     */
    get header() {
        return this.mSourceTable.header;
    }

    /**
     * The header of the index data table. Contains column names, order in memory, original order and type information.
     * @type {Header}
     */
    get indexTableHeader() {
        return this.mSourceTable.header;
    }

    /**
     * The total number of rows in this table.
     * @type {number}
     */
    get rowCount() {
        return this.mIndexTable.rowCount;
    }

    /**
     * The memory block that contains the index table's layout and data.
     * @type {MemoryBlock}
     */
    get memory() {
        return this.mIndexTable.memory;
    }

    /**
     * The memory block that contains the source data table's layout and data.
     * @type {MemoryBlock}
     */
    get sourceTableMemory() {
        return this.mSourceTable.memory;
    }

    /**
     * The offset, in bytes, from the beginning of the index table to the row data.
     * @type {number}
     */
    get dataOffset() {
        return this.mIndexTable.dataOffset;
    }

    /**
     * The offset, in bytes, from the beginning of the source data table to the row data.
     * @type {number}
     */
    get sourceTableDataOffset() {
        return this.mIndexTable.dataOffset;
    }

    /**
     * Gets a new Row instance pointing at the row at the specified index.
     * NOTE: The returned row can be moved to point to a different row by changing its `index` property.
     * @param {number} index - The index of the row to get the data from.
     * @param {ProxyRow=} row - An optional row, belonging to this table, to reuse. Useful to reduce garbage collection.
     * @return {ProxyRow}
     */
    getRow(index, row = new ProxyRow(this, index)) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!index >= this.rowCount) {
            throw 'ERROR: Index out of bounds!';
        }
        /// #if !_DEBUG
         */
        /// #endif
        row.index = index;
        return row;
    }

    /**
     * Gets a new Row instance pointing at the row at the specified index. The resulting row will return
     * {@link ByteString} instances for the column fields which are strings. ByteStrings are faster to work with but are
     * not replacements for JavaScript strings.
     * NOTE: The returned row can be moved to point to a different row by changing its `index` property.
     * @param {number} index - The index of the row to get the data from.
     * @param {ProxyRow=} row - An optional row, belonging to this table, to reuse. Useful to reduce garbage collection.
     * @return {ProxyRow}
     */
    getBinaryRow(index, row = new ProxyRow(this, index, true)) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!index >= this.rowCount) {
            throw 'ERROR: Index out of bounds!';
        }
        /// #if !_DEBUG
         */
        /// #endif
        row.index = index;
        return row;
    }

    /**
     * Iterates through all the rows in this table and invokes the provided callback `itr` on each iteration.
     * WARNING: This function is designed to avoid garbage collection and improve performance so the row passed to the
     * `itr` callback is reused, the row cannot be stored as its contents will change. If you need to store unique rows
     * consider using the `getRow` method.
     * @param {function(row:ProxyRow, i:number):void} itr - Callback function to invoke for each row in this table.
     */
    forEach(itr) {
        const row = new ProxyRow(this, 0);
        itr(row, 0);
        for (let i = 1, n = this.rowCount; i < n; ++i) {
            row.index = i;
            itr(row, i);
        }
    }

    /*
     * Iterable protocol implementation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable
     * WARNING: This function is designed to avoid garbage collection and improve performance so the row passed to the
     * `itr` callback is reused, the row cannot be stored as its contents will change. If you need to store unique rows
     * consider using the `getRow` method.
     * @return {Iterator}
     */
    [Symbol.iterator]() {
        return {
            i: 0,
            n: this.rowCount,
            row: new ProxyRow(this, 0),
            next() {
                if (this.i < this.n) {
                    this.row.index = this.i++;
                    return { value: this.row, done: false };
                }
                return { value: undefined, done: true };
            },
        };
    }
}
