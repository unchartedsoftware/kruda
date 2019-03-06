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
import {MemoryBlock} from './MemoryBlock';

/**
 * Utility constant for the size of 1KB
 * @type {number}
 */
const kSizeOf1KB = 1024;

/**
 * Utility constant for the size of 1MB
 * @type {number}
 */
const kSizeOf1MB = kSizeOf1KB * 1024;

/**
 * Utility constant for the size of 1GB
 * @type {number}
 */
const kSizeOf1GB = kSizeOf1MB * 1024;

/**
 * Heap's header size
 * @type {number}
 */
const kHeaderSize = 16;

/**
 * Flag used to mark memory blocks ready to be recycled
 * @type {number}
 */
const kFreeFlag = 0x1;

/**
 * Max memory heap size in bytes.
 * ArrayBuffer can allocate up to 2GB (early 2019) but asm.js fails to link to 2GB but succeeds with 2GB - 16MB
 * @type {number}
 */
const kMaxHeapSize = kSizeOf1GB * 2 - kSizeOf1MB * 16;

/**
 * The max allocatable memory size, equal to the max size of the heap minus 4 bytes for padding.
 * @type {number}
 */
const kMaxAllocSize = kMaxHeapSize - 4;


/**
 * Lightweight Heap class used to very naively allocate memory within an ArrayBuffer. Thread safe.
 * Uses a stack approach to memory allocation/deallocation, only when the last memory block in the stack is freed
 * the allocatable memory increases.
 */
export class Heap {
    /**
     * Convenience property that returns the size in bytes of 1KB.
     * @return {number}
     */
    static get sizeOf1KB() {
        return kSizeOf1KB;
    }

    /**
     * Convenience property that returns the size in bytes of 1MB.
     * @return {number}
     */
    static get sizeOf1MB() {
        return kSizeOf1MB;
    }

    /**
     * Convenience property that returns the size in bytes of 1GB.
     * @return {number}
     */
    static get sizeOf1GB() {
        return kSizeOf1GB;
    }

    /**
     * Convenience property that returns the max size of the heap.
     * @return {number}
     */
    static get maxHeapSize() {
        return kMaxHeapSize;
    }

    /**
     * Constructor
     * @param {ArrayBuffer|SharedArrayBuffer|number} buffer - The buffer to use or the size in bytes to allocate.
     */
    constructor(buffer) {
        if (typeof buffer === 'number') {
            /// #if DEBUG
            if (buffer % 4) {
                throw 'ERROR: Heap size must be a multiple of 4';
            }
            if (buffer < kSizeOf1MB * 16) {
                if (buffer <= 1 || (buffer & (buffer - 1))) {
                    throw 'ERROR: Heap size must be a positive power of 2 when < 16MB';
                }
            } else {
                if (buffer % (kSizeOf1MB * 16)) {
                    throw 'ERROR: Heap size must be a multiple of 16MB, when over 16MB';
                }
            }
            /// #endif

            /// #if USE_SHARED_MEMORY
            this.mBuffer = new SharedArrayBuffer(buffer);
            /// #else
            this.mBuffer = new ArrayBuffer(buffer);
            /// #endif

            /**
             * Header structure
             * 0 {byte} - null
             * 1 {byte} - reserved
             * 2 {byte} - reserved
             * 3 {byte} - reserved
             * 4 {Uint32} - alloc offset
             * 8 {Int32} - alloc semaphore
             * 12 {Uint32} - reserved
             */
            this.mDataView = new DataView(this.mBuffer);
            this.mDataView.setUint32(4, kHeaderSize, true);
            this.mDataView.setInt32(8, 0, true);
            this.mDataView.setUint32(12, 0xffffffff, true);
        } else {
            this.mBuffer = buffer;
            this.mDataView = new DataView(this.mBuffer);
        }


        this.mInt32View = new Int32Array(this.mBuffer, 0, 4);
        this.mUint32View = new Uint32Array(this.mBuffer);
    }

    /**
     * The memory buffer managed by this heap.
     * @return {ArrayBuffer|SharedArrayBuffer}
     */
    get buffer() {
        return this.mBuffer;
    }

    /**
     * DataView of the memory buffer.
     * @return {DataView}
     */
    get dataView() {
        return this.mDataView;
    }

    /**
     * The size, in bytes, of this heap.
     * @return {number}
     */
    get size() {
        /// #if DEBUG
        if (!this.mBuffer) {
            throw 'ERROR: Heap buffer not yet initialized';
        }
        /// #endif
        return this.mBuffer.byteLength;
    }

    /**
     * Total memory used.
     * Freeing a memory block doesn not guarantee that this number will increase.
     * @return {number}
     */
    get usedMemory() {
        /// #if USE_SHARED_MEMORY
        return Atomics.load(this.mUint32View, 1);
        /// #else
        return this.mUint32View[1]; // eslint-disable-line
        /// #endif
    }

    /**
     * Total usable memory in the heap.
     * @return {number}
     */
    get freeMemory() {
        return this.mBuffer.byteLength - this.usedMemory;
    }

    /**
     * The memory address that will be assigned to the next allocation.
     * @return {number}
     */
    get allocOffset() {
        /// #if USE_SHARED_MEMORY
        return Atomics.load(this.mUint32View, 1);
        /// #else
        return this.mUint32View[1]; // eslint-disable-line
        /// #endif
    }

    /**
     * Allocates a new memory block.
     * The allocated memory is rounded up to the nearest multiple of 4 and padded by 4 bytes at the end of the block.
     * @param {number} size - The amount of memory, in bytes, to allocate.
     * @return {MemoryBlock}
     */
    malloc(size) {
        /**
         * Memory layout:
         * 4|n {byte} - allocated memory
         * 4|n + 1 {uint32} - allocated memory
         */
        const blockSize = ((size + 3) | 3) + 1;
        /// #if DEBUG
        if (blockSize - 4 > kMaxAllocSize) {
            throw `ERROR: Heap allocations cannot be bigger than ${kMaxAllocSize} bytes`;
        }
        /// #endif

        /// #if USE_SHARED_MEMORY
        let lockState = 1;
        while (lockState) {
            lockState = Atomics.compareExchange(this.mInt32View, 2, 0, 1);
            if (lockState) {
                Atomics.wait(this.mInt32View, 2, 1);
            }
        }
        /// #endif

        /// #if DEBUG
        if (blockSize > this.freeMemory) {
            /// #if USE_SHARED_MEMORY
            Atomics.store(this.mInt32View, 2, 0);
            Atomics.notify(this.mInt32View, 2, 1);
            /// #endif
            throw `ERROR: Not enough memory in the heap to allocate the requested memory size (${size} bytes)`;
        }
        /// #endif

        let address;
        /// #if USE_SHARED_MEMORY
        address = Atomics.add(this.mUint32View, 1, blockSize);
        Atomics.store(this.mInt32View, 2, 0);
        Atomics.notify(this.mInt32View, 2, 1);
        Atomics.store(this.mUint32View, ((address + blockSize) >> 2) - 1, address);
        /// #else
        address = this.mUint32View[1];
        this.mUint32View[1] += blockSize;
        this.mUint32View[((address + blockSize) >> 2) - 1] = address;
        /// #endif

        return new MemoryBlock(this, address, blockSize - 4);
    }

    /**
     * Allocates a new memory block and guarantees that the memory block will be empty.
     * @param {number} size - The amount of memory, in bytes, to allocate.
     * @return {MemoryBlock}
     */
    calloc(size) {
        const memory = this.malloc(size);
        const arr = new Uint32Array(this.mBuffer, memory.address, memory.size >> 2);
        arr.fill(0);
        return memory;
    }

    /**
     * Frees the specified memory block. Memory is not reusable until the memory stack can be reduced by freeing the
     * last allocated memory block.
     * @param {MemoryBlock} memory - The memory block to free.
     */
    free(memory) {
        const paddingAddress = memory.address + memory.size;
        const endAddress = paddingAddress + 4;

        /// #if USE_SHARED_MEMORY
        let lockState = 1;
        while (lockState) {
            lockState = Atomics.compareExchange(this.mInt32View, 2, 0, 1);
            if (lockState) {
                Atomics.wait(this.mInt32View, 2, 1);
            }
        }
        /// #endif

        /// #if DEBUG
        if (this._isMarkedFree(paddingAddress)) {
            throw 'ERROR: Trying to free a memory block that has already been freed';
        }
        /// #endif

        /// #if USE_SHARED_MEMORY
        Atomics.or(this.mUint32View, paddingAddress >> 2, kFreeFlag);
        /// #else
        this.mUint32View[paddingAddress >> 2] |= kFreeFlag;
        /// #endif

        if (this.allocOffset === endAddress) {
            /// #if USE_SHARED_MEMORY
            Atomics.store(this.mUint32View, 1, this._findNewAllocOffset(memory.address));
            /// #else
            this.mUint32View[1] = this._findNewAllocOffset(memory.address);
            /// #endif
        }

        /// #if USE_SHARED_MEMORY
        Atomics.store(this.mInt32View, 2, 0);
        Atomics.notify(this.mInt32View, 2, 1);
        /// #endif

        memory.destroy();
    }

    /**
     * Checks if the padding at the specified offset is marked as free.
     * @param {number} offset - The offset of the memory block padding.
     * @return {number}
     * @private
     */
    _isMarkedFree(offset) {
        /// #if USE_SHARED_MEMORY
        return Atomics.load(this.mUint32View, offset >> 2) & kFreeFlag;
        /// #else
        return this.mUint32View[offset >> 2] & kFreeFlag; // eslint-disable-line
        /// #endif
    }

    /**
     * Reads the value of the padding at the specified offset. Only works with paddings marked as free.
     * @param {number} offset - The offset of the memory block padding.
     * @return {number}
     * @private
     */
    _readPadding(offset) {
        /// #if USE_SHARED_MEMORY
        return Atomics.load(this.mUint32View, offset >> 2) ^ kFreeFlag;
        /// #else
        return this.mUint32View[offset >> 2] ^ kFreeFlag; // eslint-disable-line
        /// #endif
    }

    /**
     * Finds how much memory can be reclaimed by recursively checking all memory blocks that are marked "free" from
     * the tom of the stack.
     * @param {number} offset - Offset of the end of the memory block to check.
     * @return {number}
     * @private
     */
    _findNewAllocOffset(offset) {
        if (offset !== kHeaderSize && this._isMarkedFree(offset - 4)) {
            return this._findNewAllocOffset(this._readPadding(offset - 4));
        }
        return offset;
    }
}
