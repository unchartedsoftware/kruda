/**
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
import {Pointer} from '../core/Pointer';
import * as Types from '../core/Types';
import {ByteString} from './ByteString';

export class Row {
    constructor(table, index = 0) {
        this.mTable = table;
        this.mTableOffset = this.mTable.mDataOffset;
        this.mSize = this.mTable.header.rowSize;
        this.mIndex = index;
        this.mPointer = new Pointer(this.mTable.memory, this.mTableOffset + this.mIndex * this.mSize, Types.Void);
        this.mAccessors = {};

        this.mTable.header.order.forEach(column => {
            const description = this.mTable.header.columns[column];
            const accessor = {
                column,
                getter: this._createPropertyGetter(description, this.mPointer),
                setter: null,
            };

            this.mAccessors[column] = accessor;

            Object.defineProperty(this, column, {
                get: () => accessor.getter(),
            });
        });
    }

    get size() {
        return this.mSize;
    }

    get table() {
        return this.mTable;
    }

    get columns() {
        return this.mTable.header.orderOriginal;
    }

    get accessors() {
        return this.mAccessors;
    }

    get pointer() {
        return this.mPointer;
    }

    get index() {
        return this.mIndex;
    }

    set index(value) {
        this.mIndex = value;
        this.mPointer.address = this.mTableOffset + this.mIndex * this.mSize;
    }

    _createPropertyGetter(description, pointer) {
        const offset = description.offset;
        const type = Types.typeByName(description.type);
        if (type) {
            return () => pointer.castValueAt(offset, type);
        } else if (description.type === 'string') {
            const string = ByteString.fromPointer(this.mPointer, description.offset, description.size);
            return function getColumnString() {
                return string; // ByteString.fromBuffer(string.buffer, string.address, string.size);
            };
        }

        return () => 'Type not implemented yet';
    }
}
