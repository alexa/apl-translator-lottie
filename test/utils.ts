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

export const isJSON = (str: string) => {
    try {
        const json = JSON.parse(str);
        return typeof json === "object";
    } catch (e) {
        return false;
    }
};

const SAMPLE_PATH: string = './samples/';
export const sampleFile = (sampleFilename: string): string => {
    return SAMPLE_PATH + sampleFilename;
};
export const loadSampleJson = (sampleFileName: string): any => {
    return JSON.parse(fs.readFileSync(sampleFile(sampleFileName)).toString());
};

const TEST_PATH: string = './test/';
export const testConverter = (lottieFile: string, expectedAplFile: string) => {
    let sampleAvg = JSON.parse(convertFile(sampleFile(lottieFile)));
    expect(fetchStats().success).toBeTruthy;

    let exepectedApl = loadSampleJson(expectedAplFile);
    const outFile = TEST_PATH + expectedAplFile;

    fs.writeFileSync(outFile, JSON.stringify(sampleAvg, null, 2));
    expectConditionalEqual(sampleAvg, exepectedApl)
    fs.unlinkSync(outFile);
}

export const expectConditionalEqual = (o1, o2) => {
    delete o1.license;
    delete o2.license;
    expect(o1).toEqual(o2);
}
