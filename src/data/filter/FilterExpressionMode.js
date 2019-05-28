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
 * Enum that represents the different modes in which a filter can be interpreted.
 *
 * Can be "conjunctive normal form" boolean logic:
 * https://en.wikipedia.org/wiki/Conjunctive_normal_form
 * or "disjunctive normal form" boolean logic:
 * https://en.wikipedia.org/wiki/Disjunctive_normal_form
 *
 * @enum
 */
const FilterExpressionMode = {
    /**
     * Short form for conjunctive normal form.
     * Same as `conjunctiveNormalForm`
     */
    CNF: 'cnf',

    /**
     * Long form for conjunctive normal form.
     * Same as `CNF`
     */
    conjunctiveNormalForm: 'cnf',

    /**
     * Short form for disjunctive normal form.
     * Same as `disjunctiveNormalForm`
     */
    DNF: 'dnf',

    /**
     * Long form for disjunctive normal form.
     * Same as `DNF`
     */
    disjunctiveNormalForm: 'dnf',
};

/**
 * @ignore
 */
Object.freeze(FilterExpressionMode);
export {FilterExpressionMode};
