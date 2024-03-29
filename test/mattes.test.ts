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

test('Convert simple mattes sample', () => {
    testConverter('mattes-sample-easy.json', 'mattes-sample-easy-apl.json');
});

test('Convert non mattes example', () => {
    testConverter('mattes-sample-no-alpha.json', 'mattes-sample-no-alpha-apl.json');
});

test('Convert circle mattes example', () => {
    testConverter('mattes-circle.json', 'mattes-circle-apl.json');
});

test('Convert polystar mattes sample', () => {
    testConverter('mattes-sample-polystar.json', 'mattes-sample-polystar-apl.json');
});