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

import {
    collapseGroups,
    wrapItemsInList,
    disassembleNumericAndDataBindingProps,
    combineProps,
    assembleNumericAndDataBindingProps,
    flattenGroups,
    Arithmetic,
    isNum,
    isSimpleDataBinding,
    convertValueToCalculableString,
    removeUnnecessaryProps,
    checkShouldCombineProps,
    combineByNumericCalculation,
    combineByStringConcat
} from '../src/modules/collapseGroups';
import { loadSampleJson } from './utils';

import fs from 'fs';

const outputPath = './test/';

test('Test end-to-end - with props combining', () => {
    const inputFileName = 'test-collapseGroups-step-0.json';
    const expectedOutputFileName = 'test-collapseGroups-step-5.json';

    const input = loadSampleJson(inputFileName);
    const expectedOutput = loadSampleJson(expectedOutputFileName);

    let output = collapseGroups(input);
    const outFile = outputPath + expectedOutputFileName;
    fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

    expect(output).toEqual(expectedOutput);
    fs.unlinkSync(outFile);
});

test('Test end-to-end - without props combining', () => {
    const inputFileName = 'test-collapseGroups-step-0.json';
    const expectedOutputFileName = 'test-collapseGroups-step-5-no-combining.json';

    const input = loadSampleJson(inputFileName);
    const expectedOutput = loadSampleJson(expectedOutputFileName);

    let output = collapseGroups(input, false);
    const outFile = outputPath + expectedOutputFileName;
    fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

    expect(output).toEqual(expectedOutput);
    fs.unlinkSync(outFile);
});

test('Test wrapItemsInList', () => {
    const inputFileName = 'test-collapseGroups-step-0.json';
    const expectedOutputFileName = 'test-collapseGroups-step-1.json';

    const input = loadSampleJson(inputFileName);
    const expectedOutput = loadSampleJson(expectedOutputFileName);

    wrapItemsInList(input.items, input);
    const outFile = outputPath + expectedOutputFileName;
    fs.writeFileSync(outFile, JSON.stringify(input, null, 2));

    expect(input).toEqual(expectedOutput);
    fs.unlinkSync(outFile);
});

test('Test disassembleNumericAndDataBindingProps', () => {
    const inputFileName = 'test-collapseGroups-step-1.json';
    const expectedOutputFileName = 'test-collapseGroups-step-2.json';

    const input = loadSampleJson(inputFileName);
    const expectedOutput = loadSampleJson(expectedOutputFileName);

    disassembleNumericAndDataBindingProps(input.items);
    const outFile = outputPath + expectedOutputFileName;
    fs.writeFileSync(outFile, JSON.stringify(input, null, 2));

    expect(input).toEqual(expectedOutput);
    fs.unlinkSync(outFile);
});

test('Test combineProps', () => {
    const inputFileName = 'test-collapseGroups-step-2.json';
    const expectedOutputFileName = 'test-collapseGroups-step-3.json';

    const input = loadSampleJson(inputFileName);
    const expectedOutput = loadSampleJson(expectedOutputFileName);

    combineProps(input.items, {});
    const outFile = outputPath + expectedOutputFileName;
    fs.writeFileSync(outFile, JSON.stringify(input, null, 2));

    expect(input).toEqual(expectedOutput);
    fs.unlinkSync(outFile);
});

test('Test assembleNumericAndDataBindingProps', () => {
    const inputFileName = 'test-collapseGroups-step-3.json';
    const expectedOutputFileName = 'test-collapseGroups-step-4.json';

    const input = loadSampleJson(inputFileName);
    const expectedOutput = loadSampleJson(expectedOutputFileName);

    assembleNumericAndDataBindingProps(input.items);
    const outFile = outputPath + expectedOutputFileName;
    fs.writeFileSync(outFile, JSON.stringify(input, null, 2));

    expect(input).toEqual(expectedOutput);
    fs.unlinkSync(outFile);
});

test('Test flattenGroups', () => {
    const inputFileName = 'test-collapseGroups-step-4.json';
    const expectedOutputFileName = 'test-collapseGroups-step-5.json';

    const input = loadSampleJson(inputFileName);
    const expectedOutput = loadSampleJson(expectedOutputFileName);

    flattenGroups(input.items, input);
    const outFile = outputPath + expectedOutputFileName;
    fs.writeFileSync(outFile, JSON.stringify(input, null, 2));

    expect(input).toEqual(expectedOutput);
    fs.unlinkSync(outFile);
});

test('Test isNum with number type values', () => {
    expect(isNum(123)).toEqual(true);
    expect(isNum(-123)).toEqual(true);
    expect(isNum(12.3)).toEqual(true);
    expect(isNum(-12.3)).toEqual(true);
});

test('Test isNum with string type values - number', () => {
    expect(isNum('123')).toEqual(true);
    expect(isNum('-123')).toEqual(true);
    expect(isNum('12.3')).toEqual(true);
    expect(isNum('-12.3')).toEqual(true);
});

test('Test isNum with string type values - not number', () => {
    expect(isNum('')).toEqual(false);
    expect(isNum('1-23')).toEqual(false);
    expect(isNum('12+3')).toEqual(false);
    expect(isNum('test')).toEqual(false);
    expect(isNum('${@ease(frame)}')).toEqual(false);
});

test('Test isNum with various types of values - not number', () => {
    expect(isNum(null)).toEqual(false);
    expect(isNum(undefined)).toEqual(false);
    expect(isNum(true)).toEqual(false);
    expect(isNum(false)).toEqual(false);
    expect(isNum(['test'])).toEqual(false);
    expect(isNum({ 'test': '${@ease(frame)}' })).toEqual(false);
});

test('Test isSimpleDataBinding with string type values - simple data binding', () => {
    expect(isSimpleDataBinding('${@ease(frame)}')).toEqual(true);
    expect(isSimpleDataBinding('${-@ease(frame)}')).toEqual(true);
    expect(isSimpleDataBinding('${@ease(frame)+1}')).toEqual(true);
    expect(isSimpleDataBinding('${0.25* @ease(frame)}')).toEqual(true);
    expect(isSimpleDataBinding('${200 + @ease(frame)- 1 * (-90.2/2)}')).toEqual(true);
});

test('Test isSimpleDataBinding with string type values - not simple data binding', () => {
    expect(isSimpleDataBinding('')).toEqual(false);
    expect(isSimpleDataBinding('123')).toEqual(false);
    expect(isSimpleDataBinding('-123')).toEqual(false);
    expect(isSimpleDataBinding('12.3')).toEqual(false);
    expect(isSimpleDataBinding('-12.3')).toEqual(false);
    expect(isSimpleDataBinding('${@ease(frame)} + 1')).toEqual(false);
    expect(isSimpleDataBinding('test')).toEqual(false);
    expect(isSimpleDataBinding('${frame >= 100 && frame <= 200 ? 1 : 0}')).toEqual(false);
});

test('Test isSimpleDataBinding with various types of values - not simple data binding', () => {
    expect(isSimpleDataBinding(null)).toEqual(false);
    expect(isSimpleDataBinding(undefined)).toEqual(false);
    expect(isSimpleDataBinding(123)).toEqual(false);
    expect(isSimpleDataBinding(-123)).toEqual(false);
    expect(isSimpleDataBinding(12.3)).toEqual(false);
    expect(isSimpleDataBinding(-12.3)).toEqual(false);
    expect(isSimpleDataBinding(true)).toEqual(false);
    expect(isSimpleDataBinding(false)).toEqual(false);
    expect(isSimpleDataBinding(['test'])).toEqual(false);
    expect(isSimpleDataBinding({ 'test': '${@ease(frame)}' })).toEqual(false);
});

test('Test convertValueToCalculableString - number without arithmetic', () => {
    expect(convertValueToCalculableString(123)).toEqual('123');
    expect(convertValueToCalculableString(-123)).toEqual('(-123)');
    expect(convertValueToCalculableString(12.3)).toEqual('12.3');
    expect(convertValueToCalculableString(-12.3)).toEqual('(-12.3)');
    expect(convertValueToCalculableString('123')).toEqual('123');
    expect(convertValueToCalculableString('-123')).toEqual('(-123)');
    expect(convertValueToCalculableString('12.3')).toEqual('12.3');
    expect(convertValueToCalculableString('-12.3')).toEqual('(-12.3)');
});

test('Test convertValueToCalculableString - number with multiplation arithmetic', () => {
    expect(convertValueToCalculableString(123, Arithmetic.MULTIPLICATION)).toEqual('123');
    expect(convertValueToCalculableString(-123, Arithmetic.MULTIPLICATION)).toEqual('(-123)');
    expect(convertValueToCalculableString(12.3, Arithmetic.MULTIPLICATION)).toEqual('12.3');
    expect(convertValueToCalculableString(-12.3, Arithmetic.MULTIPLICATION)).toEqual('(-12.3)');
    expect(convertValueToCalculableString('123', Arithmetic.MULTIPLICATION)).toEqual('123');
    expect(convertValueToCalculableString('-123', Arithmetic.MULTIPLICATION)).toEqual('(-123)');
    expect(convertValueToCalculableString('12.3', Arithmetic.MULTIPLICATION)).toEqual('12.3');
    expect(convertValueToCalculableString('-12.3', Arithmetic.MULTIPLICATION)).toEqual('(-12.3)');
});

test('Test convertValueToCalculableString - simple data binding without arithmetic', () => {
    expect(convertValueToCalculableString('${@ease(frame)}')).toEqual('@ease(frame)');
    expect(convertValueToCalculableString('${-@ease(frame)}')).toEqual('(-@ease(frame))');
    expect(convertValueToCalculableString('${@ease(frame)+1}')).toEqual('@ease(frame)+1');
    expect(convertValueToCalculableString('${0.25* @ease(frame)}')).toEqual('0.25*@ease(frame)');
    expect(convertValueToCalculableString('${200 + @ease(frame)- 1 * (-90.2/2)}')).toEqual('200+@ease(frame)-1*(-90.2/2)');
});

test('Test convertValueToCalculableString - simple data binding with multiplation arithmetic', () => {
    expect(convertValueToCalculableString('${@ease(frame)}', Arithmetic.MULTIPLICATION)).toEqual('@ease(frame)');
    expect(convertValueToCalculableString('${-@ease(frame)}', Arithmetic.MULTIPLICATION)).toEqual('(-@ease(frame))');
    expect(convertValueToCalculableString('${@ease(frame)+1}', Arithmetic.MULTIPLICATION)).toEqual('(@ease(frame)+1)');
    expect(convertValueToCalculableString('${0.25* @ease(frame)}', Arithmetic.MULTIPLICATION)).toEqual('0.25*@ease(frame)');
    expect(convertValueToCalculableString('${200 + @ease(frame)- 1 * (-90.2/2)}', Arithmetic.MULTIPLICATION)).toEqual('(200+@ease(frame)-1*(-90.2/2))');
});

test('Test convertValueToCalculableString - various invalid values', () => {
    expect(convertValueToCalculableString(null)).toEqual('');
    expect(convertValueToCalculableString(undefined)).toEqual('');
    expect(convertValueToCalculableString(true)).toEqual('');
    expect(convertValueToCalculableString(false)).toEqual('');
    expect(convertValueToCalculableString('${@ease(frame)} + 1')).toEqual('');
    expect(convertValueToCalculableString('test')).toEqual('');
    expect(convertValueToCalculableString('-test')).toEqual('');
    expect(convertValueToCalculableString('${frame >= 100 && frame <= 200 ? 1 : 0}')).toEqual('');
});

test('Test removeUnnecessaryProps with undefined values or props starting with "_" - should remove', () => {
    let item = {
        type: 'group',
        test1: undefined,
        test2: null,
        _test3: 123
    };
    removeUnnecessaryProps(item);
    expect(item).toEqual({
        type: 'group'
    });
});

test('Test removeUnnecessaryProps with number type of values - should remove', () => {
    let item = {
        type: 'group',
        translateX: 0,
        translateY: 0,
        translateX_numeric: 0,
        translateY_numeric: 0,
        translateX_data_binding: 0,
        translateY_data_binding: 0,
        scaleX: 1,
        scaleY: 1,
        scaleX_numeric: 1,
        scaleY_numeric: 1,
        scaleX_data_binding: 1,
        scaleY_data_binding: 1,
        pivotX: 0,
        pivotY: 0,
        pivotX_numeric: 0,
        pivotY_numeric: 0,
        pivotX_data_binding: 0,
        pivotY_data_binding: 0,
        rotation: 0,
        rotation_numeric: 0,
        rotation_data_binding: 0,
        opacity: 1,
        opacity_numeric: 1,
        opacity_data_binding: 1
    };
    removeUnnecessaryProps(item);
    expect(item).toEqual({
        type: 'group'
    });
});

test('Test removeUnnecessaryProps with number type of values - should not remove', () => {
    let item = {
        type: 'group',
        translateX: 123,
        translateY: 1,
        translateX_numeric: -123,
        translateY_numeric: 1,
        translateX_data_binding: 1,
        translateY_data_binding: 12.3,
        scaleX: 0,
        scaleY: 123,
        scaleX_numeric: -12.3,
        scaleY_numeric: 0,
        scaleX_data_binding: 0,
        scaleY_data_binding: 123,
        pivotX: 1,
        pivotY: -123,
        pivotX_numeric: 12.3,
        pivotY_numeric: 1,
        pivotX_data_binding: 1,
        pivotY_data_binding: -12.3,
        rotation: 1,
        rotation_numeric: 123,
        rotation_data_binding: -123,
        opacity: 0,
        opacity_numeric: 12.3,
        opacity_data_binding: -12.3
    };
    const itemDeepCopy = JSON.parse(JSON.stringify(item));
    removeUnnecessaryProps(item);
    expect(item).toEqual(itemDeepCopy)
});

test('Test removeUnnecessaryProps without pivot related props - should not remove pivots', () => {
    let item = {
        type: 'group',
        pivotX: 123,
        pivotY: 'test',
        pivotX_numeric: 12.3,
        pivotY_numeric: '-123',
        pivotX_data_binding: '${@ease(frame)}',
        pivotY_data_binding: true,
    };
    removeUnnecessaryProps(item);
    expect(item).toEqual({
        type: 'group'
    });
});

test('Test removeUnnecessaryProps with string type of values - should remove', () => {
    let item = {
        type: 'group',
        translateX: '0',
        translateY: '0',
        translateX_numeric: '0',
        translateY_numeric: '0',
        translateX_data_binding: '0',
        translateY_data_binding: '0',
        scaleX: '1',
        scaleY: '1',
        scaleX_numeric: '1',
        scaleY_numeric: '1',
        scaleX_data_binding: '1',
        scaleY_data_binding: '1',
        pivotX: '0',
        pivotY: '0',
        pivotX_numeric: '0',
        pivotY_numeric: '0',
        pivotX_data_binding: '0',
        pivotY_data_binding: '0',
        rotation: '0',
        rotation_numeric: '0',
        rotation_data_binding: '0',
        opacity: '1',
        opacity_numeric: '1',
        opacity_data_binding: '1'
    };
    removeUnnecessaryProps(item);
    expect(item).toEqual({
        type: 'group'
    });
});

test('Test removeUnnecessaryProps with various types of values - should not remove', () => {
    let item = {
        type: 'group',
        translateX: '123',
        translateY: '1',
        translateX_numeric: '-123',
        translateY_numeric: '1',
        translateX_data_binding: '1',
        translateY_data_binding: '12.3',
        scaleX: '0',
        scaleY: '123',
        scaleX_numeric: '-12.3',
        scaleY_numeric: '0',
        scaleX_data_binding: [],
        scaleY_data_binding: {},
        pivotX: 'test',
        pivotY: '-test',
        pivotX_numeric: '${@ease(frame)}',
        pivotY_numeric: '${-@ease(frame)}',
        pivotX_data_binding: true,
        pivotY_data_binding: false,
        rotation: '1',
        rotation_numeric: '123',
        rotation_data_binding: '-123',
        opacity: '0',
        opacity_numeric: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        opacity_data_binding: '${frame >= 100 && frame <= 200 ? 1 : 0}'
    };
    const itemDeepCopy = JSON.parse(JSON.stringify(item));
    removeUnnecessaryProps(item);
    expect(item).toEqual(itemDeepCopy);
});

test('Test checkShouldCombineProps - positive 1', () => {
    const itemList = [
        {
            type: "group",
            translateX: 123,
            items: []
        }
    ]
    const propsToCombine = {
        translateX: 123
    }
    let shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);
    expect(shouldCombineProps).toEqual(true);
});

test('Test checkShouldCombineProps - positive 2', () => {
    const itemList = [
        {
            type: "group",
            translateX: 123,
            translateY: "123",
            items: []
        }
    ]
    const propsToCombine = {
        translateX: 123,
        translateY: "123",
        rotation: -123,
        scaleX: "-123",
        scaleY: -12.3,
        opacity: "-12.3"
    }
    let shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);
    expect(shouldCombineProps).toEqual(true);
});

test('Test checkShouldCombineProps - multiple children', () => {
    const itemList = [
        {
            type: "group"
        },
        {
            type: "path"
        }
    ]
    const propsToCombine = {}
    let shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);
    expect(shouldCombineProps).toEqual(false);
});

test('Test checkShouldCombineProps - zero group child', () => {
    const itemList = [
        {
            type: "path"
        }
    ]
    const propsToCombine = {}
    let shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);
    expect(shouldCombineProps).toEqual(false);
});

test('Test checkShouldCombineProps - parent and child both has pivot-related props 1', () => {
    const itemList = [
        {
            type: "group",
            pivotX: 123,
            items: []
        }
    ]
    const propsToCombine = {
        scaleX: "-123"
    }
    let shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);
    expect(shouldCombineProps).toEqual(false);
});

test('Test checkShouldCombineProps - parent and child both has pivot-related props 2', () => {
    const itemList = [
        {
            type: "group",
            rotation: 123,
            items: []
        }
    ]
    const propsToCombine = {
        pivotY: 123
    }
    let shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);
    expect(shouldCombineProps).toEqual(false);
});

test('Test checkShouldCombineProps - parent has clipPath and child has translate', () => {
    const itemList = [
        {
            type: "group",
            translateX: 123,
            items: []
        }
    ]
    const propsToCombine = {
        clipPath: "test"
    }
    let shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);
    expect(shouldCombineProps).toEqual(false);
});

test('Test checkShouldCombineProps - special values', () => {
    const itemList = [
        {
            type: "group",
            prop_special: "test",
            items: []
        }
    ]
    const propsToCombine = {
        prop_special: "test"
    }
    let shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);
    expect(shouldCombineProps).toEqual(false);
});

test('Test combineNumericValues - without arithmetic', () => {
    let item = {
        prop1: 123,
        prop2: -123,
        prop3: '123',
        prop4: '-123',
        prop5: 12.3,
        prop6: -12.3,
        prop7: '12.3',
        prop8: '-12.3',
        prop9: 'test',
        prop10: '${@ease(frame)}',
        translateX: 123,
        translateX_numeric: '-123',
        scaleY: 12.0,
        scaleY_data_binding: '-12.0',
        pivotX: -123,
        rotation_numeric: -12.3,
        opacity_data_binding: 0.8
    };
    combineByNumericCalculation(item, 'prop1', 123);
    combineByNumericCalculation(item, 'prop2', '-123');
    combineByNumericCalculation(item, 'prop3', 12.3);
    combineByNumericCalculation(item, 'prop4', '-12.3');
    combineByNumericCalculation(item, 'prop5', null);
    combineByNumericCalculation(item, 'prop6', undefined);
    combineByNumericCalculation(item, 'prop7', true);
    combineByNumericCalculation(item, 'prop8', 'test');
    combineByNumericCalculation(item, 'prop9', 123);
    combineByNumericCalculation(item, 'prop10', 12.3);
    combineByNumericCalculation(item, 'prop11', '123');
    combineByNumericCalculation(item, 'translateX', '123');
    combineByNumericCalculation(item, 'translateX_numeric', -123);
    combineByNumericCalculation(item, 'scaleY', '12.0');
    combineByNumericCalculation(item, 'scaleY_data_binding', -12.0);
    combineByNumericCalculation(item, 'pivotX', '-123');
    combineByNumericCalculation(item, 'rotation_numeric', 123);
    combineByNumericCalculation(item, 'opacity_data_binding', '0.5');
    expect(item).toEqual({
        prop1: 246,
        prop2: -246,
        prop3: 135.3,
        prop4: -135.3,
        prop5: 12.3,
        prop6: -12.3,
        prop7: '12.3',
        prop8: '-12.3',
        prop9: 'test',
        prop10: '${@ease(frame)}',
        prop11: 123,
        translateX: 246,
        translateX_numeric: -246,
        scaleY: 144,
        scaleY_data_binding: 144,
        pivotX: -246,
        rotation_numeric: 110.7,
        opacity_data_binding: 0.4
    });
});

test('Test combineNumericValues - with addition arithmetic', () => {
    let item = {
        prop1: 123,
        prop2: -123,
        prop3: '123',
        prop4: '-123',
        prop5: 12.3,
        prop6: -12.3,
        prop7: '12.3',
        prop8: '-12.3',
        prop9: 'test',
        prop10: '${@ease(frame)}',
    };
    combineByNumericCalculation(item, 'prop1', 123, Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop2', '-123', Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop3', 12.3, Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop4', '-12.3', Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop5', null, Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop6', undefined, Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop7', true, Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop8', 'test', Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop9', 123, Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop10', 12.3, Arithmetic.ADDITION);
    combineByNumericCalculation(item, 'prop11', '123', Arithmetic.ADDITION);
    expect(item).toEqual({
        prop1: 246,
        prop2: -246,
        prop3: 135.3,
        prop4: -135.3,
        prop5: 12.3,
        prop6: -12.3,
        prop7: '12.3',
        prop8: '-12.3',
        prop9: 'test',
        prop10: '${@ease(frame)}',
        prop11: 123,
    });
});

test('Test combineNumericValues - with subtraction arithmetic', () => {
    let item = {
        prop1: 123,
        prop2: -123,
        prop3: '123',
        prop4: '-123',
        prop5: 12.3,
        prop6: -12.3,
        prop7: '12.3',
        prop8: '-12.3',
        prop9: 'test',
        prop10: '${@ease(frame)}',
    };
    combineByNumericCalculation(item, 'prop1', 123, Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop2', '-123', Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop3', 12.3, Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop4', '-12.3', Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop5', null, Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop6', undefined, Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop7', true, Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop8', 'test', Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop9', 123, Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop10', 12.3, Arithmetic.SUBTRACTION);
    combineByNumericCalculation(item, 'prop11', '123', Arithmetic.SUBTRACTION);
    expect(item).toEqual({
        prop1: 0,
        prop2: 0,
        prop3: 110.7,
        prop4: -110.7,
        prop5: 12.3,
        prop6: -12.3,
        prop7: '12.3',
        prop8: '-12.3',
        prop9: 'test',
        prop10: '${@ease(frame)}',
        prop11: -123,
    });
});

test('Test combineNumericValues - with multiplication arithmetic', () => {
    let item = {
        prop1: 0,
        prop2: -123,
        prop3: '123',
        prop4: '-123',
        prop5: 12.3,
        prop6: -12.3,
        prop7: '12.3',
        prop8: '-12.3',
        prop9: 'test',
        prop10: '${@ease(frame)}',
    };
    combineByNumericCalculation(item, 'prop1', 123, Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop2', '-123', Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop3', 12.3, Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop4', '-12.3', Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop5', null, Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop6', undefined, Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop7', true, Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop8', 'test', Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop9', 123, Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop10', 12.3, Arithmetic.MULTIPLICATION);
    combineByNumericCalculation(item, 'prop11', '123', Arithmetic.MULTIPLICATION);
    expect(item).toEqual({
        prop1: 0,
        prop2: 15129,
        prop3: 1512.9,
        prop4: 1512.9,
        prop5: 12.3,
        prop6: -12.3,
        prop7: '12.3',
        prop8: '-12.3',
        prop9: 'test',
        prop10: '${@ease(frame)}',
        prop11: 123,
    });
});

test('Test combineByStringConcat - without arithmetic', () => {
    let item = {
        prop1: 123,
        prop2: '-123',
        prop3: 12.3,
        prop4: '-12.3',
        prop5: '${@ease(frame)}',
        prop6: '${-@ease(frame)}',
        prop7: '${@ease(frame)+1}',
        prop8: '${0.25* @ease(frame)}',
        prop9: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop10: '${@ease(frame)+1}',
        prop11: '${0.25* @ease(frame)}',
        prop12: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop13: 'test',
        prop14: '${@ease(frame)} + 1',
        prop15: '-${@ease(frame)}',
        prop16: '${frame >= 100 && frame <= 200 ? 1 : 0}',
        translateX: 123,
        translateX_numeric: '-12.3',
        scaleY: '${@ease(frame)}',
        scaleY_data_binding: '${@ease(frame)+1}',
        pivotX: '${0.25* @ease(frame)}',
        rotation_numeric: '${0.25* @ease(frame)}',
        opacity_data_binding: '${200 + @ease(frame)- 1 * (-90.2/2)}'
    };
    combineByStringConcat(item, 'prop1', '${@ease(frame)}');
    combineByStringConcat(item, 'prop2', '${-@ease(frame)}');
    combineByStringConcat(item, 'prop3', '${@ease(frame)+1}');
    combineByStringConcat(item, 'prop4', '${0.25* @ease(frame)}');
    combineByStringConcat(item, 'prop5', '${200 + @ease(frame)- 1 * (-90.2/2)}');
    combineByStringConcat(item, 'prop6', 123);
    combineByStringConcat(item, 'prop7', '123');
    combineByStringConcat(item, 'prop8', -123);
    combineByStringConcat(item, 'prop9', '-123');
    combineByStringConcat(item, 'prop10', undefined);
    combineByStringConcat(item, 'prop11', true);
    combineByStringConcat(item, 'prop12', 'test');
    combineByStringConcat(item, 'prop13', '${@ease(frame)}');
    combineByStringConcat(item, 'prop14', '${@ease(frame)}');
    combineByStringConcat(item, 'prop15', '${@ease(frame)}');
    combineByStringConcat(item, 'prop16', '${@ease(frame)}');
    combineByStringConcat(item, 'prop17', '${@ease(frame)}');
    combineByStringConcat(item, 'translateX', '123');
    combineByStringConcat(item, 'translateX_numeric', -123);
    combineByStringConcat(item, 'scaleY', '12.0');
    combineByStringConcat(item, 'scaleY_data_binding', -12.0);
    combineByStringConcat(item, 'pivotX', '-123');
    combineByStringConcat(item, 'rotation_numeric', 123);
    combineByStringConcat(item, 'opacity_data_binding', '0.5');
    expect(item).toEqual({
        prop1: '${123+@ease(frame)}',
        prop2: '${(-123)+(-@ease(frame))}',
        prop3: '${12.3+@ease(frame)+1}',
        prop4: '${(-12.3)+0.25*@ease(frame)}',
        prop5: '${@ease(frame)+200+@ease(frame)-1*(-90.2/2)}',
        prop6: '${(-@ease(frame))+123}',
        prop7: '${@ease(frame)+1+123}',
        prop8: '${0.25*@ease(frame)+(-123)}',
        prop9: '${200+@ease(frame)-1*(-90.2/2)+(-123)}',
        prop10: '${@ease(frame)+1}',
        prop11: '${0.25* @ease(frame)}',
        prop12: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop13: 'test',
        prop14: '${@ease(frame)} + 1',
        prop15: '-${@ease(frame)}',
        prop16: '${frame >= 100 && frame <= 200 ? 1 : 0}',
        prop17: '${@ease(frame)}',
        translateX: '${123+123}',
        translateX_numeric: '${(-12.3)+(-123)}',
        scaleY: '${@ease(frame)*12.0}',
        scaleY_data_binding: '${(@ease(frame)+1)*(-12)}',
        pivotX: '${0.25*@ease(frame)+(-123)}',
        rotation_numeric: '${0.25*@ease(frame)+123}',
        opacity_data_binding: '${(200+@ease(frame)-1*(-90.2/2))*0.5}'
    });
});

test('Test combineByStringConcat - with addition arithmetic', () => {
    let item = {
        prop1: 123,
        prop2: '-123',
        prop3: 12.3,
        prop4: '-12.3',
        prop5: '${@ease(frame)}',
        prop6: '${-@ease(frame)}',
        prop7: '${@ease(frame)+1}',
        prop8: '${0.25* @ease(frame)}',
        prop9: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop10: '${@ease(frame)+1}',
        prop11: '${0.25* @ease(frame)}',
        prop12: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop13: 'test',
        prop14: '${@ease(frame)} + 1',
        prop15: '-${@ease(frame)}',
        prop16: '${frame >= 100 && frame <= 200 ? 1 : 0}'
    };
    combineByStringConcat(item, 'prop1', '${@ease(frame)}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop2', '${-@ease(frame)}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop3', '${@ease(frame)+1}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop4', '${0.25* @ease(frame)}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop5', '${200 + @ease(frame)- 1 * (-90.2/2)}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop6', 123, Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop7', '123', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop8', -123, Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop9', '-123', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop10', undefined, Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop11', true, Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop12', 'test', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop13', '${@ease(frame)}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop14', '${@ease(frame)}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop15', '${@ease(frame)}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop16', '${@ease(frame)}', Arithmetic.ADDITION);
    combineByStringConcat(item, 'prop17', '${@ease(frame)}', Arithmetic.ADDITION);
    expect(item).toEqual({
        prop1: '${123+@ease(frame)}',
        prop2: '${(-123)+(-@ease(frame))}',
        prop3: '${12.3+@ease(frame)+1}',
        prop4: '${(-12.3)+0.25*@ease(frame)}',
        prop5: '${@ease(frame)+200+@ease(frame)-1*(-90.2/2)}',
        prop6: '${(-@ease(frame))+123}',
        prop7: '${@ease(frame)+1+123}',
        prop8: '${0.25*@ease(frame)+(-123)}',
        prop9: '${200+@ease(frame)-1*(-90.2/2)+(-123)}',
        prop10: '${@ease(frame)+1}',
        prop11: '${0.25* @ease(frame)}',
        prop12: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop13: 'test',
        prop14: '${@ease(frame)} + 1',
        prop15: '-${@ease(frame)}',
        prop16: '${frame >= 100 && frame <= 200 ? 1 : 0}',
        prop17: '${@ease(frame)}',
    });
});

test('Test combineByStringConcat - with subtraction arithmetic', () => {
    let item = {
        prop1: 123,
        prop2: '-123',
        prop3: 12.3,
        prop4: '-12.3',
        prop5: '${@ease(frame)}',
        prop6: '${-@ease(frame)}',
        prop7: '${@ease(frame)+1}',
        prop8: '${0.25* @ease(frame)}',
        prop9: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop10: '${@ease(frame)+1}',
        prop11: '${0.25* @ease(frame)}',
        prop12: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop13: 'test',
        prop14: '${@ease(frame)} + 1',
        prop15: '-${@ease(frame)}',
        prop16: '${frame >= 100 && frame <= 200 ? 1 : 0}'
    };
    combineByStringConcat(item, 'prop1', '${@ease(frame)}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop2', '${-@ease(frame)}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop3', '${@ease(frame)+1}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop4', '${0.25* @ease(frame)}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop5', '${200 + @ease(frame)- 1 * (-90.2/2)}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop6', 123, Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop7', '123', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop8', -123, Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop9', '-123', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop10', undefined, Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop11', true, Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop12', 'test', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop13', '${@ease(frame)}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop14', '${@ease(frame)}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop15', '${@ease(frame)}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop16', '${@ease(frame)}', Arithmetic.SUBTRACTION);
    combineByStringConcat(item, 'prop17', '${@ease(frame)}', Arithmetic.SUBTRACTION);
    expect(item).toEqual({
        prop1: '${123-@ease(frame)}',
        prop2: '${(-123)-(-@ease(frame))}',
        prop3: '${12.3-@ease(frame)+1}',
        prop4: '${(-12.3)-0.25*@ease(frame)}',
        prop5: '${@ease(frame)-200+@ease(frame)-1*(-90.2/2)}',
        prop6: '${(-@ease(frame))-123}',
        prop7: '${@ease(frame)+1-123}',
        prop8: '${0.25*@ease(frame)-(-123)}',
        prop9: '${200+@ease(frame)-1*(-90.2/2)-(-123)}',
        prop10: '${@ease(frame)+1}',
        prop11: '${0.25* @ease(frame)}',
        prop12: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop13: 'test',
        prop14: '${@ease(frame)} + 1',
        prop15: '-${@ease(frame)}',
        prop16: '${frame >= 100 && frame <= 200 ? 1 : 0}',
        prop17: '${-@ease(frame)}',
    });
});

test('Test combineByStringConcat - with multiplication arithmetic', () => {
    let item = {
        prop1: 123,
        prop2: '-123',
        prop3: 12.3,
        prop4: '-12.3',
        prop5: '${@ease(frame)}',
        prop6: '${-@ease(frame)}',
        prop7: '${@ease(frame)+1}',
        prop8: '${0.25* @ease(frame)}',
        prop9: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop10: '${@ease(frame)+1}',
        prop11: '${0.25* @ease(frame)}',
        prop12: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop13: 'test',
        prop14: '${@ease(frame)} + 1',
        prop15: '-${@ease(frame)}',
        prop16: '${frame >= 100 && frame <= 200 ? 1 : 0}'
    };
    combineByStringConcat(item, 'prop1', '${@ease(frame)}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop2', '${-@ease(frame)}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop3', '${@ease(frame)+1}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop4', '${0.25* @ease(frame)}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop5', '${200 + @ease(frame)- 1 * (-90.2/2)}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop6', 123, Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop7', '123', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop8', -123, Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop9', '-123', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop10', undefined, Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop11', true, Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop12', 'test', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop13', '${@ease(frame)}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop14', '${@ease(frame)}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop15', '${@ease(frame)}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop16', '${@ease(frame)}', Arithmetic.MULTIPLICATION);
    combineByStringConcat(item, 'prop17', '${@ease(frame)}', Arithmetic.MULTIPLICATION);
    expect(item).toEqual({
        prop1: '${123*@ease(frame)}',
        prop2: '${(-123)*(-@ease(frame))}',
        prop3: '${12.3*(@ease(frame)+1)}',
        prop4: '${(-12.3)*0.25*@ease(frame)}',
        prop5: '${@ease(frame)*(200+@ease(frame)-1*(-90.2/2))}',
        prop6: '${(-@ease(frame))*123}',
        prop7: '${(@ease(frame)+1)*123}',
        prop8: '${0.25*@ease(frame)*(-123)}',
        prop9: '${(200+@ease(frame)-1*(-90.2/2))*(-123)}',
        prop10: '${@ease(frame)+1}',
        prop11: '${0.25* @ease(frame)}',
        prop12: '${200 + @ease(frame)- 1 * (-90.2/2)}',
        prop13: 'test',
        prop14: '${@ease(frame)} + 1',
        prop15: '-${@ease(frame)}',
        prop16: '${frame >= 100 && frame <= 200 ? 1 : 0}',
        prop17: '${@ease(frame)}',
    });
});
