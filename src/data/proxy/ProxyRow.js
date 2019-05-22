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

import {Row} from '../table/Row';

/**
 * Class to read and write values of a row in a {@link ProxyTable}.
 */
export class ProxyRow {
    /**
     * Constructs an instance of a row in the given table at the specified index.
     * Each Row instance automatically adds new properties with the names of the columns to its `fields` object for
     * easy access.
     * WARNING: String returned by a row will mutate when the row's address changes, if strings with constant values are
     * needed, either copy of the string or create a JS string from it by calling `toString` on it.
     * @param {ProxyTable} table - The table this row belongs to.
     * @param {number=} index - the row index at which this instance will read data. Defaults to 0.
     */
    constructor(table, index = 0) {
        this.mTable = table;
        this.mIndexRow = new Row(this.mTable.indexTable, index);
        this.mSourceRow = new Row(this.mTable.sourceTable, this.mIndexRow.accessors[0].getter());
    }

    /**
     * The size, in bytes, of a row in the table.
     * @return {number}
     */
    get size() {
        return this.mSourceRow.size;
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
     * @return {{name: string, size: number, offset: number, type: Type}[]}
     */
    get columns() {
        return this.mTable.header.columns;
    }

    /**
     * An object containing the column names as keys and their index in the table's header as their value.
     * @return {Object<string, number>}
     */
    get names() {
        return this.mTable.header.names;
    }

    /**
     * An array, ordeed by the order in which each field appears in the table's header, containing accessor objects for
     * the fields in this row.
     * @return {{column:string, getter:function():*, setter:null}[]}
     */
    get accessors() {
        return this.mSourceRow.accessors;
    }

    /**
     * An object containing properties to get and set the values for the fields in this row based on their column names.
     * NOTE: Setting values is not implemented yet.
     * @return {object}
     */
    get fields() {
        return this.mSourceRow.fields;
    }

    /**
     * The internal pointer this row uses to access its memory. Changing the location of this pointer will result in
     * the contents of the row being updated.
     * WARNING: Setting the address of this pointer to a memory address that does not represent the beginning of a
     * row in a table will result in undefined behaviour.
     * @return {Pointer}
     */
    get pointer() {
        return this.mSourceRow.pointer;
    }

    /**
     * The row index this instance is currently pointing at.
     * @return {number}
     */
    get index() {
        return this.mIndexRow.index;
    }

    /**
     * Sets the row index this row should be pointing at. Does not take into consideration the internal pointer address
     * to calculate the new row address so it's safe to use to reset the internal pointer address.
     * @param {number} value - The new index.
     */
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
        this.mIndexRow.index = value;
        this.mSourceRow.index = this.mIndexRow.accessors[0].getter();
    }
}
