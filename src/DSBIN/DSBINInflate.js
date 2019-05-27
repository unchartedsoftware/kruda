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

import pako from 'pako';
import c from 'pako/lib/zlib/constants';

/**
 * Utility class to inflate zlib compressed ArrayBuffers into a custom ArrayBuffer, could be a SharedArrayBuffer.
 * @class DSBINInflate
 * @param {Uint8Array} outputBuffer - Buffer where the uncompressed data will be written.
 * @param {number=} size - The expected final size of the uncompressed data. Defaults to the full size of `outputBuffer`
 */
export class DSBINInflate extends pako.Inflate {
    constructor(outputBuffer, size = outputBuffer.length) {
        super();
        this.strm.output = outputBuffer;
        this.strm.avail_out = size; // eslint-disable-line
    }

    /**
     * Inflates the `inputBuffer` data into the `outputBuffer` optionally a final `size` can be specified.
     * @param {Uint8Array} inputBuffer - The compressed data.
     * @param {Uint8Array} outputBuffer - Buffer where the uncompressed data will be written.
     * @param {number=} size - The expected final size of the uncompressed data. Defaults to the full size of `outputBuffer`
     * @return {number}
     */
    static inflate(inputBuffer, outputBuffer, size = outputBuffer.length) {
        const instance = new DSBINInflate(outputBuffer, size);
        instance.push(inputBuffer);
        return instance.result;
    }

    /**
     * Method called when decompression is completed.
     * @param {number} status - The status of the system.
     */
    onEnd(status) {
        if (status === c.Z_OK) {
            this.result = this.chunks[0];
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
    }
}
