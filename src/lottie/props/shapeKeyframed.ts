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

import { PropArray } from './propArray';
import { NO_TAG, PropertySchema } from './property';
import { PropObject } from './propObject';
import { PropString } from './propString';
import { ShapePropKeyframe } from './shapePropKeyframe';

export class ShapeKeyframed extends PropObject {
    constructor(tag: string, parent?: PropertySchema) {
        super(tag, 'shapeKeyframed', parent, undefined);
        this.subPropSchemas = new Map<string, PropertySchema>([
            [
                'k',
                new PropArray(
                    NO_TAG,
                    'Keyframes',
                    new ShapePropKeyframe('k', 'Keyframes'),
                    this
                )
            ],
            ['x', new PropString('x', 'Expression', this)],
            ['ix', new PropString('ix', 'Property Index', this)],
            ['ti', new PropString('ti', 'In Tangent', this)],
            ['to', new PropString('to', 'Out Tangent', this)]
        ]);
    }
}
