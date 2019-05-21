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
import {Pointer} from '../core/Pointer';
import * as Types from '../core/Types';
import {ByteString} from './ByteString';

/**
 * Class to read and write values of a row in a {@link Table}.
 */
export class Row {
    /**
     * Constructs an instance of a row in the given table at the specified index.
     * Each Row instance automatically adds new properties with the names of the columns to its `fields` object for
     * easy access.
     * WARNING: String returned by a row will mutate when the row's address changes, if strings with constant values are
     * needed, either copy of the string or create a JS string from it by calling `toString` on it.
     * @param {Table} table - The table this row belongs to.
     * @param {number=} index - the row index at which this instance will read data. Defaults to 0.
     */
    constructor(table, index = 0) {
        this.mTable = table;
        this.mTableOffset = this.mTable.dataOffset;
        this.mSize = this.mTable.header.rowLength;
        this.mIndex = index;
        this.mPointer = new Pointer(this.mTable.memory, this.mTableOffset + this.mIndex * this.mSize, Types.Void);
        this.mAccessors = {};
        this.mFields = {};

        this.mTable.header.columns.forEach(column => {
            const accessor = {
                column,
                getter: this._createPropertyGetter(column, this.mPointer),
                setter: () => {}, // not implemented yet
            };

            this.mAccessors[column.name] = accessor;

            Object.defineProperty(this.mFields, column.name, {
                get: accessor.getter,
                set: accessor.setter,
            });
        });
    }

    /**
     * The size, in bytes, of a row in the table.
     * @return {number}
     */
    get size() {
        return this.mSize;
    }

    /**
     * The table this row belongs to.
     * @return {Table}
     */
    get table() {
        return this.mTable;
    }

    /**
     * An array containing the names of the columns in the table this row belongs to.
     * @return {Array}
     */
    get columns() {
        return this.mTable.header.orderOriginal;
    }

    /**
     * An object containing accessor objects ({{column:string, getter:function():*, setter:null}}) for the fields in
     * this row.
     * @return {object}
     */
    get accessors() {
        return this.mAccessors;
    }

    /**
     * An object containing properties to get and set the values for the fields in this row based on their column names.
     * NOTE: Setting values is not implemented yet.
     * @return {object}
     */
    get fields() {
        return this.mFields;
    }

    /**
     * The internal pointer this row uses to access its memory. Changing the location of this pointer will result in
     * the contents of the row being updated.
     * WARNING: Setting the address of this pointer to a memory address taht does not represent the beginning of a
     * row in a table will result in undefined behaviour.
     * @return {Pointer}
     */
    get pointer() {
        return this.mPointer;
    }

    /**
     * The row index this instance is currently pointing at.
     * @return {number}
     */
    get index() {
        return this.mIndex;
    }

    /**
     * Sets the row index this row should be pointing at. Does not take into consideration the internal pointer address
     * to calculate the new row address so it's safe to use to reset the internal pointer address.
     * @param {number} value - The new index.
     */
    set index(value) {
        this.mIndex = value;
        this.mPointer.address = this.mTableOffset + this.mIndex * this.mSize;
    }

    /**
     * Creates a function that returns the contents of a column's field as specified by the `description` object.
     * NOTE: The returned functions make use of the row's internal pointer for efficiency.
     * @param {{type:number, size:number, offset:number}} description - Descriptions of the column this field belongs to.
     * @param {Pointer} pointer - The row's internal pointer.
     * @return {function():*}
     * @private
     */
    _createPropertyGetter(description, pointer) {
        const offset = description.offset;
        const type = description.type;
        if (type === ByteString) {
            const string = ByteString.fromPointer(this.mPointer, description.offset, description.size);
            return function getColumnString() {
                return string; // ByteString.fromBuffer(string.buffer, string.address, string.size);
            };
        }

        return () => pointer.castValueAt(offset, type);
    }
}
