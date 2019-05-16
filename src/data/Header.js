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

const kBinaryTypeMap = [
    ByteString, // 0
    Int32, // 1
    Float32, // 2
];

export class Header {
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

    get length() {
        return this.mLength;
    }

    get columnCount() {
        return this.mColumnCount;
    }

    get rowCount() {
        return this.mRowCount;
    }

    get rowLength() {
        return this.mRowLength;
    }

    get dataLength() {
        return this.mDataLength;
    }

    get columns() {
        return this.mColumns;
    }

    get names() {
        return this.mNames;
    }
}
