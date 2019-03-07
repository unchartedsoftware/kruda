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

import * as Types from './Types';

/**
 * This class represents a position in a memory block.
 */
export class Pointer {
    /**
     * Returns a copy of the specified pointer.
     * @param {Pointer} other - The pointer to copy.
     * @return {Pointer}
     */
    static copy(other) {
        return new Pointer(other.mMemory, other.mOffset, other.type);
    }

    /**
     * Constructor
     * @param {Heap|MemoryBlock} memory - The memory to which this Pointer will be bound to.
     * @param {number=} address - The address of this pointer relative to the memory it is bound to.
     * @param {Type=} type - The type of this pointer, defaults to Uint8.
     */
    constructor(memory, address = 0, type = Types.Uint8) {
        this.mMemory = memory;
        this.mOffset = address;
        this.mView = this.mMemory.dataView;
        this.mType = null;
        this.type = type;
    }

    /**
     * Returns the memory this pointer is bound to.
     * @return {Heap|MemoryBlock}
     */
    get memory() {
        return this.mMemory;
    }

    /**
     * DataView of the memory this pointer is bound to.
     * @return {DataView}
     */
    get view() {
        return this.mView;
    }

    /**
     * The address of this pointer relative to the memory it is bound to.
     * @return {number}
     */
    get address() {
        return this.mOffset;
    }

    /**
     * Sets the address of this pointer relative to the memory it is bound to.
     * @param {number} value - The new address.
     */
    set address(value) {
        /// #if DEBUG
        const newOffset = this.mOffset + value;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        this.mOffset = value;
    }

    /**
     * The type of this pointer.
     * @return {Type}
     */
    get type() {
        return this.mType;
    }

    /**
     * Sets the type of this pointer, think of it as "casting".
     * @param {Type} value - The new type of this pointer.
     */
    set type(value) {
        /// #if DEBUG
        if (!Types.isPrimitiveType(value)) {
            throw 'ERROR: Pointers can only address primitive values';
        }
        /// #endif
        this.mType = value;
    }

    /**
     * Given its type, returns the numeric value at this pointer's address.
     * @return {number}
     */
    get value() {
        return this.mType.get(this.mView, this.mOffset);
    }

    /**
     * Given its type, sets the numeric value at this pointer's address.
     * @param {number} value - The value to set.
     */
    set value(value) {
        this.mType.set(this.mView, value, this.mOffset);
    }

    /**
     * Casts the value at this pointer's address to the specified type.
     * @param {Type} type - The desired type for the result.
     * @return {number}
     */
    castValue(type) {
        /// #if DEBUG
        if (!Types.isPrimitiveType(type)) {
            throw 'ERROR: Pointers can only be casted to primitive values';
        }
        /// #endif
        return type.get(this.mView, this.mOffset);
    }

    /**
     * Moves this pointer's address by the specified offset, takes into account the pointer's type.
     * i.e. an offset of 1 will move a Uint32 pointer 4 bytes while a Uint8 pointer will only move 1 byte.
     * @param {number} offset - How many places should the pointer move.
     */
    move(offset) {
        /// #if DEBUG
        const newOffset = this.mOffset + offset * this.mType.byteSize;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        this.mOffset = this.mOffset + offset * this.mType.byteSize;
    }

    /**
     * Returns a value from memory at the pointer's address plus the given offset.
     * @param {number} offset - The offset, in the pointer's type size, where the value should be read from.
     * @return {number}
     */
    getValueAt(offset) {
        return this.mType.get(this.mView, this.mOffset + offset * this.mType.byteSize);
    }

    /**
     * Stores a value in memory at the pointer's address plus the given offset.
     * @param {number} offset - The offset, in the pointer's type size, where the value will be set.
     * @param {number} value - The number value to set.
     * @return {*}
     */
    setValueAt(offset, value) {
        return this.mType.set(this.mView, value, this.mOffset + offset * this.mType.byteSize);
    }

    /**
     * Casts the value at the desired offset (with respect to the pointer) to the desired type.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to cast.
     * @param {Type} type - The desired type of the result.
     * @return {number}
     */
    castValueAt(offset, type) {
        /// #if DEBUG
        if (!Types.isPrimitiveType(type)) {
            throw 'ERROR: Pointers can only be casted to primitive values';
        }
        /// #endif
        return type.get(this.mView, this.mOffset + offset);
    }

    /**
     * Utility function to read an Int8 at the specified offset.
     * @param {number} offset=0 - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getInt8(offset = 0) {
        /// #if DEBUG
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        return this.mView.getInt8(this.mOffset + offset);
    }

    /**
     * Utility function to read an Int16 at the specified offset.
     * @param {number} offset=0 - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getInt16(offset = 0) {
        /// #if DEBUG
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        return this.mView.getInt16(this.mOffset + offset, true);
    }

    /**
     * Utility function to read an Int32 at the specified offset.
     * @param {number} offset=0 - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getInt32(offset = 0) {
        /// #if DEBUG
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        return this.mView.getInt32(this.mOffset + offset, true);
    }

    /**
     * Utility function to read a Uint8 at the specified offset.
     * @param {number} offset=0 - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getUint8(offset = 0) {
        /// #if DEBUG
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        return this.mView.getUint8(this.mOffset + offset);
    }

    /**
     * Utility function to read a Uint16 at the specified offset.
     * @param {number} offset=0 - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getUint16(offset = 0) {
        /// #if DEBUG
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        return this.mView.getUint16(this.mOffset + offset, true);
    }

    /**
     * Utility function to read a Uint32 at the specified offset.
     * @param {number} offset=0 - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getUint32(offset = 0) {
        /// #if DEBUG
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        return this.mView.getUint32(this.mOffset + offset, true);
    }

    /**
     * Utility function to read a Float32 at the specified offset.
     * @param {number} offset=0 - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getFloat32(offset = 0) {
        /// #if DEBUG
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #endif
        return this.mView.getFloat32(this.mOffset + offset, true);
    }
}
