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
import {Pointer} from '../../core/Pointer';
import * as Types from '../../core/Types';
import {ByteString} from '../types/ByteString';
import {Header} from './Header';

/**
 * Class to read and write values of a row in a {@link Table}.
 * Constructs an instance of a row in the given table at the specified index.
 * Each Row instance automatically adds new properties with the names of the columns to its `fields` object for
 * easy access.
 * WARNING: String returned by a row will mutate when the row's address changes, if strings with constant values are
 * needed, either copy of the string or create a JS string from it by calling `toString` on it.
 * @class Row
 * @param {Table} table - The table this row belongs to.
 * @param {number=} index - the row index at which this instance will read data. Defaults to 0.
 * @param {boolean=} binary - Should this row return binary strings.
 */
export class Row {
    constructor(table, index = 0, binary = false) {
        this.mTable = table;
        this.mTableOffset = this.mTable.dataOffset;
        this.mSize = this.mTable.header.rowLength;
        this.mStep = this.mTable.header.rowStep;
        this.mIndex = index;
        this.mPointers = [];
        this.mAccessors = [];
        this.mFields = {};
        this.mBinary = binary;

        const isColumnar = this.mTable.header.layout === Header.memoryLayout.COLUMNAR;
        if (!isColumnar) {
            this.mPointers.push({
                pointer: new Pointer(this.mTable.memory, this.mTableOffset + this.mIndex * this.mStep, Types.Void),
                offset: this.mTableOffset,
                step: this.mStep,
            });
        }

        const columns = this.mTable.header.columns;
        let column;
        for (let i = 0, n = columns.length; i < n; ++i) {
            column = columns[i];

            let pointer;
            if (isColumnar) {
                pointer = new Pointer(this.mTable.memory, this.mTableOffset + column.dataOffset + this.mIndex * column.size, Types.Void);
                this.mPointers.push({
                    pointer,
                    offset: this.mTableOffset + column.dataOffset,
                    step: column.size,
                });
            } else {
                pointer = this.mPointers[0].pointer;
            }

            const accessor = {
                column,
                getter: this._createPropertyGetter(column, pointer),
                setter: this._createPropertySetter(column, pointer),
            };

            this.mAccessors.push(accessor);

            Object.defineProperty(this.mFields, column.name.toString(), {
                get: accessor.getter,
                set: accessor.setter,
            });
        }
    }

    /**
     * The size, in bytes, of a row in the table.
     * @type {number}
     */
    get size() {
        return this.mSize;
    }

    /**
     * The number of bytes the internal pointer shifts in order to move to the next/previous row in the data.
     * @type {number}
     */
    get step() {
        return this.mStep;
    }

    /**
     * The table this row belongs to.
     * @type {Table}
     */
    get table() {
        return this.mTable;
    }

    /**
     * An array containing the names of the columns in the table this row belongs to.
     * @type {Array<{name: string, size: number, offset: number, type: Type}>}
     */
    get columns() {
        return this.mTable.header.columns;
    }

    /**
     * An object containing the column names as keys and their index in the table's header as their value.
     * @type {Object<string, number>}
     */
    get names() {
        return this.mTable.header.names;
    }

    /**
     * An array, ordeed by the order in which each field appears in the table's header, containing accessor objects for
     * the fields in this row.
     * @type {Array<{column:string, getter:function():*, setter:function(any):void}>}
     */
    get accessors() {
        return this.mAccessors;
    }

    /**
     * An object containing properties to get and set the values for the fields in this row based on their column names.
     * NOTE: Setting values is not implemented yet.
     * @type {object}
     */
    get fields() {
        return this.mFields;
    }

    /**
     * The internal pointer this row uses to access its memory. Changing the location of this pointer will result in
     * the contents of the row being updated.
     * WARNING: Setting the address of this pointer to a memory address that does not represent the beginning of a
     * row in a table will result in undefined behaviour.
     * @type {Pointer}
     */
    get pointer() {
        return this.mPointers[0].pointer;
    }

    /**
     * The row index this instance is currently pointing at.
     * Does not take into consideration the internal pointer address
     * to calculate the new row address so it's safe to use to reset the internal pointer address.
     * @type {number}
     */
    get index() {
        return this.mIndex;
    }
    set index(value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!value >= this.mTable.rowCount) {
            throw 'ERROR: Index out of bounds!';
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.mIndex = value;

        let ptr;
        for (let i = 0, n = this.mPointers.length; i < n; ++i) {
            ptr = this.mPointers[i];
            ptr.pointer.address = ptr.offset + ptr.step * this.mIndex;
        }
    }

    /**
     * Creates a function that returns the contents of a column's field as specified by the `description` object.
     * NOTE: The returned functions make use of the row's internal pointer for efficiency.
     * @param {Column} description - Descriptions of the column this field belongs to.
     * @param {Pointer} pointer - The row's internal pointer.
     * @return {function():*}
     * @private
     */
    _createPropertyGetter(description, pointer) {
        const offset = description.offset;
        const type = description.type;
        if (type === ByteString) {
            const string = ByteString.fromPointer(pointer, offset, description.size);
            if (this.mBinary) {
                return function getColumnStringBinary() {
                    return string; // ByteString.fromBuffer(string.buffer, string.address, string.size);
                };
            }

            return function getColumnString() {
                return string.toString();
            };
        }

        return function getColumnValue() {
            return pointer.castValueAt(offset, type);
        };
    }

    /**
     * Creates a function that sets the value of a column's field as specified by the `description` object.
     * NOTE: The returned functions make use of the row's internal pointer for efficiency.
     * @param {Column} description - Descriptions of the column this field belongs to.
     * @param {Pointer} pointer - The row's internal pointer.
     * @return {function(value):void}
     * @private
     */
    _createPropertySetter(description, pointer) {
        const offset = description.offset;
        const type = description.type;

        return function setColumnValue(value) {
            /// #if !_DEBUG
            /*
            /// #endif
            if (type === ByteString && value.length > description.size - 1) {
                throw `ERROR: Value [${value}] is longer than the max length allowed (${description.size - 1}).`
            }
            /// #if !_DEBUG
             */
            /// #endif
            type.set(pointer.view, pointer.address + offset, value);
        };
    }
}
