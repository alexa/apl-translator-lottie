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
import { Emitter } from './modules/emitter';
import { logs, initLogs } from './modules/logs';
import parseLottie from './parse';

function replacer(key, value) {
    if (typeof key === 'string' && key.startsWith('_')) {
        return undefined;
    }
    return value;
}

export const emitter = Emitter.getInstance();

/**
 * Convert the raw lottie json
 * @param raw lottie json
 * @param collapseAVG collapse the converted AVG or not
 * @param wrap whether to wrap the AVG in APL document
 */
export function convert(raw, collapseAVG = true, wrap = true): string {
    initLogs();
    return JSON.stringify(parseLottie(raw, collapseAVG, wrap, emitter), collapseAVG ? replacer : null, 4);
}

/**
 * Convert the Lottie file
 * @param path Lottie file path
 * @param collapseAVG collapse the converted AVG or not
 * @param wrap whether to wrap the AVG in APL document
 */
export function convertFile(path: string, collapseAVG = true, wrap = true) {
    let lottieJSON: any;
    try {
        lottieJSON = JSON.parse(fs.readFileSync(path).toString());
        return convert(lottieJSON, collapseAVG, wrap)
    } catch (err) {
        console.error("Exception", err);
        return '';
    }
}

/**
 * Return the conversion result status
 * @returns {
 *    success: boolean
 *    errors: Set[Errors]
 * }
 */
export function fetchStats() {
    const { success, errors } = logs;
    const distinctErrors = [...new Set(errors)];
    return {
        success,
        errors: distinctErrors
    };
}

/**
 * Convert the Lottie JSON and returns the conversion result status
 * @param raw Lottie JSON
 * @param collapseAVG collapse the converted AVG or not
 * @param wrap whether to wrap the AVG in APL document
 * @returns {
 *     data: converted APL json document string
 *     status: {
 *          success: boolean
 *          errors: Set[Errors]
 *     }
 * }
 */
export function convertWithStats(raw: any, collapseAVG = true, wrap = true) {
    initLogs();
    let aplJSON;
    try {
        aplJSON = JSON.stringify(parseLottie(raw, collapseAVG, wrap, emitter), collapseAVG ? replacer : null, 4);
    } catch (err) {
        console.error("Exception", err);
    }
    return {
        data: aplJSON,
        status: fetchStats()
    }
}

/**
 * Get Lottie file version
 * @param raw Lottie JSON
 */
export function getVersion(raw: any): number {
    return raw.v;
}
