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
import { convertFile, fetchStats } from '../src'
import { isJSON, expectConditionalEqual, loadSampleJson } from './utils';

const outputPath = './test/';
const samplePath = './samples/';

test('Convert file with animation opacity', () => {
    const sampleFileName = 'opacity-square.json';
    const outputFileName = 'opacity-square-apl.json';

    const AplOutput = convertFile(samplePath + sampleFileName);
    expect(fetchStats().success).toBeTruthy;
    expect(isJSON(AplOutput)).toBe(true);
    fs.writeFileSync(outputPath + outputFileName, AplOutput);
    expectConditionalEqual(JSON.parse(AplOutput), loadSampleJson(outputFileName));
    fs.unlinkSync(outputPath + outputFileName);
});
