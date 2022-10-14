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
import { convertWithStats } from '../src';
import { isJSON } from './utils';
import { LAYER_ITEM_TYPE_ERROR_MAP} from '../src/modules/errors';

const samplePath = './samples/';

test('Test convertWithStats API endpoint', () => {
    const sampleFileName = 'text-layer.json';

    const rawdata = fs.readFileSync(samplePath + sampleFileName);
    const lottieJSON = JSON.parse(rawdata.toString());
    const result = convertWithStats(lottieJSON);
    const { data, status } = result;
    expect(status.success).toBeTruthy;
    expect(status.errors).toContain(LAYER_ITEM_TYPE_ERROR_MAP["5"]);
    expect(isJSON(data)).toBe(true);
});
