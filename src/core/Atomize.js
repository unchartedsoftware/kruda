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

/**
 * @typedef {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray} IntTypedArray
 */

/**
 * Simple wrapper to provide atomics-like functionality in systems that lack the functionality.
 * @type {Atomics|AtomicsLike}
 */
export const Atomize = (function() {
    if (typeof Atomics !== 'undefined') {
        return Atomics;
    }

    /**
     * Simple stubbing for Atomics.
     * WARNING: Does not implement any kind of synchronization.
     * @class AtomicsLike
     */
    class AtomicsLike {
        /**
         * Adds a given value at a given position in the array and returns the old value at that position
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} value - The value to use while performing the operation.
         * @return {number}
         */
        add(typedArray, index, value) {
            const ret = typedArray[index];
            typedArray[index] += value;
            return ret;
        }

        /**
         * Computes a bitwise AND with a given value at a given position in the array, and returns the old value at
         * that position.
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} value - The value to use while performing the operation.
         * @return {number}
         */
        and(typedArray, index, value) {
            const ret = typedArray[index];
            typedArray[index] &= value;
            return ret;
        }

        /**
         * Exchanges a given replacement value at a given position in the array, if a given expected value equals the
         * old value. It returns the old value at that position whether it was equal to the expected value or not
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} expectedValue - The value to check for equality.
         * @param {number} replacementValue - The number to exchange.
         * @return {number}
         */
        compareExchange(typedArray, index, expectedValue, replacementValue) {
            const ret = typedArray[index];
            if (typedArray[index] === expectedValue) {
                typedArray[index] = replacementValue;
            }
            return ret;
        }

        /**
         * Stores a given value at a given position in the array and returns the old value at that position.
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} value - The value to use while performing the operation.
         * @return {number}
         */
        exchange(typedArray, index, value) {
            const ret = typedArray[index];
            typedArray[index] = value;
            return ret;
        }

        /**
         * The static Atomics.isLockFree() method is used to determine whether to use locks or atomic operations.
         * It returns true, if the given size is one of the BYTES_PER_ELEMENT property of integer TypedArray types.
         * @param {number} size - The size in bytes to check.
         * @return {boolean}
         */
        isLockFree(size) {
            return size === 1 || size === 2 || size === 4;
        }

        /**
         * Returns a value at a given position in the array.
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @return {number}
         */
        load(typedArray, index) {
            return typedArray[index];
        }

        /**
         * Notifies up some agents that are sleeping in the wait queue.
         * WARNING: NOT SUPPORTED IN SYSTEMS WITHOUT Atomics.
         * @param {Int32Array} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} count - The number of threads to be notified.
         * @return {number}
         */
        notify(typedArray, index, count) {
            // NOT SUPPORTED
            return count;
        }

        /**
         * Computes a bitwise OR with a given value at a given position in the array, and returns the old value at that
         * position.
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} value - The value to use while performing the operation.
         * @return {number}
         */
        or(typedArray, index, value) {
            const ret = typedArray[index];
            typedArray[index] |= value;
            return ret;
        }

        /**
         * Stores a given value at the given position in the array and returns that value.
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} value - The value to use while performing the operation.
         * @return {number}
         */
        store(typedArray, index, value) {
            typedArray[index] = value;
            return value;
        }

        /**
         * Substracts a given value at a given position in the array and returns the old value at that position.
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} value - The value to use while performing the operation.
         * @return {number}
         */
        sub(typedArray, index, value) {
            const ret = typedArray[index];
            typedArray[index] -= value;
            return ret;
        }

        /**
         * Verifies that a given position in an Int32Array still contains a given value and if so sleeps, awaiting a
         * wakeup or a timeout. It returns a string which is either "ok", "not-equal", or "timed-out".
         * WARNING: NOT SUPPORTED IN SYSTEMS WITHOUT Atomics.
         * @param {Int32Array} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} value - The value to use while performing the operation.
         * @param {number} timeout - Time, in milliseconds, to wait before the operation times out.
         * @return {string}
         */
        wait(typedArray, index, value, timeout = Infinity) { // eslint-disable-line
            // NOT SUPPORTED
            return 'ok';
        }

        /**
         * Computes a bitwise XOR with a given value at a given position in the array, and returns the old value at
         * that position.
         * @param {IntTypedArray} typedArray - The typed array instance where the operation will be performed.
         * @param {number} index - The index at which the operation will be performed.
         * @param {number} value - The value to use while performing the operation.
         * @return {number}
         */
        xor(typedArray, index, value) {
            const ret = typedArray[index];
            typedArray[index] ^= value;
            return ret;
        }
    }

    return new AtomicsLike();
})();
