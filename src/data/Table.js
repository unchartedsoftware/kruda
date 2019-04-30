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

import * as Types from '../core/Types';
import {Pointer} from '../core/Pointer';
import {Row} from './Row';

/**
 * Class that represents a table in binary memory.
 */
export class Table {
    /**
     * Creates an instance that reads its contents from the specified memory block.
     * @param {MemoryBlock} layout - A MemoryBlock containing a binary representation of the layout and data of this table.
     * @return {Table}
     */
    static fromMemoryLayout(layout) {
        const pointer = new Pointer(layout, 0, Types.Void);
        const headerSize = pointer.castValue(Types.Uint32);

        let nb;
        for (nb = 0; nb < headerSize; ++nb) {
            if (pointer.castValueAt(3 + headerSize - nb, Types.Uint8) !== 0) {
                break;
            }
        }

        const headerBytes = new Uint8Array(layout.buffer, layout.address + 4, headerSize - nb);
        const headerString = String.fromCharCode.apply(null, headerBytes);

        return new Table(layout, JSON.parse(headerString), headerSize + 4);
    }

    /**
     * Table constructor.
     * @param {MemoryBlock} memory - The MemoryBlock containing the table's data
     * @param {Object} header - A table header descriptor
     * @param {number=} offset - The offset at which the data is within the MemoryBlock
     */
    constructor(memory, header, offset = 0) {
        this.mMemory = memory;
        this.mHeader = header;
        this.mDataOffset = offset;
    }

    /**
     * The header of this table. Contains column names, order in memory, original order and type information.
     * @return {object}
     */
    get header() {
        return this.mHeader;
    }

    /**
     * The total number of rows in this table.
     * @return {number}
     */
    get rowCount() {
        return this.mHeader.count;
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
        return this.mDataOffset;
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
