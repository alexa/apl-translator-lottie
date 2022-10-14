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
 * Utility classes to track ranges and intervals
 */

class Box {
    _isDefined: boolean;
    _left: number;
    _top: number;
    _right: number;
    _bottom: number;

    constructor(a?, b?, c?, d?) {
        this._isDefined = false;
        this._left = 0;
        this._top = 0;
        this._right = 0;
        this._bottom = 0;

        // Copy operation
        if (a instanceof Box) {
            this._isDefined = a._isDefined;
            this._left = a._left;
            this._top = a._top;
            this._right = a._right;
            this._bottom = a._bottom;
        }
        // Box(left, top, right, bottom)
        else if (typeof a === 'number' && typeof b === 'number') {
            this._isDefined = true;
            this._left = a;
            this._top = b;
            this._right = (typeof c === 'number' ? c : a);
            this._bottom = (typeof d === 'number' ? d : b);
        }
    }

    update(x, y) {
        if (typeof x === 'number' && typeof y === 'number') {
            if (!this._isDefined) {
                this._isDefined = true;
                this._left = x;
                this._right = x;
                this._top = y;
                this._bottom = y;
            }
            else {
                this._left = Math.min(this._left, x);
                this._right = Math.max(this._right, x);
                this._top = Math.min(this._top, y);
                this._bottom = Math.max(this._bottom, y);
            }
        } else {
            console.warn("Trying to update box without numbers", x, y);
        }
    }

    combine(other) {
        if (other instanceof Box) {
            if (this._isDefined && other._isDefined) {
                return new Box(Math.min(this._left, other._left),
                    Math.min(this._top, other._top),
                    Math.max(this._right, other._right),
                    Math.max(this._bottom, other._bottom));
            }

            return new Box(this._isDefined ? this : other);
        }
        throw new Error("Illegal box combine operation");
    }

    isDefined() { return this._isDefined; }

    left() {
        if (this._isDefined) {
            return this._left;
        } else {
            throw new Error("Unable to read from undefined box");
        }
    }

    top() {
        if (this._isDefined) {
            return this._top;
        } else {
            throw new Error("Unable to read from undefined box");
        }
    }

    width() {
        if (this._isDefined) {
            return this._right - this._left;
        } else {
            throw new Error("Unable to read from undefined box");
        }
    }
    height() {
        if (this._isDefined) {
            return this._bottom - this._top;
        } else {
            throw new Error("Unable to read from undefined box");
        }
    }

    toString() {
        return `Box<${this.width()}x${this.height()}+${this._left}+${this._top}`;
    }
}

export default Box