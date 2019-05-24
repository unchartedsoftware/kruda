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

/**
 * name property symbol
 * @type {symbol}
 * @private
 */
const kName = Symbol('Type::name');

/**
 * byteSize property symbol
 * @type {symbol}
 * @private
 */
const kByteSize = Symbol('Type::byteSize');

/**
 * bitSize property symbol
 * @type {symbol}
 * @private
 */
const kBitSize = Symbol('Type::bitSize');

/**
 * isPrimitive property symbol
 * @type {symbol}
 * @private
 */
const kIsPrimitive = Symbol('Type::isPrimitive');

/**
 * Dictionary to keep track of registered types. Type names must be unique.
 * @type {object}
 * @private
 */
const kTypeMap = {};

/**
 * Creates a new type instance.
 * In DEBUG mode performs checks if the bit and byte sizes are consistent.
 * @class Type
 * @param {string} name - The name of the type to create
 * @param {number} byteSize - Size in bytes of this type
 * @param {number} bitSize - Size in bits of this type, must be x8 bigger than `byteSize`
 */
export class Type {
    constructor(name, byteSize = 0, bitSize = 0) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (bitSize / byteSize !== 8) {
            throw 'ERROR: Inconsistent byteSize and bitSize';
        }
        /// #if !_DEBUG
         */
        /// #endif

        if (kTypeMap.hasOwnProperty(name)) {
            throw 'ERROR: Type names must be unique';
        }

        this[kName] = name;
        this[kByteSize] = byteSize;
        this[kBitSize] = bitSize;
        this[kIsPrimitive] = false;

        kTypeMap[name] = this;
    }

    /**
     * Inspects the specified type and returns it's size. This method is equivalent to the `byteSize` property of the
     * type instance. When in DEBUG mode this method checks if the parameter `t` is an instance of Type.
     * @param {Type} t - The type to inspect
     * @return {number}
     * @static
     */
    static sizeOf(t) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!this.isType(t)) {
            throw `ERROR: Cannot get the size of non-type-descriptor object ${t}`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        return t.byteSize;
    }

    /**
     * Inspects the specified type and returns whether or not this type is valid.
     * @param {Type} t - The type to inspect.
     * @return {boolean}
     * @static
     */
    static isType(t) {
        return (t instanceof Type) && t.bitSize / t.byteSize === 8;
    }

    /**
     * Inspects the specified type and returns whether or not the type is a primitive type.
     * In DEBUG mode, performs a check to validate the type.
     * @param {Type} t - The type to inspect
     * @return {boolean}
     * @static
     */
    static isPrimitive(t) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!this.isType(t)) {
            throw `ERROR: Cannot non-type-descriptor object is a primitive type ${t}`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        return t[kIsPrimitive];
    }

    /**
     * If a type with the specified name exists, this function returns it.
     * @param {string} name - The name of the type to look for.
     * @return {Type|null}
     * @static
     */
    static getTypeByName(name) {
        if (kTypeMap.hasOwnProperty(name)) {
            return kTypeMap[name];
        }
        return null;
    }

    /**
     * Returns the name of this type
     * @type {string}
     */
    get name() {
        return this[kName];
    }

    /**
     * Returns the size, in bytes, of this type.
     * @type {number}
     */
    get byteSize() {
        return this[kByteSize];
    }

    /**
     * Returns the size, in bits, of this type.
     * @type {number}
     */
    get bitSize() {
        return this[kBitSize];
    }

    /* eslint-disable */
    /**
     * Utility function to read a value of this type from memory.
     * @param {DataView} view - The data view used to read the value
     * @param {number} offset - The offset, in bytes, of the value to read
     * @return {*}
     */
    get(view, offset) {
        throw 'Not implemented';
    }

    /**
     * Utility function to set the value of this type in memory.
     * @param {DataView} view - The data view used to write the value
     * @param {*} value - The value to write.
     * @param {number} offset - The offset, in bytes, at which the value will be written.
     */
    set(view, value, offset) {
        throw 'Not implemented';
    }
    /* eslint enable*/
}

/**
 * Utility function, the same as `Type.isType`
 * @param {Type} t - The type to inspect
 * @return {boolean}
 */
export function isType(t) {
    return Type.isType(t);
}

/**
 * Utility function, the same as `Type.isPrimitive`
 * @param {Type} t - The type to inspect
 * @return {boolean}
 */
export function isPrimitiveType(t) {
    return Type.isPrimitive(t);
}

/**
 * Utility function, the same as `Type.sizeOf`
 * @param {Type} t - The type to inspect
 * @return {number}
 */
export function sizeof(t) {
    return Type.sizeOf(t);
}

/**
 * Utility function, the same as `Type.getTypeByName`
 * @param {string} name - The name of the type to look for.
 * @return {Type}
 */
export function typeByName(name) {
    return Type.getTypeByName(name);
}

/**
 * @extends Type
 */
class _Int8 extends Type {
    constructor() {
        super('Int8', 1, 8);
        this[kIsPrimitive] = true;
    }

    get(view, offset) {
        return view.getInt8(offset);
    }

    set(view, value, offset) {
        view.setInt8(offset, value);
    }
}

/**
 * @type {_Int8}
 */
export const Int8 = new _Int8();

/**
 * @extends Type
 */
class _Int16 extends Type {
    constructor() {
        super('Int16', 2, 16);
        this[kIsPrimitive] = true;
    }

    get(view, offset) {
        return view.getInt16(offset, true);
    }

    set(view, value, offset) {
        view.setInt16(offset, value, true);
    }
}

/**
 * @type {_Int16}
 */
export const Int16 = new _Int16();

/**
 * @extends Type
 */
class _Int32 extends Type {
    constructor() {
        super('Int32', 4, 32);
        this[kIsPrimitive] = true;
    }

    get(view, offset) {
        return view.getInt32(offset, true);
    }

    set(view, value, offset) {
        view.setInt32(offset, value, true);
    }
}

/**
 * @type {_Int32}
 */
export const Int32 = new _Int32();

/**
 * @extends Type
 */
class _Uint8 extends Type {
    constructor() {
        super('Uint8', 1, 8);
        this[kIsPrimitive] = true;
    }

    get(view, offset) {
        return view.getUint8(offset);
    }

    set(view, value, offset) {
        view.setUint8(offset, value);
    }
}

/**
 * @type {_Uint8}
 */
export const Uint8 = new _Uint8();

/**
 * @extends Type
 */
class _Uint16 extends Type {
    constructor() {
        super('Uint16', 2, 16);
        this[kIsPrimitive] = true;
    }

    get(view, offset) {
        return view.getUint16(offset, true);
    }

    set(view, value, offset) {
        view.setUint16(offset, value, true);
    }
}

/**
 * @type {_Uint16}
 */
export const Uint16 = new _Uint16();

/**
 * @extends Type
 */
class _Uint32 extends Type {
    constructor() {
        super('Uint32', 4, 32);
        this[kIsPrimitive] = true;
    }

    get(view, offset) {
        return view.getUint32(offset, true);
    }

    set(view, value, offset) {
        view.setUint32(offset, value, true);
    }
}

/**
 * @type {_Uint32}
 */
export const Uint32 = new _Uint32();

/**
 * @extends Type
 */
class _Float32 extends Type {
    constructor() {
        super('Float32', 4, 32);
        this[kIsPrimitive] = true;
    }

    get(view, offset) {
        return view.getFloat32(offset, true);
    }

    set(view, value, offset) {
        view.setFloat32(offset, value, true);
    }
}

/**
 * @type {_Float32}
 */
export const Float32 = new _Float32();

/**
 * Void type (not to be confused with the `void` value.
 * @extends Type
 */
class _Void extends Type {
    constructor() {
        super('Void', 1, 8);
        this[kIsPrimitive] = true;
    }

    get() {
        throw 'Cannot get the value of void, you must use type casting';
    }

    set() {
        throw ' Cannot set the value of void, you must use type casting';
    }
}

/**
 * @type {_Void}
 */
export const Void = new _Void();
