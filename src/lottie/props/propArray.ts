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

import { ValidateException } from '../../modules/validate';
import { ERRORS, logs } from './deps';
import { NO_TAG, PropertySchema, PropTypes } from './property';

export class PropArray extends PropertySchema {
    constructor(
        tag: string,
        extName: string,
        itemSchema: PropertySchema,
        parent?: PropertySchema,
        public minItems: number = -1,
        public maxItems: number = Number.MAX_SAFE_INTEGER
    ) {
        super({ tag, extName, type: PropTypes.ARRAY, parent });
        itemSchema.parent = this;
        this.subPropSchemas = new Map([[NO_TAG, itemSchema]]);
    }

    doValidate(valueObj: any): boolean {
        // if array has only one item, could be a signal value
        const arr = !Array.isArray(valueObj) ? [valueObj] : valueObj;
        if (this.minItems && arr.length < this.minItems) {
            ERRORS.TOO_FEW_IN_ARRAY.message = `Array should have at least ${this.minItems} items in ${this.tag}(${this.extName})`;
            logs.errors.push(ERRORS.TOO_FEW_IN_ARRAY);
            throw new ValidateException(
                ERRORS.TOO_FEW_IN_ARRAY.message,
                this.getDataPath(),
                arr
            );
        }
        if (this.maxItems && arr.length > this.maxItems) {
            ERRORS.TOO_MANY_IN_ARRAY.message = `Array should have at most ${this.minItems} items in ${this.tag}(${this.extName})`;
            logs.errors.push(ERRORS.TOO_MANY_IN_ARRAY);
            throw new ValidateException(
                ERRORS.TOO_MANY_IN_ARRAY.message,
                this.getDataPath(),
                arr
            );
        }
        const itemSchema = this.subPropSchemas.get(NO_TAG);
        return arr.every((item) => itemSchema.validate(item));
    }

    public getValue(val: any, path: Array<string>): Array<any> {
        let arr = val as Array<any>;
        if (path.length == 0) {
            return arr;
        }
        let i = parseInt(path[0]);
        return this.subPropSchemas.get(NO_TAG).getValue(arr[i], path.slice(1));
    }
}
