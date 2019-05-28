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
import {MemoryBlock} from './MemoryBlock';
import {Atomize} from './Atomize';

/**
 * Utility constant for the size of 1KB
 * @type {number}
 * @private
 */
const kSizeOf1KB = 1024;

/**
 * Utility constant for the size of 1MB
 * @type {number}
 * @private
 */
const kSizeOf1MB = kSizeOf1KB * 1024;

/**
 * Utility constant for the size of 1GB
 * @type {number}
 * @private
 */
const kSizeOf1GB = kSizeOf1MB * 1024;

/**
 * Heap's header size
 * @type {number}
 * @private
 */
const kHeaderSize = 16;

/**
 * Flag used to mark memory blocks ready to be recycled
 * @type {number}
 * @private
 */
const kFreeFlag = 0x1;

/**
 * Max memory heap size in bytes.
 * ArrayBuffer can allocate up to 2GB (early 2019) but asm.js fails to link to 2GB but succeeds with 2GB - 16MB
 * @type {number}
 * @private
 */
const kMaxHeapSize = kSizeOf1GB * 2 - kSizeOf1MB * 16;

/**
 * The max allocatable memory size, equal to the max size of the heap minus 4 bytes for padding.
 * @type {number}
 * @private
 */
const kMaxAllocSize = kMaxHeapSize - 4;


/**
 * Lightweight Heap class used to very naively allocate memory within an ArrayBuffer. Thread safe.
 * Uses a stack approach to memory allocation/deallocation, only when the last memory block in the stack is freed
 * the allocatable memory increases.
 * @class Heap
 * @param {ArrayBuffer|SharedArrayBuffer|number} buffer - The buffer to use or the size in bytes to allocate.
 */
export class Heap {
    constructor(buffer) {
        if (typeof buffer === 'number') {
            /// #if !_DEBUG
            /*
            /// #endif
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
            /// #if !_DEBUG
             */
            /// #endif

            if (typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined') {
                this.mBuffer = new SharedArrayBuffer(buffer);
                this.mShared = true;
            } else {
                this.mBuffer = new ArrayBuffer(buffer);
                this.mShared = false;
            }

            /*
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
            this.mShared = !(buffer instanceof ArrayBuffer);
            this.mDataView = new DataView(this.mBuffer);
        }


        this.mInt32View = new Int32Array(this.mBuffer, 0, 4);
        this.mUint32View = new Uint32Array(this.mBuffer);

        this.mMemoryBlocks = [];
    }

    /**
     * Convenience property that returns the size in bytes of 1KB.
     * @type {number}
     */
    static get sizeOf1KB() {
        return kSizeOf1KB;
    }

    /**
     * Convenience property that returns the size in bytes of 1MB.
     * @type {number}
     */
    static get sizeOf1MB() {
        return kSizeOf1MB;
    }

    /**
     * Convenience property that returns the size in bytes of 1GB.
     * @type {number}
     */
    static get sizeOf1GB() {
        return kSizeOf1GB;
    }

    /**
     * Convenience property that returns the max size of the heap.
     * @type {number}
     */
    static get maxHeapSize() {
        return kMaxHeapSize;
    }

    /**
     * Convenience property that return the max usable size of a heap allocated with the max heap size.
     * @type {number}
     */
    static get maxAllocSize() {
        return kMaxAllocSize;
    }

    /**
     * The memory buffer managed by this heap.
     * @type {ArrayBuffer|SharedArrayBuffer}
     */
    get buffer() {
        return this.mBuffer;
    }

    /**
     * Is the buffer in this heap an instance of SharedArrayBuffer
     * @type {boolean}
     */
    get shared() {
        return this.mShared;
    }

    /**
     * DataView of the memory buffer.
     * @type {DataView}
     */
    get dataView() {
        return this.mDataView;
    }

    /**
     * The size, in bytes, of this heap.
     * @type {number}
     */
    get size() {
        /// #if !_DEBUG
        /*
        /// #endif
        if (!this.mBuffer) {
            throw 'ERROR: Heap buffer not yet initialized';
        }
        /// #if !_DEBUG
         */
        /// #endif
        return this.mBuffer.byteLength;
    }

    /**
     * Total memory used.
     * Freeing a memory block doesn not guarantee that this number will increase.
     * @type {number}
     */
    get usedMemory() {
        return Atomize.load(this.mUint32View, 1);
    }

    /**
     * Total usable memory in the heap.
     * @type {number}
     */
    get freeMemory() {
        return this.mBuffer.byteLength - this.usedMemory;
    }

    /**
     * The memory address that will be assigned to the next allocation.
     * @type {number}
     */
    get allocOffset() {
        return Atomize.load(this.mUint32View, 1);
    }

    /**
     * Allocates a new memory block.
     * The allocated memory is rounded up to the nearest multiple of 4 and padded by 4 bytes at the end of the block.
     * @param {number} size - The amount of memory, in bytes, to allocate.
     * @return {MemoryBlock}
     */
    malloc(size) {
        /*
         * Memory layout:
         * 4|n {byte} - allocated memory
         * 4|n + 1 {uint32} - allocated memory
         */
        const blockSize = ((size + 3) | 3) + 1;
        /// #if !_DEBUG
        /*
        /// #endif
        if (blockSize - 4 > kMaxAllocSize) {
            throw `ERROR: Heap allocations cannot be bigger than ${kMaxAllocSize} bytes`;
        }
        /// #if !_DEBUG
         */
        /// #endif

        let lockState = 1;
        while (lockState) {
            lockState = Atomize.compareExchange(this.mInt32View, 2, 0, 1);
            if (lockState) {
                Atomize.wait(this.mInt32View, 2, 1);
            }
        }

        /// #if !_DEBUG
        /*
        /// #endif
        if (blockSize > this.freeMemory) {
            Atomize.store(this.mInt32View, 2, 0);
            Atomize.notify(this.mInt32View, 2, 1);
            throw `ERROR: Not enough memory in the heap to allocate the requested memory size (${size} bytes)`;
        }
        /// #if !_DEBUG
         */
        /// #endif

        let address;
        address = Atomize.add(this.mUint32View, 1, blockSize);
        Atomize.store(this.mUint32View, ((address + blockSize) >> 2) - 1, address);

        Atomize.store(this.mInt32View, 2, 0);
        Atomize.notify(this.mInt32View, 2, 1);

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

        let lockState = 1;
        while (lockState) {
            lockState = Atomize.compareExchange(this.mInt32View, 2, 0, 1);
            if (lockState) {
                Atomize.wait(this.mInt32View, 2, 1);
            }
        }

        /// #if !_DEBUG
        /*
        /// #endif
        if (this._isMarkedFree(paddingAddress)) {
            throw 'ERROR: Trying to free a memory block that has already been freed';
        }
        /// #if !_DEBUG
         */
        /// #endif

        Atomize.or(this.mUint32View, paddingAddress >> 2, kFreeFlag);

        if (this.allocOffset === endAddress) {
            Atomize.store(this.mUint32View, 1, this._findNewAllocOffset(memory.address));
        }

        Atomize.store(this.mInt32View, 2, 0);
        Atomize.notify(this.mInt32View, 2, 1);

        memory._destroy();
    }

    /**
     * Shrinks the specified memory block to the specified size.
     * @param {MemoryBlock} memory - The memory block to shrink.
     * @param {number} size - The new memory size for the block, must be smaller than the its current size.
     */
    shrink(memory, size) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (size >= memory.size) {
            throw 'ERROR: The new memory size must be smaller than the current size';
        }
        /// #if !_DEBUG
         */
        /// #endif

        const paddingAddress = memory.address + memory.size;
        const newSize = ((size + 3) | 3) + 1;
        const endAddress = paddingAddress + 4;

        if (newSize < memory.size) {
            let lockState = 1;
            while (lockState) {
                lockState = Atomize.compareExchange(this.mInt32View, 2, 0, 1);
                if (lockState) {
                    Atomize.wait(this.mInt32View, 2, 1);
                }
            }

            /// #if !_DEBUG
            /*
            /// #endif
            if (this._isMarkedFree(paddingAddress)) {
                throw 'ERROR: Trying to shrink a memory block that has already been freed';
            }
            /// #if !_DEBUG
             */
            /// #endif

            Atomize.store(this.mUint32View, ((memory.address + newSize) >> 2) - 1, memory.address);
            Atomize.store(this.mUint32View, paddingAddress >> 2, memory.address + newSize);
            Atomize.or(this.mUint32View, paddingAddress >> 2, kFreeFlag);

            memory._setSize(size);

            if (this.allocOffset === endAddress) {
                Atomize.store(this.mUint32View, 1, this._findNewAllocOffset(memory.address));
            }

            Atomize.store(this.mInt32View, 2, 0);
            Atomize.notify(this.mInt32View, 2, 1);
        }
    }

    /**
     * Checks if the padding at the specified offset is marked as free.
     * @param {number} offset - The offset of the memory block padding.
     * @return {number}
     * @private
     */
    _isMarkedFree(offset) {
        return Atomize.load(this.mUint32View, offset >> 2) & kFreeFlag;
    }

    /**
     * Reads the value of the padding at the specified offset. Only works with paddings marked as free.
     * @param {number} offset - The offset of the memory block padding.
     * @return {number}
     * @private
     */
    _readPadding(offset) {
        return Atomize.load(this.mUint32View, offset >> 2) ^ kFreeFlag;
    }

    /**
     * Finds how much memory can be reclaimed by recursively checking all memory blocks that are marked "free" from
     * the top of the stack.
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

    /**
     * Restores the underlying buffer used by this heap, useful when SharedArrayBuffer is not available and the memory
     * needs to be passed among threads.
     * @param {ArrayBuffer|SharedArrayBuffer} buffer - The buffer to restore.
     * @private
     */
    _restoreBuffer(buffer) {
        this.mBuffer = buffer;
        this.mShared = !(buffer instanceof ArrayBuffer);
        this.mDataView = new DataView(this.mBuffer);
        this.mInt32View = new Int32Array(this.mBuffer, 0, 4);
        this.mUint32View = new Uint32Array(this.mBuffer);

        for (let i = 0, n = this.mMemoryBlocks.length; i < n; ++i) {
            this.mMemoryBlocks[i]._setSize(this.mMemoryBlocks[i].size);
        }
    }

    /**
     * Registers a memory block so its memory can be properly managed by this heap. Useful when the system kruda is
     * running on does not support SharedArrayBuffer or Atomics.
     * @param {MemoryBlock} memory - The memory block to register
     * @private
     */
    _registerMemoryBlock(memory) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mMemoryBlocks.indexOf(memory) !== -1) {
            throw 'ERROR: Cannot register memory block twice';
        }

        if (memory.heap !== this) {
            throw 'ERROR: Memory blocks can only be registered with the Heap that owns them';
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.mMemoryBlocks.push(memory);
    }

    /**
     * Unregisters a memory block so its memory stops being managed by this heap. Useful when the system kruda is
     * running on does not support SharedArrayBuffer or Atomics.
     * @param {MemoryBlock} memory - The memory block to unregister.
     * @private
     */
    _unregisterMemoryBlock(memory) {
        /// #if !_DEBUG
        /*
        /// #endif
        if (this.mMemoryBlocks.indexOf(memory) === -1) {
            throw 'ERROR: Trying to unregister an unknown memory block';
        }

        if (memory.heap !== this) {
            throw 'ERROR: Memory blocks can only be unregistered from the Heap that owns them';
        }
        /// #if !_DEBUG
         */
        /// #endif
        this.mMemoryBlocks.splice(this.mMemoryBlocks.indexOf(memory), 1);
    }
}
