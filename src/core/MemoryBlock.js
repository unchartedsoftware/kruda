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

/**
 * Class to encapsulate an ArrayBuffer with utility views to read/write data.
 * @class MemoryBlock
 */
export class MemoryBlock {
    constructor(heap, address, size) {
        this.mHeap = heap;
        this.mOffset = address;
        this.mSize = size;
        this.mDataView = new DataView(this.mHeap.buffer, this.mOffset, this.mSize);
        this.mFloat32View = new Float32Array(this.mHeap.buffer, this.mOffset, this.mSize >> 2);
    }

    get address() {
        return this.mOffset;
    }

    get heap() {
        return this.mHeap;
    }

    get buffer() {
        return this.mHeap.buffer;
    }

    get size() {
        return this.mSize;
    }

    get dataView() {
        return this.mDataView;
    }

    get float32View() {
        return this.mFloat32View;
    }

    free() {
        this.mHeap.free(this);
    }

    destroy() {
        this.mHeap = null;
        this.mOffset = -1;
        this.mSize = 0;
        this.mDataView = null;
    }
}
