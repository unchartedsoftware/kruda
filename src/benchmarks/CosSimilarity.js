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
import {Pointer} from '../core/Pointer';

export class Binary {
    constructor(table, result) {
        this.mTable = table;
        this.mResult = result;
    }

    benchmark() {
        const row = this.mTable.getBinaryRow(0);
        const rowCount = this.mTable.rowCount;
        const rowFloats = 128 * 4;
        const pointer = row.pointer;
        const target = Pointer.copy(row.pointer);

        const resultView = this.mResult.dataView;

        let n = 0;
        let dot = 0.0;
        let lengthA = 0.0;
        let lengthB = 0.0;
        let val = 0.0;

        for (let i = 0; i < rowFloats; i += 4) {
            lengthA = lengthA + target.getFloat32(i) * target.getFloat32(i);
        }

        for (let i = 0; i < rowCount; ++i) {
            row.index = i;
            dot = 0;
            lengthB = 0;
            for (let ii = 0; ii < rowFloats; ii += 4) {
                val = pointer.getFloat32(ii);
                dot = dot + target.getFloat32(ii) * val;
                lengthB = lengthB + val * val;
            }

            resultView.setFloat32(n, dot / Math.sqrt(lengthA * lengthB), true);
            n += 4;
        }
    }
}

export class ASM {
    constructor(table, result) {
        this.mTable = table;
        this.mResult = result;
        this.mASM = this._cosSimialrityASM(window, null, this.mTable.memory.buffer);
    }

    benchmark() {
        const row = this.mTable.getBinaryRow(0);
        this.mASM.compute(
            this.mTable.memory.address + row.pointer.address,
            row.size,
            128 * 4,
            this.mTable.rowCount * row.size,
            this.mResult.address
        );
    }

    /* eslint-disable */
    _cosSimialrityASM(stdlib, foreign, buffer) {
        'use asm';
        var fround = stdlib.Math.fround;
        var sqrt = stdlib.Math.sqrt;
        var view = new stdlib.Float32Array(buffer);

        function compute(offset, rowLength, floatLength, dataLength, resultOffset) {
            offset = offset|0;
            rowLength = rowLength|0;
            floatLength = floatLength|0;
            dataLength = dataLength|0;
            resultOffset = resultOffset|0;

            var dot = fround(0);
            var lengthA = fround(0);
            var lengthB = fround(0);
            var val = fround(0);
            var i = 0;
            var ii = 0;
            var n = 0;

            for (; (i|0) < (floatLength|0); i = (i + 4)|0) {
                lengthA = fround(lengthA + fround(view[(offset + i)>>2] * view[(offset + i)>>2]));
            }

            for (i = 0; (i|0) < (dataLength|0); i = (i + rowLength)|0) {
                dot = fround(0);
                lengthB = fround(0);
                for (ii = 0; (ii|0) < (floatLength|0); ii = (ii + 4)|0) {
                    val = fround(view[(offset + i + ii)>>2]);
                    dot = fround(dot + fround(view[(offset + ii)>>2] * val));
                    lengthB = fround(lengthB + fround(val * val));
                }
                view[(resultOffset + n)>>2] = fround(dot / fround(sqrt(fround(lengthA * lengthB))));
                n = (n + 4)|0;
            }
        }
        return { compute: compute };
    }
    /* eslint-enable */
}

export class WASM {
    // to be done
}
