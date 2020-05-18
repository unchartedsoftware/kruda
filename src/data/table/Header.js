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
import {Type} from '../../core/Types';
import {ByteString} from '../types/ByteString';
import {Atomize} from '../../core/Atomize';
import {Column} from './Column';
import {kBinaryTypes, kBinaryTypeMap} from '../types/TypeEnums';

/**
 * Different memory layouts for a table
 * @readonly
 * @enum {number}
 */
const MemoryLayout = {
    RELATIONAL: 0,
    COLUMNAR: 1,
};
Object.freeze(MemoryLayout);

/**
 * @typedef ColumnDescriptor
 * @type {Object}
 * @property {string} name - This column's name
 * @property {Type|string|number} type - The type of this column by name, index or Type instance.
 * @property {number} [dataOffset] - The offset in bytes for the start of the data this column represents.
 * @property {number} [offset] - The offset in bytes where the data in this column is in each row.
 * @property {number} [length] - The maximum length of the column, if the type is `ByteString`
 */

/**
 * The length in bytes of a column's meta (without counting its name)
 * @type {number}
 */
const kColumnMetaLength = 16;

/**
 * @typedef HeaderDescriptor
 * @type {Object}
 * @property {ColumnDescriptor[]} columns - The columns in the table
 * @property {number} rowCount - Current number of rows in the table.
 * @property {number} rowLength - The length, in bytes, of a row in the table.
 * @property {number} rowStep - The number of bytes a pointer needs to shift to point at the next/prev row.
 * @property {number} dataLength - The total length, in bytes, of the data contained in the table.
 * @property {MemoryLayout} layout - The layout for the data in this table
 */

/**
 * The length in bytes of a header's meta (without the columns)
 * @type {number}
 */
const kHeaderMetaLength = 28;

/**
 * Class that represents the header of a {@link Table}.
 * Constructs an instance of a Header by reading its properties from the beginning of the specified memory block.
 * @class Header
 * @param {MemoryBlock} memory - The memory containing the table header. The table header must be at the beginning.
 */
export class Header {
    constructor(memory) {
        this.mMemory = memory;
        this.mView = new DataView(memory.heap.buffer, memory.address, memory.size);
        let offset = 0;

        this.mLengthOffset = offset;
        offset += 4;

        this.mColumnCountOffset = offset;
        offset += 4;

        this.mRowCountOffset = offset;
        offset += 4;

        this.mRowLengthOffset = offset;
        offset += 4;

        this.mRowStepOffset = offset;
        offset += 4;

        this.mDataLengthOffset = offset;
        offset += 4;

        this.mLayoutOffset = offset;
        offset += 4;

        this.mColumns = [];
        this.mNames = {};

        let nameOffset = kColumnMetaLength * this.columnCount + offset;
        for (let i = 0; i < this.columnCount; ++i) {
            const column = new Column(this.mMemory, offset, nameOffset);
            this.mNames[column.name.toString()] = this.mColumns.length;
            this.mColumns.push(column);

            nameOffset += column.name.length + 1;
            offset += kColumnMetaLength;
        }
    }

    /**
     * Different memory layouts for a table
     * @type {Object<string, MemoryLayout>}
     */
    static get memoryLayout() {
        return MemoryLayout;
    }

    /**
     * The length in bytes of a header's meta (without the columns)
     * @type {number}
     */
    static get headerMetaLength() {
        return kHeaderMetaLength;
    }

    /**
     * The length in bytes of a column's meta (without counting its name)
     * @type {number}
     */
    static get columnMetaLength() {
        return kColumnMetaLength;
    }

    /**
     * Convenience function to build a header descriptor from an array of column descriptors.
     * @param {ColumnDescriptor[]} columns - The columns to initialize the header with
     * @param {number=} memoryLength - The length of the memory where the table will reside. Defaults to 0
     * @param {MemoryLayout=} layout - The layout of the table. Defaults to RELATIONAL
     * @return {HeaderDescriptor}
     */
    static descriptorFromColumns(columns, memoryLength = 0, layout = Header.memoryLayout.RELATIONAL) {
        const resultColumns = [];
        let rowLength = 0;
        for (let i = 0, n = columns.length; i < n; ++i) {
            const column = columns[i];

            let typeIndex;
            if (column.type instanceof Type) {
                typeIndex = kBinaryTypeMap.get(column.type);
            } else if (isNaN(parseInt(column.type, 10))) {
                typeIndex = kBinaryTypeMap.get(Type.getTypeByName(column.type));
            } else {
                typeIndex = column.type;
            }

            const type = kBinaryTypes[typeIndex];
            const columnLength = type === ByteString ? column.length : type.byteSize;
            rowLength += columnLength;

            const computedColumn = {
                name: column.name,
                type: typeIndex,
                length: columnLength,
                dataOffset: 0,
            };

            if (column.hasOwnProperty('offset')) {
                computedColumn.offset = column.offset;
            }

            resultColumns.push(computedColumn);
        }

        const sortedColumns = resultColumns.slice().sort((c1, c2) => c1.type - c2.type);
        let rowStep;
        if (layout === Header.memoryLayout.COLUMNAR) {
            const rowCount = Math.floor(memoryLength / rowLength);
            /// #if !_DEBUG
            /*
            /// #endif
            if (!rowCount) {
                throw 'ERROR: Not a single row of the specified data fits in the provided memory length';
            }
            /// #if !_DEBUG
             */
            /// #endif
            let offset = 0;
            for (let i = 0, n = sortedColumns.length; i < n; ++i) {
                const column = sortedColumns[i];
                if (!column.hasOwnProperty('offset')) {
                    column.dataOffset = offset;
                    offset += column.length * rowCount;
                }
            }
            rowStep = sortedColumns[0].length;
        } else {
            let offset = 0;
            for (let i = 0, n = sortedColumns.length; i < n; ++i) {
                const column = sortedColumns[i];
                if (!column.hasOwnProperty('offset')) {
                    column.offset = offset;
                    offset += column.length;
                }
            }
            // make sure the row step is a multiple of four
            rowStep = ((rowLength - 1) | 3) + 1;
        }

        return {
            columns: resultColumns,
            rowLength: rowLength,
            rowStep: rowStep,
            rowCount: 0,
            dataLength: 0,
            layout: layout,
        };
    }

    /**
     * Convenience function to build a binary header from an array of column descriptors.
     * @param {ColumnDescriptor[]} columns - The columns to initialize the header with
     * @param {number=} memoryLength - The length of the memory where the table will reside. Defaults to 0
     * @param {MemoryLayout=} layout - The layout of the table. Defaults to RELATIONAL
     * @return {ArrayBuffer}
     */
    static binaryFromColumns(columns, memoryLength = 0, layout = Header.memoryLayout.RELATIONAL) {
        return this.buildBinaryHeader(this.descriptorFromColumns(columns, memoryLength, layout));
    }

    /**
     * Convenience function to build a binary buffer containing the header info from an object descriptor.
     * @param {HeaderDescriptor} header - Object describing the properties of the header
     * @return {ArrayBuffer}
     */
    static buildBinaryHeader(header) {
        const columnCount = header.columns.length;
        let columnNameLength = 0;

        for (let i = 0; i < columnCount; ++i) {
            columnNameLength += Math.min(255, header.columns[i].name.length) + 1;
        }

        const headerLength = (kColumnMetaLength * columnCount + columnNameLength + kHeaderMetaLength + 3) & ~0x03; // round to nearest 4
        const buffer = new ArrayBuffer(headerLength);
        const view = new DataView(buffer);
        let nameOffset = kColumnMetaLength * columnCount + kHeaderMetaLength;
        let offset = 0;
        let name;
        let ii;
        let nn;

        view.setUint32(offset, headerLength, true); // header length
        offset += 4;

        view.setUint32(offset, columnCount, true);
        offset += 4;

        view.setUint32(offset, header.rowCount, true);
        offset += 4;

        view.setUint32(offset, header.rowLength, true);
        offset += 4;

        view.setUint32(offset, header.rowStep, true);
        offset += 4;

        view.setUint32(offset, header.dataLength, true);
        offset += 4;

        view.setUint32(offset, header.layout, true);
        offset += 4;

        for (let i = 0; i < columnCount; ++i) {
            view.setUint32(offset, header.columns[i].length, true);
            offset += 4;

            view.setUint32(offset, header.columns[i].dataOffset, true);
            offset += 4;

            view.setUint32(offset, header.columns[i].offset, true);
            offset += 4;

            view.setUint32(offset, header.columns[i].type, true);
            offset += 4;

            name = header.columns[i].name;
            nn = Math.min(255, name.length);
            view.setUint8(nameOffset++, nn);

            for (ii = 0; ii < nn; ++ii) {
                view.setUint8(nameOffset++, name.charCodeAt(ii));
            }
        }

        return buffer;
    }

    /**
     * The length, in bytes, of this header in memory.
     * @type {number}
     */
    get length() {
        return this.mView.getUint32(this.mLengthOffset, true);
    }

    /**
     * The number of columns described in the header.
     * @type {number}
     */
    get columnCount() {
        return this.mView.getUint32(this.mColumnCountOffset, true);
    }

    /**
     * The number of rows that the table linked to this header should contain.
     * @type {number}
     */
    get rowCount() {
        return this.mView.getUint32(this.mRowCountOffset, true);
    }

    /**
     * The normalized length, in bytes, of a single row in the table.
     * @type {number}
     */
    get rowLength() {
        return this.mView.getUint32(this.mRowLengthOffset, true);
    }

    /**
     * The number of bytes a pointer needs to shift to move from one row to the next.
     * @type {number}
     */
    get rowStep() {
        return this.mView.getUint32(this.mRowStepOffset, true);
    }

    /**
     * The length, in bytes, of the data contained in the table this header is describing.
     * @type {number}
     */
    get dataLength() {
        return this.mView.getUint32(this.mDataLengthOffset, true);
    }

    /**
     * The memory layout of the table.
     * @type {MemoryLayout}
     */
    get layout() {
        return this.mView.getUint32(this.mLayoutOffset, true);
    }

    /**
     * An array containing objects describing each of the columns described in this header.
     * @type {Column[]}
     */
    get columns() {
        return this.mColumns;
    }

    /**
     * Returns an object which contains the names of the columns described in this header as keys and the index of the
     * column within the `columns` array as their value.
     * @type {Object<string, number>}
     */
    get names() {
        return this.mNames;
    }


    /**
     * Modifies this header atomically to add the number of rows specified.
     * @param {number} count - The number of rows to add
     * @returns {number}
     */
    addRows(count) {
        /// #if !_DEBUG
        /*
        /// #endif
        if ((this.rowCount + count) * this.rowLength > this.mMemory.byteSize) {
            throw `ERROR: Adding ${count} rows to the table would exceed the bounds of its containing memory block`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        const memoryView = new Uint32Array(this.mMemory.buffer, this.mMemory.address);
        // increase the data length
        Atomize.add(memoryView, this.mDataLengthOffset / 4, count * this.rowLength);
        // increase the row count and return the old value
        return Atomize.add(memoryView, this.mRowCountOffset / 4, count);
    }
}
