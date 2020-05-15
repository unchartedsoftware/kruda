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

import {ByteString} from '../types/ByteString';
import {kBinaryTypes} from '../types/TypeEnums';

/**
 * Class that represents a column in a {@link Header}
 * Constructs a Column by reading its properties from the offsets in the specified memory block.
 * @class Column
 * @param {MemoryBlock} memory - The memory to initialize this instance with
 * @param {number} offset - The byte offset for the size, offset and type fields.
 * @param {number} nameOffset - The byte offset for this column's name string.
 */
export class Column {
    constructor(memory, offset, nameOffset) {
        this.mMemory = memory;
        this.mView = new DataView(this.mMemory.heap.buffer, this.mMemory.address, this.mMemory.size);

        this.mByteLength = 0;

        const nameLength = this.mView.getUint8(nameOffset);
        this.mName = ByteString.fromBuffer(this.mMemory.buffer, this.mMemory.address + nameOffset, nameLength);

        this.mSizeOffset = this.mByteLength + offset;
        this.mByteLength += 4;

        this.mOffsetOffset = this.mByteLength + offset;
        this.mByteLength += 4;

        this.mTypeOffset = this.mByteLength + offset;
        this.mByteLength += 4;
        this.mByteLength += nameLength + 1;
    }

    /**
     * The name of this column.
     * @type {ByteStringBase}
     */
    get name() {
        return this.mName;
    }

    /**
     * The size in bytes of data entries in this column.
     * @type {number}
     */
    get size() {
        return this.mView.getUint32(this.mSizeOffset, true);
    }

    /**
     * The offset with respect to the beginning of each row for data entries in this column.
     * @type {number}
     */
    get offset() {
        return this.mView.getUint32(this.mOffsetOffset, true);
    }

    /**
     * The type for data entries in this column.
     * @type {Type}
     */
    get type() {
        return kBinaryTypes[this.mView.getUint32(this.mTypeOffset, true)];
    }

    /**
     * The total byteLength of this column's description.
     * @type {number}
     */
    get byteLength() {
        return this.mByteLength;
    }
}
