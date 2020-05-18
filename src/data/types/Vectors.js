import {Float32, Int16, Int32, Int8, Type, Uint16, Uint32, Uint8} from '../../core/Types';

/**
 * Base class for all vector classes that implements the convenience functions of the class. Cannot be used directly.
 * Constructs a VectorBase instance.
 * @class VectorBase
 * @extends Iterable
 * @param {number} components - The number of components in the vector
 * @param {Type} type - The type of the components within this vector
 */
class VectorBase {
    constructor(components, type) {
        this.mComponents = components;
        this.mType = type;
    }

    /**
     * The number of dimensions in this vector.
     * @type {number}
     */
    get length() {
        return this.mComponents;
    }

    /**
     * The type of the components in this vector.
     * @type {Type}
     */
    get type() {
        return this.mType;
    }

    /**
     * Convenience property to access the first component of the vector
     * @type {number}
     */
    get x() {
        return this.getComponentAt(0);
    }
    set x(value) {
        this.setComponentAt(0, value);
    }

    /**
     * Convenience property to access the second component of the vector
     * @type {number}
     */
    get y() {
        return this.getComponentAt(1);
    }
    set y(value) {
        this.setComponentAt(1, value);
    }

    /**
     * Convenience property to access the third component of the vector
     * @type {number}
     */
    get z() {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < 3) {
            throw `ERROR: Cannot get Z property of a vector with less than 3 components`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.getComponentAt(2);
    }
    set z(value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < 3) {
            throw `ERROR: Cannot set Z property of a vector with less than 3 components`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.setComponentAt(2, value);
    }

    /**
     * Convenience property to access the fourth component of the vector
     * @type {number}
     */
    get w() {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < 4) {
            throw `ERROR: Cannot get W property of a vector with less than 4 components`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.getComponentAt(3);
    }
    set w(value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < 4) {
            throw `ERROR: Cannot set W property of a vector with less than 4 components`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.setComponentAt(3, value);
    }

    /**
     * Convenience property to access the first component of the vector
     * @type {number}
     */
    get r() {
        return this.getComponentAt(0);
    }
    set r(value) {
        this.setComponentAt(0, value);
    }

    /**
     * Convenience property to access the second component of the vector
     * @type {number}
     */
    get g() {
        return this.getComponentAt(1);
    }
    set g(value) {
        this.setComponentAt(1, value);
    }

    /**
     * Convenience property to access the third component of the vector
     * @type {number}
     */
    get b() {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < 3) {
            throw `ERROR: Cannot get B property of a vector with less than 3 components`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.getComponentAt(2);
    }
    set b(value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < 3) {
            throw `ERROR: Cannot set B property of a vector with less than 3 components`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.setComponentAt(2, value);
    }

    /**
     * Convenience property to access the fourth component of the vector
     * @type {number}
     */
    get a() {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < 4) {
            throw `ERROR: Cannot get A property of a vector with less than 4 components`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.getComponentAt(3);
    }
    set a(value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < 4) {
            throw `ERROR: Cannot set A property of a vector with less than 4 components`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.setComponentAt(3, value);
    }

    /**
     * Gets the value of this vector at the specified index.
     * @param {number} index - The index of the value to get.
     * @return {number}
     */ // eslint-disable-line valid-jsdoc
    getComponentAt(index) { // eslint-disable-line no-unused-vars
        throw 'Not implemented';
    }

    /**
     * Sets the value of this vector at the specified index.
     * @param {number} index - The index of the value to set
     * @param {number} value - The value to set.
     */
    setComponentAt(index, value) { // eslint-disable-line no-unused-vars
        throw 'Not implemented';
    }

    /**
     * Utility function, converts this Vector to a JS string instance.
     * @return {string}
     */
    toString() {
        const result = [];
        for (let i = 0, n = this.mComponents; i < n; ++i) {
            result.push(this.getComponentAt(i));
        }
        return result.toString();
    }

    /**
     * Default implementation of iterable protocol, to comply with arrays:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/values
     * @returns {Iterator}
     */
    values() {
        return {
            i: 0,
            n: this.mComponents,
            next() {
                if (this.i < this.n) {
                    ++this.i;
                    return { value: this.getComponentAt(this.i), done: false };
                }
                return { value: undefined, done: true };
            },
        };
    }

    /*
     * Iterable protocol implementation:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable
     * @return {Iterator}
     */
    [Symbol.iterator]() {
        return this.values();
    }
}

/**
 * Vector class that gets its data from an ArrayBuffer.
 * @class VectorBuffer
 * @param {Type} type - The type of the components in this vector
 * @param {number} components - The number of components in the vector
 * @param {ArrayBufferLike} buffer - The buffer from which the components will be read
 * @param {number=} address - The offset, in bytes, where the data resides within the buffer
 */
class VectorBuffer extends VectorBase {
    constructor(type, components, buffer, address = 0) {
        super(components, type);
        this.mBuffer = buffer;
        this.mAddress = address;
        this.mView = new DataView(buffer, this.mAddress, this.mType.byteSize * this.mComponents);
    }

    /**
     * Gets the value of this vector at the specified index.
     * @param {number} index - The index of the value to get.
     * @return {number}
     */
    getComponentAt(index) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < index) {
            throw `ERROR: Component index out of bounds`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.mType.get(this.mView, this.mType.byteSize * index);
    }

    /**
     * Sets the value of this vector at the specified index.
     * @param {number} index - The index of the value to set
     * @param {number} value - The value to set.
     */
    setComponentAt(index, value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < index) {
            throw `ERROR: Component index out of bounds`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.mType.set(this.mView, value, this.mType.byteSize * index);
    }
}

/**
 * Vector class implementation using pointers. If the underlying pointer changes location the contents of this vector
 * are automatically updated to reflect the data contained at the new location..
 * @class VectorPtr
 * @param {Type} type - The type of the components in this vector
 * @param {number} components - The number of components in the vector
 * @param {Pointer} pointer - The pointer to read the vector data from.
 * @param {number=} offset - The offset, from the location of the pointer, to read the data from. Defaults to 0.
 */
class VectorPtr extends VectorBase {
    constructor(type, components, pointer, offset = 0) {
        super(components, type);
        this.mPointer = pointer;
        this.mOffset = offset;
    }

    /**
     * Gets the value of this vector at the specified index.
     * @param {number} index - The index of the value to get.
     * @return {number}
     */
    getComponentAt(index) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < index) {
            throw `ERROR: Component index out of bounds`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.mPointer.castValueAt(this.mOffset + this.mType.byteSize * index, this.mType);
    }

    /**
     * Sets the value of this vector at the specified index.
     * @param {number} index - The index of the value to set
     * @param {number} value - The value to set.
     */
    setComponentAt(index, value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mLength < index) {
            throw `ERROR: Component index out of bounds`;
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.mType.set(this.mPointer.view, this.mPointer.address + this.mOffset, value);
    }
}

/**
 * Vector type
 * @extends Type
 * @param {string} name - The name of the new vector type
 * @param {number} components - The number of components for the new vector
 * @param {Type} type - The type of the element in this vector
 */
class Vector extends Type {
    constructor(name, components, type) {
        super(name, type.byteSize * components, type.bitSize * components);
        this.mComponents = components;
        this.mType = type;
    }

    get(view, offset) {
        return new VectorBuffer(this.mType, this.mComponents, view.buffer, view.byteOffset + offset);
    }

    set(view, offset, value) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (typeof value[Symbol.iterator] !== 'function') {
            throw `ERROR: Cannot set the value of VectorType to an non-iterable instance of ${typeof value}`;
        }
        if (value.length > this.mComponents) {
            throw `ERROR: The number of components in the new value is higher than the ones in the vector.`
        }
        /// #if !_DEBUG
         */
        /// #endif
        let i = 0;
        for (const component of value) {
            this.mType.set(view, offset + this.mType.byteSize * i++, component);
        }
    }

    /**
     * Creates a ByteString instance from a pointer.
     * @param {Pointer} pointer - The pointer to read the string data from.
     * @param {number=} offset - The offset, from the location of the pointer, to read the data from. Defaults to 0.
     * @return {VectorPtr}
     */
    fromPointer(pointer, offset = 0) {
        return new VectorPtr(this.mType, this.mComponents, pointer, offset);
    }

    /**
     * Creates a Vector instance from an ArrayBuffer
     * @param {ArrayBufferLike} buffer - The ArrayBuffer object where this vector resides.
     * @param {number=} address - The offset, in bytes, within the buffer where the vector resides. Defaults to 0.
     * @return {VectorBuffer}
     */
    fromBuffer(buffer, address = 0) {
        return new VectorBuffer(this.mType, this.mComponents, buffer, address);
    }

    /**
     * Creates a vector from another vector.
     * @param {ArrayLike} vector - The vector to copy during creation.
     * @return {VectorBuffer}
     */
    fromVector(vector) {
        const type = vector instanceof VectorBase ? vector.type : Float32;
        const components = vector.length;
        const buffer = new ArrayBuffer(components * type.byteSize);
        const result = new VectorBuffer(type, vector.length, buffer);
        for (let i = 0; i < components; ++i) {
            result.setComponentAt(i, vector[i]);
        }
        return result;
    }
}

/**
 * Utility function to create a new Vector type, useful for
 * @param {string} name - The name of the new vector type
 * @param {number} components - The number of components for the new vector
 * @param {Type} type - The type of the element in this vector
 * @returns {Vector}
 */
export function newVectorType(name, components, type) {
    return new Vector(name, components, type);
}

/**
 * @type {Vector}
 */
export const Vec2 = newVectorType('Vec2', 2, Float32);

/**
 * @type {Vector}
 */
export const I32Vec2 = newVectorType('I32Vec2', 2, Int32);

/**
 * @type {Vector}
 */
export const U32Vec2 = newVectorType('U32Vec2', 2, Uint32);

/**
 * @type {Vector}
 */
export const I16Vec2 = newVectorType('I16Vec2', 2, Int16);

/**
 * @type {Vector}
 */
export const U16Vec2 = newVectorType('U16Vec2', 2, Uint16);

/**
 * @type {Vector}
 */
export const I8Vec2 = newVectorType('I8Vec2', 2, Int8);

/**
 * @type {Vector}
 */
export const U8Vec2 = newVectorType('U8Vec2', 2, Uint8);

/**
 * @type {Vector}
 */
export const Vec3 = newVectorType('Vec3', 3, Float32);

/**
 * @type {Vector}
 */
export const I32Vec3 = newVectorType('I32Vec3', 3, Int32);

/**
 * @type {Vector}
 */
export const U32Vec3 = newVectorType('U32Vec3', 3, Uint32);

/**
 * @type {Vector}
 */
export const I16Vec3 = newVectorType('I16Vec3', 3, Int16);

/**
 * @type {Vector}
 */
export const U16Vec3 = newVectorType('U16Vec3', 3, Uint16);

/**
 * @type {Vector}
 */
export const I8Vec3 = newVectorType('I8Vec3', 3, Int8);

/**
 * @type {Vector}
 */
export const U8Vec3 = newVectorType('U8Vec3', 3, Uint8);
