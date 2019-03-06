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
import {Type} from '../core/Types';
import {Pointer} from '../core/Pointer';

const kCodeA = ('A').charCodeAt(0);
const kCodeZ = ('Z').charCodeAt(0);

class ByteStringBase {
    constructor(size = 256) {
        /// #if DEBUG
        if (size > 256) {
            throw 'ERROR: ByteString instances can hold a maximum of 255 characters (+1 byte to hold their length)';
        }
        if (size % 4) {
            throw 'ERROR: ByteString size must be a multiple of 4';
        }
        /// #endif

        this.mSize = size;
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

    toString() {
        const arr = new Uint8Array(this.buffer, this.address + 1, this.length);
        return String.fromCharCode(...arr);
    }

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

    _toLower(c) {
        return (c >= kCodeA && c <= kCodeZ) ? (c + 32) : c;
    }
}

class ByteStringPtr extends ByteStringBase {
    constructor(pointer, offset = 0, size = 256) {
        super(size);
        this.mOffset = offset;
        this.mPointer = pointer;
    }

    get length() {
        return this.mPointer.getUint8(this.mOffset);
    }

    get buffer() {
        return this.mPointer.memory.buffer;
    }

    get address() {
        return this.mPointer.memory.address + this.mPointer.address + this.mOffset;
    }

    charCodeAt(index) {
        return this.mPointer.getUint8(this.mOffset + index + 1);
    }
}

class ByteStringBuffer extends ByteStringBase {
    constructor(buffer, address, size = 256) {
        super(size);
        this.mBuffer = buffer;
        this.mAddress = address;
        this.mView = new DataView(buffer, this.mAddress, this.mSize);
    }

    get buffer() {
        return this.mBuffer;
    }

    get length() {
        return this.mView.getUint8(0);
    }

    get address() {
        return this.mAddress;
    }

    charCodeAt(index) {
        return this.mView.getUint8(index + 1);
    }
}

class _ByteString extends Type {
    constructor() {
        super('ByteString', 256, 2048);
    }

    get(view, offset) {
        return new ByteStringBuffer(view.buffer, view.byteOffset + offset, view.getUint8(offset) + 1);
    }

    set(view, value, offset) {
        /// #if DEBUG
        if (!(value instanceof ByteStringBase) && typeof value !== 'string' && !(value instanceof String)) {
            throw `ERROR: Cannot set the value of ByteStringType to an instance of ${typeof value}`;
        }
        /// #endif
        view.setUint8(offset, Math.min(value.length, 255));
        for (let i = 0; i < 255 && i < value.length; ++i) {
            view.setUint8(offset + i + 1, value.charCodeAt(i));
        }
    }

    new(arg1, arg2, size = 256) {
        if (arg1 instanceof Pointer) {
            return new ByteStringPtr(arg1, arg2, size);
        }
        return new ByteStringBuffer(arg1, arg2, size);
    }

    fromPointer(pointer, offset = 0, size = 256) {
        return new ByteStringPtr(pointer, offset, size);
    }

    fromBuffer(buffer, address, size = 256) {
        return new ByteStringBuffer(buffer, address, size);
    }

    fromString(str) {
        const length = Math.min(str.length, 255);
        const view = new Uint8Array(length + 1);
        view[0] = length;
        for (let i = 0; i < length; ++i) {
            view[i + 1] = str.charCodeAt(i);
        }
        return new ByteStringBuffer(view.buffer, 0, view.length);
    }
}

export const ByteString = new _ByteString();
