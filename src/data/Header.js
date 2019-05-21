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
import {Int32, Float32} from '../core/Types';
import {ByteString} from './ByteString';

/**
 * Binary type map.
 * @type {*[]}
 */
const kBinaryTypeMap = [
    ByteString, // 0
    Int32, // 1
    Float32, // 2
];

/**
 * Class that represents the header of a {@link Table}.
 */
export class Header {
    /**
     * Convenience function to build a binary buffer containing the header info from an object descriptor.
     * @param {{}} header - Object describing the properties of the header
     * @return {ArrayBuffer}
     */
    static buildBinaryHeader(header) {
        const columnCount = header.columns.length;
        let columnNameLength = 0;

        for (let i = 0; i < columnCount; ++i) {
            columnNameLength += Math.min(255, header.columns[i].name.length) + 1;
        }

        const headerLength = 12 * columnCount + columnNameLength + 20;
        const buffer = new ArrayBuffer(headerLength);
        const view = new DataView(buffer);
        let nameOffset = 12 * columnCount + 20;
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

        view.setUint32(offset, header.dataLength, true);
        offset += 4;

        for (let i = 0; i < columnCount; ++i) {
            view.setUint32(offset, header.columns[i].length, true);
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
     * Constructs an instance of a Header by reading its properties from the begining of the specified memory block.
     * @param {MemoryBlock} memory - The memory containing the table header. The table header must be at the beginning.
     */
    constructor(memory) {
        const view = memory.dataView;
        let offset = 0;

        this.mLength = view.getUint32(offset, true);
        offset += 4;

        this.mColumnCount = view.getUint32(offset, true);
        offset += 4;

        this.mRowCount = view.getUint32(offset, true);
        offset += 4;

        this.mRowLength = view.getUint32(offset, true);
        offset += 4;

        this.mDataLength = view.getUint32(offset, true);
        offset += 4;

        this.mColumns = [];
        this.mNames = {};

        let nameOffset = 12 * this.mColumnCount + 20;
        let nameLength;
        let name;
        for (let i = 0; i < this.mColumnCount; ++i) {
            nameLength = view.getUint8(nameOffset++);
            name = String.fromCharCode(...(new Uint8Array(memory.buffer, memory.address + nameOffset, nameLength)));
            nameOffset += nameLength;

            this.mNames[name] = this.mColumns.length;
            this.mColumns.push({
                name,
                size: view.getUint32(offset, true),
                offset: view.getUint32(offset + 4, true),
                type: kBinaryTypeMap[view.getUint32(offset + 8, true)],
            });
            offset += 12;
        }
    }

    /**
     * The length, in bytes, of this header in memory.
     * @return {number}
     */
    get length() {
        return this.mLength;
    }

    /**
     * The number of columns described in the header.
     * @return {number}
     */
    get columnCount() {
        return this.mColumnCount;
    }

    /**
     * The number of rows that the table linked to this header should contain.
     * @return {number}
     */
    get rowCount() {
        return this.mRowCount;
    }

    /**
     * The normalized length, in bytes, of a single row in the table.
     * @return {number}
     */
    get rowLength() {
        return this.mRowLength;
    }

    /**
     * The length, in bytes, of the data contained in the table this header is describing.
     * @return {number}
     */
    get dataLength() {
        return this.mDataLength;
    }

    /**
     * An array containing objects describing each of the columns described in this header.
     * @return {[{name: string, size: number, offset: number, type: Type}]}
     */
    get columns() {
        return this.mColumns;
    }

    /**
     * Returns an object which contains the names of the columns described in this header as keys and the index of the
     * column within the `columns` array as their value.
     * @return {Object<string, number>}
     */
    get names() {
        return this.mNames;
    }
}
