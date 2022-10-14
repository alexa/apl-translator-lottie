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
import { PropBoolean } from './propBoolean';
import { PropertySchema } from './property';
import { PropNumber } from './propNumber';
import { PropObject } from './propObject';

export class ShapeProp extends PropObject {
    constructor(parent?: PropertySchema) {
        super('s', 'shapeProp', parent);
        this.subPropSchemas = new Map<string, PropertySchema>([
            ['c', new PropBoolean('c', 'Closed', this)],
            [
                'i',
                new PropArray(
                    'i',
                    'In Point',
                    new PropArray(
                        '_',
                        '',
                        new PropNumber('_', '', this),
                        this,
                        2,
                        2
                    ),
                    this
                )
            ],
            [
                'o',
                new PropArray(
                    'o',
                    'Out Point',
                    new PropArray(
                        '_',
                        '',
                        new PropNumber('_', '', this),
                        this,
                        2,
                        2
                    ),
                    this
                )
            ],
            [
                'v',
                new PropArray(
                    'o',
                    'Vertices',
                    new PropArray(
                        '_',
                        '',
                        new PropNumber('_', '', this),
                        this,
                        2,
                        2
                    ),
                    this
                )
            ]
        ]);
    }

    doValidate(val: any): boolean {
        if (super.doValidate(val)) {
            // 'i', 'o', 'v' should have same number of points
            let counter = { i: 0, o: 0, v: 0 };
            let k: keyof typeof counter;
            for (k in counter) {
                if (k in val) {
                    counter[k] = val[k].length;
                }
            }
            if (counter.i !== counter.o || counter.i !== counter.v) {
                throw new ValidateException(
                    `Points arrays are not the same size`,
                    this.getDataPath(),
                    val
                );
            }
            return true;
        }
        return false;
    }
}
