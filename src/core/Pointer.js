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
 * @class Pointer
 * @param {Heap|MemoryBlock} memory - The memory to which this Pointer will be bound to.
 * @param {number=} address - The address of this pointer relative to the memory it is bound to.
 * @param {Type=} type - The type of this pointer, defaults to Uint8.
 */
export class Pointer {
    constructor(memory, address = 0, type = Types.Uint8) {
        this.mMemory = memory;
        this.mOffset = address;
        this.mType = null;
        this.type = type;
    }

    /**
     * Returns a copy of the specified pointer.
     * @param {Pointer} other - The pointer to copy.
     * @return {Pointer}
     */
    static copy(other) {
        return new Pointer(other.mMemory, other.mOffset, other.type);
    }

    /**
     * Returns the memory this pointer is bound to.
     * @type {Heap|MemoryBlock}
     */
    get memory() {
        return this.mMemory;
    }

    /**
     * DataView of the memory this pointer is bound to.
     * @type {DataView}
     */
    get view() {
        return this.mMemory.dataView;
    }

    /**
     * The address of this pointer relative to the memory it is bound to.
     * @type {number}
     */
    get address() {
        return this.mOffset;
    }
    set address(value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (value < 0 || value >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.mOffset = value;
    }

    /**
     * The type of this pointer.
     * @type {Type}
     */
    get type() {
        return this.mType;
    }
    set type(value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!Types.isPrimitiveType(value)) {
            throw 'ERROR: Pointers can only address primitive values';
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.mType = value;
    }

    /**
     * Given its type, returns the numeric value at this pointer's address.
     * @type {number}
     */
    get value() {
        return this.mType.get(this.view, this.mOffset);
    }
    set value(value) {
        this.mType.set(this.view, this.mOffset, value);
    }

    /**
     * Casts the value at this pointer's address to the specified type.
     * @param {Type} type - The desired type for the result.
     * @return {number}
     */
    castValue(type) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!Types.isPrimitiveType(type)) {
            throw 'ERROR: Pointers can only be casted to primitive values';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return type.get(this.view, this.mOffset);
    }

    /**
     * Moves this pointer's address by the specified offset, takes into account the pointer's type.
     * i.e. an offset of 1 will move a Uint32 pointer 4 bytes while a Uint8 pointer will only move 1 byte.
     * @param {number} offset - How many places should the pointer move.
     */
    move(offset) {
        /// #if !_DEBUG
        /*
        /// #endif
        const newOffset = this.mOffset + offset * this.mType.byteSize;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.mOffset = this.mOffset + offset * this.mType.byteSize;
    }

    /**
     * Returns a value from memory at the pointer's address plus the given offset.
     * @param {number} offset - The offset, in the pointer's type size, where the value should be read from.
     * @return {number}
     */
    getValueAt(offset) {
        return this.mType.get(this.view, this.mOffset + offset * this.mType.byteSize);
    }

    /**
     * Stores a value in memory at the pointer's address plus the given offset.
     * @param {number} offset - The offset, in the pointer's type size, where the value will be set.
     * @param {number} value - The number value to set.
     * @return {*}
     */
    setValueAt(offset, value) {
        return this.mType.set(this.view, this.mOffset + offset * this.mType.byteSize, value);
    }

    /**
     * Casts the value at the desired offset (with respect to the pointer) to the desired type.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to cast.
     * @param {Type} type - The desired type of the result.
     * @return {number}
     */
    castValueAt(offset, type) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!Types.isPrimitiveType(type)) {
            throw 'ERROR: Pointers can only be casted to primitive values';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return type.get(this.view, this.mOffset + offset);
    }

    /**
     * Utility function to read an Int8 at the specified offset.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getInt8(offset = 0) {
        /// #if !_DEBUG
        /*
        /// #endif
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.view.getInt8(this.mOffset + offset);
    }

    /**
     * Utility function to read an Int16 at the specified offset.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getInt16(offset = 0) {
        /// #if !_DEBUG
        /*
        /// #endif
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.view.getInt16(this.mOffset + offset, true);
    }

    /**
     * Utility function to read an Int32 at the specified offset.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getInt32(offset = 0) {
        /// #if !_DEBUG
        /*
        /// #endif
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.view.getInt32(this.mOffset + offset, true);
    }

    /**
     * Utility function to read a Uint8 at the specified offset.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getUint8(offset = 0) {
        /// #if !_DEBUG
        /*
        /// #endif
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.view.getUint8(this.mOffset + offset);
    }

    /**
     * Utility function to read a Uint16 at the specified offset.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getUint16(offset = 0) {
        /// #if !_DEBUG
        /*
        /// #endif
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.view.getUint16(this.mOffset + offset, true);
    }

    /**
     * Utility function to read a Uint32 at the specified offset.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getUint32(offset = 0) {
        /// #if !_DEBUG
        /*
        /// #endif
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.view.getUint32(this.mOffset + offset, true);
    }

    /**
     * Utility function to read a Float32 at the specified offset.
     * @param {number} offset - The offset with respect to the pointer, in bytes, of the value to read.
     * @return {number}
     */
    getFloat32(offset = 0) {
        /// #if !_DEBUG
        /*
        /// #endif
        const newOffset = this.mOffset + offset;
        if (newOffset < 0 || newOffset >= this.mMemory.size) {
            throw 'ERROR: New pointer address would be out of bounds';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.view.getFloat32(this.mOffset + offset, true);
    }
}
