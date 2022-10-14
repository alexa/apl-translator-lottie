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
import { PropArray } from './propArray';
import { PropertySchema } from './property';
import { PropNumber } from './propNumber';
import { PropObject } from './propObject';
import { ShapeProp } from './shapeProp';

export class ShapePropKeyframe extends PropObject {
    constructor(tag: string, extName: string, parent?: PropertySchema) {
        super(tag, extName, parent);
        const numberProp = (t: string, n: string) => new PropNumber(t, n, this);
        const xAxisProp = new PropArray(
            'x',
            'X axis',
            numberProp('x', 'x axis'),
            this
        );
        const yAxisProp = new PropArray(
            'y',
            'Y axis',
            numberProp('y', 'y axis'),
            this
        );

        this.subPropSchemas = new Map([
            ['s', new PropArray('s', 'Start', new ShapeProp(this), this)],
            ['e', new PropArray('s', 'End', new ShapeProp(this), this)],
            ['t', new PropNumber('t', 'Time', this)],
            [
                'i',
                new PropObject(
                    'i',
                    'In Value',
                    this,
                    new Map([
                        ['x', xAxisProp],
                        ['y', yAxisProp]
                    ])
                )
            ],
            [
                'o',
                new PropObject(
                    'o',
                    'Out Value',
                    this,
                    new Map([
                        ['x', xAxisProp],
                        ['y', yAxisProp]
                    ])
                )
            ]
        ]);
    }

    doValidate(obj: any): boolean {
        // 't' is required
        if (!('t' in obj)) {
            throw new ValidateException(
                `${this.extName} must have 't'(Time) value`,
                this.getDataPath()
            );
        }
        return super.doValidate(obj);
    }
}
