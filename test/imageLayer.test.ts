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

import fs from 'fs';
import { convertFile, fetchStats } from '../src';
import { isJSON, expectConditionalEqual, loadSampleJson } from './utils';
import { ERRORS, LAYER_ITEM_PROP_ERROR_MAP } from '../src/modules/errors';

const outputPath = './test/';
const samplePath = './samples/';

/**
 * Image Layer
 */
test('Convert basic image layer', () => {
    const sampleFileName = 'image-layer.json';
    const outputFileName = 'image-layer-apl.json';

    const AplOutput = convertFile(samplePath + sampleFileName);
    expect(fetchStats().success).toBeTruthy;
    expect(isJSON(AplOutput)).toBe(true);
    fs.writeFileSync(outputPath + outputFileName, AplOutput);
    expectConditionalEqual(JSON.parse(AplOutput), loadSampleJson(outputFileName));
    fs.unlinkSync(outputPath + outputFileName);
});

test('Convert image layer + mask layer', () => {
    const sampleFileName = 'mask-layer-image.json';
    const outputFileName = 'mask-layer-image-apl.json';

    const AplOutput = convertFile(samplePath + sampleFileName);
    expect(fetchStats().success).toBeTruthy;
    expect(isJSON(AplOutput)).toBe(true);
    expect(fetchStats().errors).not.toContain(LAYER_ITEM_PROP_ERROR_MAP.tt);
    expect(fetchStats().errors).toContain(LAYER_ITEM_PROP_ERROR_MAP.hasMask);
    fs.writeFileSync(outputPath + outputFileName, AplOutput);
    expectConditionalEqual(JSON.parse(AplOutput), loadSampleJson(outputFileName));
    fs.unlinkSync(outputPath + outputFileName);
});

test('Convert image layer with matte', () => {
    const sampleFileName = 'matte-image.json';
    const outputFileName = 'matte-image-apl.json';
 
    const AplOutput = convertFile(samplePath + sampleFileName);
    expect(fetchStats().success).toBeTruthy;
    expect(isJSON(AplOutput)).toBe(true);
    expect(fetchStats().errors).toContain(ERRORS.UNSUPPORTED_IMAGE_FEATURES);
    expect(fetchStats().errors).not.toContain(LAYER_ITEM_PROP_ERROR_MAP.tt);
    fs.writeFileSync(outputPath + outputFileName, AplOutput);
    expect(fs.readFileSync(outputPath + outputFileName)).toEqual(fs.readFileSync(samplePath + outputFileName));
    fs.unlinkSync(outputPath + outputFileName);
});