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
 */
export class ProxyTable {
    /**
     * ProxyTable constructor.
     * @param {Table} sourceTable - The table from which the values will be read.
     * @param {Table} indexTable - The table containing the indices to fetch.
     */
    constructor(sourceTable, indexTable) {
        this.mSourceTable = sourceTable;
        this.mIndexTable = indexTable;
    }

    /**
     * The table containing the indices to access the data from the source table.
     * @return {Table}
     */
    get indexTable() {
        return this.mIndexTable;
    }

    /**
     * The table which will be proxied using the indices in the index table.
     * @return {Table}
     */
    get sourceTable() {
        return this.mSourceTable;
    }

    /**
     * The header of the source data table. Contains column names, order in memory, original order and type information.
     * @return {Header}
     */
    get header() {
        return this.mSourceTable.header;
    }

    /**
     * The header of the index data table. Contains column names, order in memory, original order and type information.
     * @return {Header}
     */
    get indexTableHeader() {
        return this.mSourceTable.header;
    }

    /**
     * The total number of rows in this table.
     * @return {number}
     */
    get rowCount() {
        return this.mIndexTable.rowCount;
    }

    /**
     * The memory block that contains the index table's layout and data.
     * @return {MemoryBlock}
     */
    get memory() {
        return this.mIndexTable.memory;
    }

    /**
     * The memory block that contains the source data table's layout and data.
     * @return {MemoryBlock}
     */
    get sourceTableMemory() {
        return this.mSourceTable.memory;
    }

    /**
     * The offset, in bytes, from the beginning of the index table to the row data.
     * @return {number}
     */
    get dataOffset() {
        return this.mIndexTable.length;
    }

    /**
     * The offset, in bytes, from the beginning of the source data table to the row data.
     * @return {number}
     */
    get sourceTableDataOffset() {
        return this.mIndexTable.length;
    }

    /**
     * Gets a new Row instance pointing at the row at the specified index.
     * NOTE: The returned row can be moved to point to a different row by changing its `index` property.
     * @param {number} index - The index of the row to get the data from.
     * @return {ProxyRow}
     */
    getRow(index) {
        return new ProxyRow(this, index);
    }
}
