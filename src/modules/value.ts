/*
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

/**
 * Parse values.  These may be single or multi-dimensional and either static or animated
 */
import {ShapeKeyframed} from '../lottie/props/shapeKeyframed';
import {logs} from './logs';
import {ValidateException} from './validate';

function Resources() {
    type ResourceResult = {
        clean: Function;
        get: Function;
        makeSingleValue: Function;
        makeMultipleValues: Function;
        makePath: Function;
    };

    function asValue(x) {
        if (x instanceof Value) {
            return x;
        }

        if (typeof x === 'number') {
            return new Value(x);
        }

        throw new Error('Invalid argument' + x);
    }

    function expectValue(x) {
        if (typeof x === 'number') {
            return x;
        }
        if (x instanceof Value) {
            return x.v();
        }

        throw new Error('Invalid argument' + x);
    }

    function isNumber(x) {
        return typeof x === 'number' || (x instanceof Value && x.isNumber());
    }

    function asNumber(x) {
        if (typeof x === 'number') {
            return x;
        }
        if (x instanceof Value && x.isNumber()) {
            return x.asNumber();
        }

        throw new Error('Invalid number' + x);
    }

    /**
     * Returns a comma-separated list of values suitable for including into a pcurve.
     */
    function makeList(z) {
        if (Array.isArray(z)) {
            return z
                .map((x) => (Number.isInteger(x) ? x : x.toFixed(3)))
                .join();
        }

        if (typeof z === 'number') {
            return Number.isInteger(z) ? z : z.toFixed(3);
        }

        throw new Error('Invalid list ' + z);
    }

    /**
     * This class holds a single "value" (originally from Adobe After Effects).  The value may be a constant
     * number or it may be a string expression that should be evaluated in the data binding context.  The
     * string expression is how we store an easing curve to show interpolated values.
     *
     * We support standard arithmetic operations on values: addition, subtraction, multiplication, and division.
     * These methods construct a new value object with the appropriate operations.
     *
     * To make it a little more complicated, we also may store derivatives of the values.  These are
     * used to calculate auto-orientation rotations.  The derivative of a number is zero.
     */
    class Value {
        /**
         * Three possible approaches:
         *
         * 1. Value(value)  => copies the values from the passed Value
         * 2. Value(number) => Sets the internal value to number and the derivative to 0
         * 3. Value(number, number) => Sets the internal value and derivative expression
         *
         * Internally we store the value in '_v' and the derivative in '_dv'.
         * If '_v' is a number, '_dv' is 0.
         * If '_dv' is a string, '_dv' is a string.
         *
         * We may find ourselves in a position where we can't create a derivative.
         * In that case we keep '_dv' as a string, but set it to the empty string.
         */

        _v: number | string;
        _dv: number | string;

        constructor(v, dv?) {
            if (v instanceof Value) {
                this._v = v._v;
                this._dv = v._dv;
            } else if (typeof v === 'string') {
                this._v = v;
                this._dv = dv || '';
            } else if (typeof v === 'number') {
                this._v = v;
                this._dv = 0;
            } else {
                throw new Error('Cannot construct Value from ' + v);
            }
        }

        toString() {
            return `Value<${this._v} ${this._dv}>`;
        }

        toJSON() {
            return `Value<${this._v} ${this._dv}>`;
        }

        isNumber() {
            return typeof this._v === 'number';
        }

        asNumber() {
            if (this.isNumber()) {
                return this._v;
            } else {
                throw new Error('Value is not a number');
            }
        }

        v() {
            return Number(this._v);
        }

        dv() {
            if (this._dv === '') {
                throw new Error('Derivative is invalid');
            }
            return this._dv;
        }

        embed() {
            return this.isNumber() ? this._v : '${' + this._v + '}';
        }

        embedDV() {
            if (this._dv === '') {
                throw new Error('Derivative is invalid');
            }
            return this.isNumber() ? 0 : '${' + this._dv + '}';
        }

        equals(x) {
            return this._v === x;
        }

        negate() {
            if (this.isNumber()) {
                return new Value(-this._v);
            }
            if (this._dv === '') {
                return new Value(`(-${this._v})`, '');
            }
            return new Value(`(-${this._v})`, `(-${this._dv})`);
        }

        _combine(other, op) {
            let { _v, _dv } = other;
            // handle negative subtraction
            if (op === '-' && _v < 0 && this._v != 0) {
                _v = Math.abs(Number(_v))
                op = '+'
            }

            let v = `(${this._v}${op}${_v})`;
            let dv =
                this._dv === '' || _dv === ''
                    ? ''
                    : `(${this._dv}${op}${_dv})`;
            return new Value(v, dv);
        }

        multiply(x) {
            let other = asValue(x);

            if (this._v === 0 || other._v === 0) {
                return new Value(0);
            }
            if (this._v === 1) {
                return other;
            }
            if (other._v === 1) {
                return new Value(this);
            }

            if (this.isNumber() && other.isNumber()) {
                return new Value(this.v() * other.v());
            }

            return this._combine(other, '*');
        }

        divide(x) {
            let other = asValue(x);

            if (other._v === 0) {
                throw new Error('Unable to divide by zero');
            }

            if (this._v === 0) {
                return new Value(0);
            }
            if (other._v === 1) {
                return new Value(this);
            }

            if (this.isNumber() && other.isNumber()) {
                return new Value(this.v() / other.v());
            }

            return this._combine(other, '/');
        }

        add(x) {
            let other = asValue(x);

            if (this._v === 0) {
                return other;
            }
            if (other._v === 0) {
                return new Value(this);
            }

            if (this.isNumber() && other.isNumber()) {
                return new Value(this.v() + other.v());
            }

            return this._combine(other, '+');
        }

        subtract(x) {
            let other = asValue(x);

            if (this._v === 0) {
                return other.negate();
            }
            if (other._v === 0) {
                return new Value(this);
            }

            if (this.isNumber() && other.isNumber()) {
                return new Value(this.v() - other.v());
            }
 
            return this._combine(other, '-');
        }

        // Wrap in another function.  Note that there is no way to extract derivatives from this...
        wrap(fname, factual, ...args) {
            if (this.isNumber() && args.every(isNumber)) {
                let argList = args.map(asNumber);
                argList.unshift(this.v());
                return new Value(factual.apply(null, argList));
            } else {
                let cmd = fname + '(' + this._v;
                for (let i = 0; i < args.length; i++) {
                    cmd += ',' + expectValue(args[i]);
                }
                cmd += ')';
                return new Value(cmd);
            }
        }
    }

    /**
     * Convert keyframe to easing function. Don't use this for animating points in a PATH
     *
     * const OFFSET_KEYFRAME_MAP = {
     *          s: '_startValue',
     *          e: '_endValue',  --- Optional.  If omitted, look at next item
     *          t: '_startTime',
     *          i: '_inValue',
     *          o: '_outValue',
     *          ti: '_inTangent',  --- If defined, use this over "i" and "o"
     *          to: '_outTangent'
     *      }
     */
    function keyFramesToEasing(values, dof, index, direction?) {

        // Helper function.  Sometimes when we look up a value we get just a number, sometimes
        // an array of length 1 and sometimes an array of a long enough length that the index can
        // be used to retrieve the value.
        function f(z) {
            if (typeof z === 'undefined') {
                console.warn('What? ', z);
                console.trace();
            }
            let result = Array.isArray(z)
                ? z.length > index
                    ? z[index]
                    : z[0]
                : z;
            if (typeof result === 'undefined') {
                console.warn(
                    'Looking up a value that is undefined',
                    z,
                    values,
                    'dof=' + dof,
                    'index=' + index
                );
            }
            return result;
        }

        // Check if all values are the same.  If they are, return just the constant value.
        let startValue = values[0].s[index];
        if (
            values.every(
                (x) => x.hasOwnProperty('s') && x.s[index] == startValue
            )
        ) {
            return new Value(startValue);
        }

        let easing = '';
        let lastValue = startValue;

        // PCurve easing
        if (values[0].hasOwnProperty('ti')) {
            easing = `spatial(${dof},${index}) `;
            values.forEach((x, i) => {
                let start = x.hasOwnProperty('s') ? makeList(x.s) : lastValue;
                if (i + 1 == values.length) {
                    easing += `send(${x.t},${start})`;
                } else {
                    // time, dof, index, start+, tout+, tin+, a, b, c, d
                    let tout = makeList(x.to);
                    let tin = makeList(x.ti);
                    easing += `scurve(${x.t},${start},${tout},${tin},${f(
                        x.o?.x
                    )},${f(x.o?.y)},${f(x.i?.x)},${f(x.i?.y)}) `;
                }

                lastValue = x.hasOwnProperty('e') ? makeList(x.e) : start;
            });
        } else {
            // Curve easing
            values.forEach((x, i) => {
                let v = x.hasOwnProperty('s') ? f(x.s) : lastValue;
                if (i + 1 == values.length) {
                    if (direction === -1)
                        easing += `end(${x.t},${v * direction})`;
                    else easing += `end(${x.t},${v})`;
                } else if (x.hasOwnProperty('i')) {
                    // Has in and out points
                    easing += `curve(${x.t},${v},${f(x.o.x)},${f(x.o.y)},${f(
                        x.i.x
                    )},${f(x.i.y)}) `;
                } else {
                    easing += `line(${x.t},${v}) `;
                }
                lastValue = x.hasOwnProperty('e') ? f(x.e) : v;
            });
        }

        let name = addEasing(easing);
        return new Value(`${name}(frame)`, `(${name}(frame+1)-${name}(frame))`);
    }

    const K_POINT_INTERNAL = {
        type: 'array',
        required: true,
        item: {
            type: 'array',
            required: true,
            item: {
                type: 'number',
                required: true
            },
            count: 2
        },
        storeSize: '_pointCount' // This ensures the number of internal points is correct
    };

    const K_POINT_SE = {
        // Start/end point
        type: 'array',
        required: false,
        count: 1,
        item: {
            type: 'object',
            required: true,
            properties: {
                i: K_POINT_INTERNAL,
                o: K_POINT_INTERNAL,
                v: K_POINT_INTERNAL,
                c: {
                    type: 'boolean',
                    required: true,
                    storeValue: '_connected'
                }
            }
        }
    };

    /**
     * Given an array of key frames where each stop....
     */
    function keyFramePointsToEasing(values: any, term: string, count: number) {
        // The time array is common across all points
        let tArray = values.map((x) => x.t);

        // The in and out-point arrays are common across all points except the last
        let subValues = values.slice(0, -1); // Drop the last value
        let ixArray = subValues.map((x) => x.i.x);
        let iyArray = subValues.map((x) => x.i.y);
        let oxArray = subValues.map((x) => x.o.x);
        let oyArray = subValues.map((x) => x.o.y);

        // Helper function to take an array of input values and calculate an easing curve
        function connectDots(s) {
            if (s.every((x) => x == s[0])) {
                // Constant value
                return new Value(s[0]);
            }

            let easing = '';
            s.forEach((x1, i) => {
                if (i + 1 == s.length) {
                    easing += `end(${tArray[i]},${x1})`;
                } else if (
                    ixArray[i] == iyArray[i] &&
                    oxArray[i] == oyArray[i]
                ) {
                    easing += `line(${tArray[i]},${x1}) `;
                } else {
                    easing += `curve(${tArray[i]},${x1},${oxArray[i]},${oyArray[i]},${ixArray[i]},${iyArray[i]}) `;
                }
            });
            let name = addEasing(easing);

            return new Value(
                `${name}(frame)`,
                `(${name}(frame+1)-${name}(frame))`
            );
        }

        // For each pair we will calculate an easing function
        return [...Array(count)].map((_, index) => {
            let sx = values.map((x, i) =>
                x.hasOwnProperty('s')
                    ? x.s[0][term][index][0]
                    : values[i - 1].e[0][term][index][0]
            );
            let sy = values.map((x, i) =>
                x.hasOwnProperty('s')
                    ? x.s[0][term][index][1]
                    : values[i - 1].e[0][term][index][1]
            );

            return [connectDots(sx), connectDots(sy)];
        });
    }

    /**
     * Reads a single BodyMovin-style value and returns a Value object.
     * Use this for opacity or rotation
     * @param data
     * @param direction
     */
    function makeSingleValue(data, direction?) {
        if (!data.a) {
            return new Value(data.k);
        }
        return keyFramesToEasing(data.k, 1, 0, direction);
    }

    /**
     * Reads a single BodyMovin value which contains multiple child values and
     * returns an array of Value objects
     */
    function makeMultipleValues(data) {
        if (!data.k) {
            console.trace();
            return {};
        }

        if (!data.a) {
            return data.k.map((x) => new Value(x));
        }

        let dof = data.k[0].s.length;
        let result = [];
        for (let i = 0; i < dof; i++) {
            result.push(keyFramesToEasing(data.k, dof, i));
        }
        return result;
    }

    /**
     * Internal function that takes an object and converts all numbers into Values
     */
    function convertToValues(obj) {
        if (typeof obj === 'number') {
            return new Value(obj);
        }
        if (typeof obj === 'string' || typeof obj == 'boolean') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(convertToValues);
        }
        return Object.assign(
            {},
            ...Object.keys(obj).map((k) => ({ [k]: convertToValues(obj[k]) }))
        );
    }

    let pathSchema: ShapeKeyframed;
    const getPathSchema = (): ShapeKeyframed => {
        if (!pathSchema) {
            pathSchema = new ShapeKeyframed('ks');
        }
        return pathSchema;
    };

    /**
     * Given path data consisting of points and curves connecting those points, convert
     * into APL form.  If the path is constant, we'll just return all of the path elements as values.
     * If the path data is not constant (it animates over time), compute the easing functions and
     * return the path elements as animated values.
     */
    function makePath(data) {
        if (!data.a) {
            // Not animated
            return convertToValues(data.k);
        }

        let shapeKeyframed = { k: data.k };
        let r = getPathSchema().validate(shapeKeyframed);
        if (!r) {
            console.error(logs.errors);
            throw new ValidateException(
                'Failed to validate Schema of Keyframes',
                'keyFramePointToEasing',
                '',
                ''
            );
        }
        // we have verified the data structure
        let c = getPathSchema().getValue(
            shapeKeyframed,
            'k/0/s/0/c'.split('/')
        );
        let count = getPathSchema().getValue(
            shapeKeyframed,
            'k/0/s/0/i'.split('/')
        ).length;
        // Animated
        return {
            i: keyFramePointsToEasing(data.k, 'i', count),
            o: keyFramePointsToEasing(data.k, 'o', count),
            v: keyFramePointsToEasing(data.k, 'v', count),
            c: c
        };
    }

    let mEasing = {};
    let mEasingValueToKey = {};
    let mEasingIndex = 1;

    function addEasing(v) {
        if (!v) {
            return '';
        }

        if (mEasingValueToKey.hasOwnProperty(v)) {
            return mEasingValueToKey[v];
        }

        let name = 'ease' + mEasingIndex++;
        mEasing[name] = v;
        mEasingValueToKey[v] = '@' + name;

        return '@' + name;
    }

    let result: ResourceResult = {
        clean: () => {
            mEasing = {};
            mEasingValueToKey = {};
            mEasingIndex = 1;
        },

        get: () => {
            return [ { easing: mEasing } ];
        },

        makeSingleValue: makeSingleValue,
        makeMultipleValues: makeMultipleValues,
        makePath: makePath
    };

    return result;
}

export let resources = Resources();

export default Resources;
