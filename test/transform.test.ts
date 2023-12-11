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

import { parseTransformValueToString } from '../src/modules/transform'

test('Transform numbers', () => {
    const inputs = [
        123,
        123.456,
        0.12345678901234567890,
        12345678901234567890n,
        123e24
    ];
    const expectedOutputs = [
        "123",
        "123.456",
        "0.12345678901234568",
        "12345678901234567000",
        "123000000000000000000000000"
    ]

    for (var i = 0; i < inputs.length; i++) {
        expect(parseTransformValueToString(inputs[i])).toEqual(expectedOutputs[i]);
    }
});

test('Transform strings in number format', () => {
    const inputs = [
        '123',
        '123.456',
        '0.12345678901234567890',
        '12345678901234567890',
        '123e24'
    ];
    const expectedOutputs = [
        "123",
        "123.456",
        "0.12345678901234568",
        "12345678901234567000",
        "123000000000000000000000000"
    ]

    for (var i = 0; i < inputs.length; i++) {
        expect(parseTransformValueToString(inputs[i])).toEqual(expectedOutputs[i]);
    }
});

test('Transform strings that isNaN but a function', () => {
    const inputs = [
        '${abc}',
        '${123}',
        '${123_456}',
        '${@abc}',
        '${${abc}}',
    ];
    const expectedOutputs = [
        "abc",
        "123",
        "123_456",
        "@abc",
        "${abc}"
    ]

    for (var i = 0; i < inputs.length; i++) {
        expect(parseTransformValueToString(inputs[i])).toEqual(expectedOutputs[i]);
    }
});

test('Transform strings that isNaN and not a function', () => {
    const inputs = [
        '123_',
        '${abc}123',
        '0_12345678901234567890',
        'abc',
        '()_+)'
    ];
    const expectedOutputs = [
        "0",
        "0",
        "0",
        "0",
        "0"
    ]

    for (var i = 0; i < inputs.length; i++) {
        expect(parseTransformValueToString(inputs[i])).toEqual(expectedOutputs[i]);
    }
});

test('Transform strings that isNaN and not a function, with specified default value', () => {
    const inputs = [
        '123_',
        '${abc}123',
        '0_12345678901234567890',
        'abc',
        '()_+)'
    ];
    const inputs_defaultValue = [
        'a',
        'b',
        'c',
        '1',
        '2'
    ];
    const expectedOutputs = inputs_defaultValue;

    for (var i = 0; i < inputs.length; i++) {
        expect(parseTransformValueToString(inputs[i], inputs_defaultValue[i])).toEqual(expectedOutputs[i]);
    }
});