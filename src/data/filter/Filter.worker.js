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
import {FilterProcessor} from './FilterProcessor';

/**
 * Variable that holds a FilterProcessor instance for each thread.
 * IMPORTANT: It is understood that in packaged (using WebPack) JavaScript, global means that a variable
 * @type {FilterProcessor|null}
 * @global
 */
let gProcessor = null;

/**
 * Sends an error signal back to this worker's "owner"
 * @param {string} reason - The reason for this error to be triggered
 */
function sendError(reason) {
    global.postMessage({
        type: 'error',
        reason,
    });
}

/**
 * Sends a success signal to this worker's "owner"
 * @param {*=} data - Data to be sent with the message. Defaults to `null`
 */
function sendSuccess(data = null) {
    global.postMessage({
        type: 'success',
        data,
    });
}

/**
 * Message event handler for messages sent from this worker's  "owner"
 * @param {Event} e - The event containing the message.
 */
global.onmessage = function filterWorkerOnMessage(e) {
    const message = e.data;
    switch (message.type) {
        case 'initialize':
            if (gProcessor) {
                sendError('ERROR: Worker is already initialized!');
            } else {
                gProcessor = new FilterProcessor(message);
            }
            break;

        case 'processFilters':
            if (gProcessor) {
                gProcessor.process(message);
                sendSuccess();
            } else {
                sendError('ERROR: Filter.worker has not been initialized');
            }
            break;

        default:
            sendError(`ERROR: Unrecognized message type "${message.type}"`);
            break;
    }
};
