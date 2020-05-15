import {ByteString} from './ByteString';
import {Float32, Int16, Int32, Int8, Uint16, Uint32, Uint8, Void} from '../../core/Types';

/**
 * Binary type list.
 * @type {Type[]}
 */
export const kBinaryTypes = [
    Uint32, // 0
    Int32, // 1
    Float32, // 2
    Uint16, // 3
    Int16, // 4
    Uint8, // 5
    Int8, // 6
    ByteString, // 7
    Void, // 8
];

/**
 * Binary type map.
 * @type {Map<Type, number>}
 */
export const kBinaryTypeMap = new Map(kBinaryTypes.map((value, i) => [value, i]));

/**
 * Binary type name map.
 * @type {Map<string, number>}
 */
export const kBinaryTypeNameMap = new Map(kBinaryTypes.map((value, i) => [value.name, i]));
