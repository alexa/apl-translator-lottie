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

import { testConverter } from './utils';

const tests = [
    ['Convert simple trim path individually', 'trim-path-individually.json', 'trim-path-individually-apl.json'],
    ['Convert complex trim path', 'trim-path-individually-complex.json', 'trim-path-individually-complex-apl.json'],
    ['Convert trim paths', 'trim-path.json', 'trim-path-apl.json'],
    ['Convert trim path end offset', 'trim-path-test.json', 'trim-path-test-apl.json'],
    ['Convert trim path offset', 'trim-start-test.json', 'trim-start-test-apl.json']
];

test.each(tests)('%s', (testName, sampleFileName, outputFileName) => {
    testConverter(sampleFileName, outputFileName);
});
