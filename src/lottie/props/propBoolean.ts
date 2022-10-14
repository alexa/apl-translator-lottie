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

import { ERRORS, logs } from './deps';
import { PropertySchema, PropTypes } from './property';

export class PropBoolean extends PropertySchema {
    constructor(tag: string, extName: string, parent?: PropertySchema) {
        super({ tag, extName, type: PropTypes.BOOLEAN, parent });
    }

    public validate(val: any): boolean {
        // Lottie allow number stands for boolean 1 - true, 0 - false
        const r =
            'boolean' === typeof val ||
            (!isNaN(val) && Number.isInteger(parseFloat(val)));
        if (!r) {
            ERRORS.NON_EXPECTED_TYPE.message = `Expect boolean for ${this.tag}(${this.extName})`;
            logs.errors.push(ERRORS.NON_EXPECTED_TYPE);
        }
        return r;
    }

    public getValue(val: any) {
        return val;
    }
}
