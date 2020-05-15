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

import * as _Types from './core/Types';

/**
 * @type {Object}
 * @property {Class<isPrimitiveType>} isPrimitiveType
 * @property {Class<typeByName>} typeByName
 * @property {Class<sizeof>} sizeof
 * @property {Class<isType>} isType
 *
 * @property {Class<Type>} Type
 *
 * @property {_Int8} Int8
 * @property {_Int16} Int16
 * @property {_Int32} Int32
 *
 * @property {_Uint8} Uint8
 * @property {_Uint16} Uint16
 * @property {_Uint32} Uint32
 *
 * @property {_Float32} Float32
 *
 * @property {_Void} Void
 */
export const Types = _Types;

export {Heap} from './core/Heap';
export {MemoryBlock} from './core/MemoryBlock';
export {Pointer} from './core/Pointer';

export {ByteString} from './data/types/ByteString';

export {DSBINLoader} from './DSBIN/DSBINLoader';

export {Table} from './data/table/Table';
export {Header} from './data/table/Header';
export {Column} from './data/table/Column';
export {Row} from './data/table/Row';

export {Filter} from './data/filter/Filter';
export {FilterOperation} from './data/filter/FilterOperation';
export {FilterExpressionMode} from './data/filter/FilterExpressionMode';

export {kBinaryTypes, kBinaryTypeMap} from './data/table/Column';
export {tableFromLocalCSV, tableFromRemoteCSV} from './data/loaders/csv';
export {coreCount} from './core/CoreCount';
