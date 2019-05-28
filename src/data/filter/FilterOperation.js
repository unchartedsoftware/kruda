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
 * Enum containing the different operations that a filter can perform.
 * @enum
 */
const FilterOperation = {
    /**
     * Indicates that string-based values contains the given value, or that
     * collection-based values contain the given value
     */
    contains: 'contains',

    /**
     * Indicates that string-based values dose not contain the given value, or that
     * collection-based values do not contain the given value
     */
    notContains: 'not_contains',

    /**
     * Indicates that the row value is part of the given array of values
     */
    in: 'in',

    /**
     * Indicates that row value is not in the given array of values
     */
    notIn: 'not_in',

    /**
     * Filters for rows where the target field equals the value
     */
    equal: 'equal',

    /**
     * Filters for rows where the target field is not equal to the value
     */
    notEqual: 'not_equal',

    /**
     * Filters for rows where the value is greater than the given value
     */
    greaterThan: 'greater_than',

    /**
     * Filters for rows where the value is greater than the given value
     */
    greaterThanOrEqual: 'greater_than_or_equal',

    /**
     * Filters for rows where the value is less than the given value
     */
    lessThan: 'less_than',

    /**
     * Filters for rows where the value is less than the given value
     */
    lessThanOrEqual: 'less_than_or_equal',

    /**
     * Filters for rows where the string value starts with the given value
     */
    startsWith: 'starts_with',

    /**
     * Filters for rows where the string value ends with the given value
     */
    endsWith: 'ends_with',
};

/**
 * Object describing a single rule used in a filter.
 * @typedef {Object} FilterRule
 * @property {string} field
 * @property {string|number} value
 * @property {FilterOperation} operation
 */

/**
 * Group of rules used by this filter, it will interpreted either as a conjunction or disjunction, depending on the
 * {@link FilterExpressionMode} used at runtime.
 * @typedef {FilterRule[]} FilterClause
 */

/**
 * A set of clauses that describe a filter. How it will be interpreted depends in the {@link FilterExpressionMode} used
 * at runtime.
 * @typedef {FilterClause[]} FilterExpression
 */

/**
 * @ignore
 */
Object.freeze(FilterOperation);
export {FilterOperation};
