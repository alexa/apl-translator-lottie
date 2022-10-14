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

import { PropNumber } from '../src/lottie/props/propNumber';
import { PropString } from '../src/lottie/props/propString';
import { PropBoolean } from '../src/lottie/props/propBoolean';
import { PropArray } from '../src/lottie/props/propArray';
import { PropObject } from '../src/lottie/props/propObject';
import { ShapeProp } from '../src/lottie/props/shapeProp';
import { ShapePropKeyframe } from '../src/lottie/props/shapePropKeyframe';
import { ShapeKeyframed } from '../src/lottie/props/shapeKeyframed';
import { Shape } from '../src/lottie/props/shape';

import { logs, initLogs } from '../src/modules/logs';
import { NO_TAG, PropertySchema } from '../src/lottie/props/property';
import { ValidateException } from '../src/modules/validate';

beforeEach(() => {
    initLogs();
});
const expectValidationError = (prop, val) => {
    try {
        prop.validate(val);
    } catch (e) {
        expect(e instanceof ValidateException).toBeTruthy();
    }
};

test('Test PropNumber schema', () => {
    const propNumber: PropNumber = new PropNumber(
        'n',
        'test number',
        undefined
    );

    expect(propNumber.validate(3.0)).toBeTruthy;
    expectValidationError(propNumber, '3.0');
    expectValidationError(propNumber, 'hello');
    expectValidationError(propNumber, true);
    expectValidationError(propNumber, {});

    expect(logs.errors.lenght > 0);
});

test('Test PropString schema', () => {
    const propString: PropString = new PropString(
        's',
        'test string',
        undefined
    );

    expect(propString.validate('hello')).toBeTruthy;
    expect(propString.validate('')).toBe(true);
    expectValidationError(propString, 1.0);
    expectValidationError(propString, {});

    expect(logs.errors.lenght > 0);
});

test('Test PropBoolean schema', () => {
    const propBoolean: PropBoolean = new PropBoolean(
        's',
        'test string',
        undefined
    );

    expect(propBoolean.validate(true)).toBeTruthy;
    expect(propBoolean.validate(false)).toBeTruthy;
    expectValidationError(propBoolean, '');
    expect(propBoolean.validate(0)).toBe(true);
    expect(propBoolean.validate(1.0)).toBe(true);
    expectValidationError(propBoolean, {});

    expect(logs.errors.lenght > 0);
});

test('Test PropArray schema', () => {
    const propArray: PropArray = new PropArray(
        'a',
        'test array',
        new PropNumber(NO_TAG, 'a item', undefined),
        undefined,
    );

    expect(propArray.validate([1, 2, 3, 4.0])).toBeTruthy;
    // single value is a special case
    expect(propArray.validate(1)).toBeTruthy;

    expect(logs.errors.lenght > 0);
});

test('Test PropObject schema', () => {
    const objs = new Map<string, PropertySchema>([
        ['x', new PropNumber('x', 'test number in obj', undefined)],
        ['y', new PropString('y', 'test string in obj', undefined)],
        [
            'a',
            new PropArray(
                'a',
                'test string in obj',
                new PropObject(
                    NO_TAG,
                    'test obj',
                    undefined,
                    new Map([
                        ['f1', new PropNumber('f1', 'f1 number', undefined)]
                    ])
                ),
                undefined,
            )
        ]
    ]);
    const propObject: PropObject = new PropObject(
        'a',
        'test array',
        undefined,
        objs
    );

    expect(
        propObject.validate({ x: 1.0, y: 'hello', a: [{ f1: 1 }, { f1: 2.0 }] })
    ).toBeTruthy();
    expectValidationError(propObject, {
        x: 1.0,
        y: 'hello',
        z: 10,
        a: [{ f1: 1 }, { f1: 2.0 }]
    });

    expect(logs.errors.lenght > 0);
});

test('Test PropObject schema with unspported', () => {
    const objs = new Map<string, PropertySchema>([
        ['x', new PropNumber('x', 'test number in obj', undefined)],
        ['y', new PropString('y', 'test string in obj', undefined)],
        [
            'a',
            new PropArray(
                'a',
                'test string in obj',
                new PropObject(
                    NO_TAG,
                    'test obj',
                    undefined,
                    new Map([
                        ['f1', new PropNumber('f1', 'f1 number', undefined)]
                    ])
                ),
                undefined
            )
        ]
    ]);
    const propObject: PropObject = new PropObject(
        'a',
        'test array',
        undefined,
        objs
    );

    expect(
        propObject.validate({ x: 1.0, y: 'hello', a: [{ f1: 1 }, { f1: 2.0 }] })
    ).toBeTruthy();
    expectValidationError(propObject, {
        x: 1.0,
        y: 'hello',
        z: 10, // unsupported field
        a: [{ f1: 1 }, { f1: 2.0 }]
    });

    expect(logs.errors.lenght > 0);
});

test('Test PropProperty schema path', () => {
    class PropTest extends PropObject {
        constructor(tag: string, extName: string, parent?: PropertySchema) {
            super(tag, `test ${tag}`, parent, new Map());
        }
    }
    let p1 = new PropTest('a', 'a lvl', undefined);
    let p2 = new PropTest('b', 'b lvl', p1);
    let p3 = new PropTest('c', 'c lvl', p2);
    let path = p3.getDataPath();

    expect(path).toEqual('a/b/c');
});

test('Test ShapeProp', () => {
    let s = new ShapeProp(undefined);
    let o = {
        c: false,
        i: [
            [1, 2],
            [3, 4]
        ],
        o: [
            [1, 2],
            [3, 4]
        ],
        v: [
            [1, 2],
            [3, 4]
        ]
    };
    expect(s.validate(o)).toBeTruthy;

    let oErr = {
        c: true,
        n: 1.0 // unknown
    };
    expectValidationError(s, oErr);
});

test('Test shapeKeyframed', () => {
    let s = new ShapeKeyframed('ks');
    let o = {
        k: [
            {
                i: {
                    x: 0.667,
                    y: 1
                },
                o: {
                    x: 0.333,
                    y: 0
                },
                t: 100,
                s: [
                    {
                        i: [
                            [34.868, -19.767],
                            [0, 0]
                        ],
                        o: [
                            [-34.868, 19.767],
                            [0, 0]
                        ],
                        v: [
                            [8.542, -25],
                            [-8.542, 25]
                        ],
                        c: false
                    }
                ]
            }
        ]
    };
    expect(s.validate(o)).toBeTruthy();
});

test('Test ShapePropKeyframe', () => {
    let s = new ShapePropKeyframe('k', 'test-shape-prop-keyframe', undefined);
    let o = {
        s: [
            {
                c: false,
                i: [
                    [1, 2],
                    [3, 4]
                ],
                o: [
                    [1, 2],
                    [3, 4]
                ],
                v: [
                    [1, 2],
                    [3, 4]
                ]
            }
        ],
        t: 123456889,
        i: { x: [1, 2], y: [2, 3] },
        o: { x: [1, 2], y: [2, 3] }
    };
    expect(s.validate(o)).toBeTruthy;

    let oErr = {
        t: 1234,
        c: true,
        n: 1.0 // unknown
    };
    expectValidationError(s, oErr);

    // no 't'
    let oErr1 = {
        c: true,
        n: 1.0 // unknown
    };
    expectValidationError(s, oErr1);
});

test('Test Prop Shape', () => {
    let s = new Shape('s', 'test prop shape', undefined);
    let o = {
        k: {
            c: false,
            i: [
                [1, 2],
                [3, 4]
            ],
            o: [
                [1, 2],
                [3, 4]
            ],
            v: [
                [1, 2],
                [3, 4]
            ]
        },
        x: 'expression()',
        ix: 'idx',
        a: 1
    };
    expect(s.validate(o)).toBeTruthy();

    let oErr = {
        c: true,
        n: 1.0 // unknown
    };
    expectValidationError(s, oErr);

    let o1 = {
        k: [
            // shapeProp
            {
                c: false,
                i: [
                    [1, 2, 3],
                    [3, 4]
                ],
                o: [
                    [1, 2],
                    [3, 4]
                ],
                v: [
                    [1, 2],
                    [3, 4]
                ]
            }
        ],
        x: 'expression()',
        ix: 'idx',
        a: 1
    };

    expectValidationError(s, o1);
});

test('Test Prop getValue', () => {
    let s = new Shape('s', 'test prop shape', undefined);
    let o = {
        k: {
            c: false,
            i: [
                [1, 2],
                [3, 4]
            ],
            o: [
                [1, 2],
                [3, 4]
            ],
            v: [
                [1, 2],
                [3, 4]
            ]
        },
        x: 'expression()',
        ix: 'idx',
        a: 1
    };
    expect(s.getValue(o, ['k', 'i'])).toEqual([
        [1, 2],
        [3, 4]
    ]);

    expect(s.getValue(o, ['k', 'o', '1', '0'])).toEqual(3);
});
