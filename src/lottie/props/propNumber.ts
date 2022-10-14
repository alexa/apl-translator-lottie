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
import { primitiveTypeCheck, PropertySchema, PropTypes } from './property';

export class PropNumber extends PropertySchema {
    constructor(
        tag: string,
        extName: string,
        parent?: PropertySchema,
        public defaultValue?: number
    ) {
        super({ tag, extName, type: PropTypes.NUMBER, parent });
    }

    doValidate(val: any): boolean {
        if (
            !primitiveTypeCheck(val, PropTypes.NUMBER) &&
            this.defaultValue === undefined
        ) {
            ERRORS.NON_EXPECTED_TYPE.message = `Expect NUMBER for ${this.tag}(${this.extName})`;
            logs.errors.push(ERRORS.NON_EXPECTED_TYPE);
            return false;
        }

        return true;
    }

    public getValue(val: any, _path: Array<string>): number {
        return val;
    }
}
