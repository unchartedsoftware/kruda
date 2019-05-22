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

import {Header} from './Header';
import {Row} from './Row';

/**
 * Class that represents a table in binary memory.
 */
export class Table {
    /**
     * Table constructor.
     * @param {MemoryBlock} memory - The MemoryBlock containing the table's data
     */
    constructor(memory) {
        this.mMemory = memory;
        this.mHeader = new Header(this.mMemory);
    }

    /**
     * The header of this table. Contains column names, order in memory, original order and type information.
     * @return {Header}
     */
    get header() {
        return this.mHeader;
    }

    /**
     * The total number of rows in this table.
     * @return {number}
     */
    get rowCount() {
        return this.mHeader.rowCount;
    }

    /**
     * The memory block that contains this table's layout and data.
     * @return {MemoryBlock}
     */
    get memory() {
        return this.mMemory;
    }

    /**
     * The offset, in bytes, from the beginning of this table to the row data.
     * @return {number}
     */
    get dataOffset() {
        return this.mHeader.length;
    }

    /**
     * Gets a new Row instance pointing at the row at the specified index.
     * NOTE: The returned row can be moved to point to a different row by changing its `index` property.
     * @param {number} index - The index of the row to get the data from.
     * @return {Row}
     */
    getRow(index) {
        return new Row(this, index);
    }
}
