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
import {Pointer} from '../../core/Pointer';

/**
 * Constant variable, represents the character code of the uppercase letter `A`, used to convert string to lower case.
 * @type {number}
 * @private
 */
const kCodeA = ('A').charCodeAt(0);

/**
 * Constant variable, represents the character code of the uppercase letter `Z`, used to convert string to lower case.
 * @type {number}
 * @private
 */
const kCodeZ = ('Z').charCodeAt(0);

/**
 * Base class for all byte string classes. Cannot be used directly.
 * Constructs a ByteString instance of the given size.
 * @class ByteStringBase
 * @param {number} size - The maximum size of this string.
 */
class ByteStringBase {
    constructor(size = 256) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (size > 256) {
            throw 'ERROR: ByteString instances can hold a maximum of 255 characters (+1 byte to hold their length)';
        }
        if (size % 4) {
            throw 'ERROR: ByteString size must be a multiple of 4';
        }
        /// #if !_DEBUG
         */
        /// #endif

        this.mSize = size;
    }

    /**
     * @type {number}
     */
    get size() {
        return this.mSize;
    }

    /**
     * @type {ArrayBufferLike}
     */
    get buffer() {
        throw 'Not implemented';
    }

    /**
     * @type {number}
     */
    get length() {
        throw 'Not implemented';
    }

    /**
     * @type {number}
     */
    get address() {
        throw 'Not implemented';
    }

    /**
     * Utility function, converts this ByteString to a JS string instance.
     * @return {string}
     */
    toString() {
        const arr = new Uint8Array(this.buffer, this.address + 1, this.length);
        return String.fromCharCode(...arr);
    }

    /**
     * Checks if two byte strings are equal. Case sensitive.
     * @param {ByteStringBase} other - The string to test against.
     * @return {boolean}
     */
    equals(other) {
        if (other.length !== this.length) {
            return false;
        }

        for (let i = 0, n = this.length; i < n; ++i) {
            if (other.charCodeAt(i) !== this.charCodeAt(i)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if two byte strings are equal. Case insensitive.
     * @param {ByteStringBase} other - The string to test against.
     * @return {boolean}
     */
    equalsCase(other) {
        if (other.length !== this.length) {
            return false;
        }

        for (let i = 0, n = this.length; i < n; ++i) {
            if (this._toLower(other.charCodeAt(i)) !== this._toLower(this.charCodeAt(i))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if this byte strings contains another string. Case sensitive.
     * @param {ByteStringBase} other - The string to test against.
     * @return {boolean}
     */
    contains(other) {
        const nn = other.length;
        for (let i = 0, n = 1 + this.length - nn; i < n; ++i) {
            if (this.charCodeAt(i) === other.charCodeAt(0)) {
                let ii;
                for (ii = 1; ii < nn; ++ii) {
                    if (this.charCodeAt(i + ii) !== other.charCodeAt(ii)) {
                        break;
                    }
                }
                if (ii === nn) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Checks if this byte strings contains another string. Case insensitive.
     * @param {ByteStringBase} other - The string to test against.
     * @return {boolean}
     */
    containsCase(other) {
        const nn = other.length;
        for (let i = 0, n = 1 + this.length - nn; i < n; ++i) {
            if (this._toLower(this.charCodeAt(i)) === this._toLower(other.charCodeAt(0))) {
                let ii;
                for (ii = 1; ii < nn; ++ii) {
                    if (this._toLower(this.charCodeAt(i + ii)) !== this._toLower(other.charCodeAt(ii))) {
                        break;
                    }
                }
                if (ii === nn) {
                    return true;
                }
            }
        }
        return false;
    }

    /* eslint-disable */
    /**
     * Fetches the character code at the specified index.
     * @param {number} index - The index of the character to fetch.
     * @return {number}
     */
    charCodeAt(index) {
        throw 'Not implemented';
    }
    /* eslint-enable */

    /**
     * Converts the given character code to its lowercase code.
     * @param {number} c - The character code to convert.
     * @return {number}
     * @private
     */
    _toLower(c) {
        return (c >= kCodeA && c <= kCodeZ) ? (c + 32) : c;
    }
}

/**
 * ByteString implementation using pointers. If the underlying pointer changes location the contents of this string
 * are automatically updated to reflect the data contained at the new location.
 * Constructs a byte string instance backed by a Pointer.
 * @class ByteStringPtr
 * @param {Pointer} pointer - The pointer to read the string data from.
 * @param {number=} offset - The offset, from the location of the pointer, to read the data from. Defaults to 0.
 * @param {number=} size - The maximum size of this string in bytes. Defaults to 256.
 */
class ByteStringPtr extends ByteStringBase {
    constructor(pointer, offset = 0, size = 256) {
        super(size);
        this.mOffset = offset;
        this.mPointer = pointer;
    }

    /**
     * @type {number}
     */
    get length() {
        return this.mPointer.getUint8(this.mOffset);
    }

    /**
     * @type {ArrayBufferLike}
     */
    get buffer() {
        return this.mPointer.memory.buffer;
    }

    /**
     * @type {number}
     */
    get address() {
        return this.mPointer.memory.address + this.mPointer.address + this.mOffset;
    }

    /**
     * Fetches the character code at the specified index.
     * @param {number} index - The index of the character to fetch.
     * @return {number}
     */
    charCodeAt(index) {
        return this.mPointer.getUint8(this.mOffset + index + 1);
    }
}

/**
 * ByteString implementation using ArrayBuffers. This implementation is useful for quick off-heap strings. It also
 * guarantees that it will no change its contents without implicit user interaction.
 * Constructs a byte string backed by an ArrayBuffer.
 * @class ByteStringBuffer
 * @param {ArrayBufferLike} buffer - The ArrayBuffer object where this string resides.
 * @param {number=} address - The offset, in bytes, within the buffer where the string resides. Defaults to 0.
 * @param {number=} size - The maximum size of this string in bytes. Defaults to 256.
 */
class ByteStringBuffer extends ByteStringBase {
    constructor(buffer, address = 0, size = 256) {
        super(size);
        this.mBuffer = buffer;
        this.mAddress = address;
        this.mView = new DataView(buffer, this.mAddress, this.mSize);
    }

    /**
     * @type {ArrayBufferLike}
     */
    get buffer() {
        return this.mBuffer;
    }

    /**
     * @type {number}
     */
    get length() {
        return this.mView.getUint8(0);
    }

    /**
     * @type {number}
     */
    get address() {
        return this.mAddress;
    }

    /**
     * Fetches the character code at the specified index.
     * @param {number} index - The index of the character to fetch.
     * @return {number}
     */
    charCodeAt(index) {
        return this.mView.getUint8(index + 1);
    }
}

/**
 * ByteString type
 * @extends Type
 */
class _ByteString extends Type {
    constructor() {
        super('ByteString', 256, 2048);
    }

    get(view, offset) {
        const size = (view.getUint8(offset) + 4) & ~0x03;
        return new ByteStringBuffer(view.buffer, view.byteOffset + offset, size);
    }

    set(view, value, offset) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!(value instanceof ByteStringBase) && typeof value !== 'string' && !(value instanceof String)) {
            throw `ERROR: Cannot set the value of ByteStringType to an instance of ${typeof value}`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        view.setUint8(offset, Math.min(value.length, 255));
        for (let i = 0; i < 255 && i < value.length; ++i) {
            view.setUint8(offset + i + 1, value.charCodeAt(i));
        }
    }

    /**
     * Creates a new ByteString instance based on the provided arguments. Using the more specific `fromPointer`,
     * `fromBuffer` and `fromString` functions is recommended.
     * @param {Pointer|ArrayBufferLike|String} arg1 - The memory object from which the string will be copied from.
     * @param {number=} arg2 - An offset, if needed for the resulting instance. Defaults to 0.
     * @param {number} size - The maximum size, if needed, of the resulting instance. Defaults to 256.
     * @return {ByteStringBase}
     * @memberof ByteString
     */
    new(arg1, arg2 = 0, size = 256) {
        if (arg1 instanceof Pointer) {
            return this.fromPointer(arg1, arg2, size);
        } else if (typeof arg1 === 'string' || arg1 instanceof String) {
            return this.fromString(arg1);
        }
        return this.fromBuffer(arg1, arg2, size);
    }

    /**
     * Creates a ByteString instance from a pointer.
     * @param {Pointer} pointer - The pointer to read the string data from.
     * @param {number=} offset - The offset, from the location of the pointer, to read the data from. Defaults to 0.
     * @param {number=} size - The maximum size of this string in bytes. Defaults to 256.
     * @return {ByteStringPtr}
     * @memberof ByteString
     */
    fromPointer(pointer, offset = 0, size = 256) {
        return new ByteStringPtr(pointer, offset, size);
    }

    /**
     * Creates a ByteString instance from an ArrayBuffer
     * @param {ArrayBufferLike} buffer - The ArrayBuffer object where this string resides.
     * @param {number=} address - The offset, in bytes, within the buffer where the string resides. Defaults to 0.
     * @param {number=} size - The maximum size of this string in bytes. Defaults to 256.
     * @return {ByteStringBuffer}
     * @memberof ByteString
     */
    fromBuffer(buffer, address = 0, size = 256) {
        return new ByteStringBuffer(buffer, address, size);
    }

    /**
     * Creates a byte string from a JS string.
     * @param {string} str - The string to copy during creation.
     * @return {ByteStringBuffer}
     * @memberof ByteString
     */
    fromString(str) {
        const length = Math.min(str.length, 255);
        const size = (length + 4) & ~0x03;
        const view = new Uint8Array(size);
        view[0] = length;
        for (let i = 0; i < length; ++i) {
            view[i + 1] = str.charCodeAt(i);
        }
        return new ByteStringBuffer(view.buffer, 0, view.length);
    }
}

/**
 * @type {_ByteString}
 */
export const ByteString = new _ByteString();
