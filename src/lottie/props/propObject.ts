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
import { PropertySchema, PropTypes } from './property';

export class PropObject extends PropertySchema {
    constructor(
        tag: string,
        extName: string,
        parent?: PropertySchema,
        subPropSchemas?: Map<string, PropertySchema>
    ) {
        super({ tag, extName, type: PropTypes.OBJECT, parent });
        this.subPropSchemas = subPropSchemas;
        this.subPropSchemas?.forEach((p) => (p.parent = this));
    }

    doValidate(obj: any): boolean {
        const unknown = this.checkSubProperties(obj).filter(property => property !== 'n');
        if (unknown.length > 0) {
            ERRORS.UNKNOWN_KEY.message = `Unsupported Lottie feature found in ${this.tag}(${this.extName}): ${unknown}`;
            logs.errors.push(ERRORS.UNKNOWN_KEY);
            throw new ValidateException(
                `Unsupported Lottie feature ${unknown}`,
                this.getDataPath(),
                obj
            );
        }
        for (let k in obj) {
            const subPropSchema = this.subPropSchemas.get(k);
            if (subPropSchema && !subPropSchema.validate(obj[k])) {
                return false;
            }
        }
        return true;
    }

    public getValue(val: any, path: Array<string>): any {
        if (path.length == 0) {
            return val;
        }
        const key = path[0];
        if (this.subPropSchemas.has(key) && key in val) {
            return this.subPropSchemas
                .get(key)
                .getValue(val[key], path.slice(1));
        }
        throw new Error(`Bad key ${key} for object to get value!`);
    }
}
