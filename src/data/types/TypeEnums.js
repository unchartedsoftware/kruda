import {ByteString} from './ByteString';
import {Float32, Int16, Int32, Int8, Uint16, Uint32, Uint8, Void} from '../../core/Types';
import {
    I16Vec2,
    I16Vec3,
    I32Vec2,
    I32Vec3,
    I8Vec2,
    I8Vec3,
    U16Vec2,
    U16Vec3,
    U32Vec2,
    U32Vec3,
    U8Vec2,
    U8Vec3,
    Vec2,
    Vec3,
} from './Vectors';

/**
 * Binary type list.
 * @type {Type[]}
 */
export const kBinaryTypes = [
    Uint32, // 0
    U32Vec2,
    U32Vec3,
    Int32,
    I32Vec2,
    I32Vec3,
    Float32,
    Vec2,
    Vec3,
    Uint16,
    U16Vec2,
    U16Vec3,
    Int16,
    I16Vec2,
    I16Vec3,
    Uint8,
    U8Vec2,
    U8Vec3,
    Int8,
    I8Vec2,
    I8Vec3,
    ByteString,
    Void,
];

/**
 * Binary type map.
 * @type {Map<Type, number>}
 */
export const kBinaryTypeMap = new Map(kBinaryTypes.map((value, i) => [value, i]));
