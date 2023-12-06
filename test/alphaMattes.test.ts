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

import fs from 'fs'
import { convertFile, fetchStats } from '../src'
import { isJSON } from "./utils";

const outputPath = './test/'
const samplePath = './samples/'

/**
 * alpha mattes
 */
test('Convert Alpha Mattes', () => {
    const sampleFileName = 'alpha-matte.json'
    const outputFileName = 'alpha-matte-apl.json'

    const AplOutput = convertFile(samplePath + sampleFileName)
    fs.writeFileSync(outputPath + outputFileName, AplOutput)
    expect(fetchStats().success).toBeTruthy
    expect(isJSON(AplOutput)).toBe(true)
    expect(fs.readFileSync(outputPath + outputFileName)).toEqual(fs.readFileSync(samplePath + outputFileName))
    fs.unlinkSync(outputPath + outputFileName)
});

