import {Heap} from '../core/Heap';
import {MemoryBlock} from '../core/MemoryBlock';
import {Table} from '../data/table/Table';

/* ---- ---- ---- ---- */
/**
 * @typedef HeapSerialized
 * @type {Object}
 * @property {ArrayBuffer} buffer
 */

/**
 * Utility function to serialize a heap to be sent to another thread.
 * @param {Heap} heap - Heap to serialize
 * @returns {HeapSerialized}
 */
export function serializeHeap(heap) {
    return {
        buffer: heap.buffer,
    };
}

/**
 * Utility function to deserialize a heap
 * @param {HeapSerialized} descriptor - Description to deserialize
 * @returns {Heap}
 */
export function deserializeHeap(descriptor) {
    return new Heap(descriptor.buffer);
}


/* ---- ---- ---- ---- */
/**
 * @typedef MemoryBlockSerialized
 * @type {Object}
 * @property {HeapSerialized} heap
 * @property {number} address
 * @property {number} size
 */

/**
 * Utility function to serialize a memory block to be sent to another thread.
 * @param {MemoryBlock} memory - The memory block to serialize
 * @returns {MemoryBlockSerialized}
 */
export function serializeMemoryBlock(memory) {
    return {
        heap: serializeHeap(memory.heap),
        address: memory.address,
        size: memory.size,
    };
}

/**
 * Utility function to deserialize a memory block
 * @param {MemoryBlockSerialized} descriptor - Description of the memory block to deserialize.
 * @returns {MemoryBlock}
 */
export function deserializeMemoryBlock(descriptor) {
    const heap = deserializeHeap(descriptor.heap);
    return new MemoryBlock(heap, descriptor.address, descriptor.size);
}


/* ---- ---- ---- ---- */
/**
 * @typedef TableSerialized
 * @type {Object}
 * @property {MemoryBlockSerialized} memory
 */

/**
 * Utility function to serialize a table to be sent to another thread.
 * @param {Table} table - Heap to serialize
 * @returns {TableSerialized}
 */
export function serializeTable(table) {
    return {
        memory: serializeMemoryBlock(table.memory),
    };
}

/**
 * Utility function to deserialize a table
 * @param {TableSerialized} descriptor - Description to deserialize
 * @returns {Table}
 */
export function deserializeTable(descriptor) {
    return new Table(deserializeMemoryBlock(descriptor.memory));
}
