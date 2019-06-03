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

import {FilterProcessor} from './FilterProcessor';

export class FilterWorkerDummy {
    constructor() {
        this.mProcessor = null;
        this.mListeners = new Map();
    }

    on(type, handler) {
        if (!this.mListeners.has(type)) {
            this.mListeners.set(type, []);
        }
        this.mListeners.get(type).push(handler);
    }

    off(type, handler) {
        const handlers = this.mListeners.get(type);
        if (handlers) {
            const i = handlers.indexOf(handler);
            if (i !== -1) {
                handlers.splice(i, 1);
            }
        }
    }

    emit(type, data) {
        const handlers = this.mListeners.get(type);
        if (handlers) {
            const event = {
                type,
                data,
            };
            for (let i = 0; i < handlers.length; ++i) {
                handlers[i](event);
            }
        }
    }

    sendError(reason) {
        this.emit('message', {
            type: 'error',
            reason,
        });
    }

    sendSuccess(data = null, transferable = undefined) {
        this.emit('message', {
            type: 'success',
            data,
        }, transferable);
    }

    postMessage(message) {
        switch (message.type) {
            case 'initialize':
                if (this.mProcessor) {
                    this.sendError('ERROR: Worker is already initialized!');
                } else {
                    this.mProcessor = new FilterProcessor(message.options);
                    this.sendSuccess();
                }
                break;

            case 'processFilters':
                if (this.mProcessor) {
                    this.mProcessor.process(message.options);
                    this.sendSuccess();
                } else {
                    this.sendError('ERROR: Filter.worker has not been initialized');
                }
                break;

            default:
                this.sendError(`ERROR: Unrecognized message type "${message.type}"`);
                break;
        }
    }

    terminate() {
        // do nothing
    }
}
