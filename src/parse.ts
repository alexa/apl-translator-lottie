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

import { resources } from './modules/value';
import { fixParentLayers, parseLayer } from './modules/layer';
import { clean } from './modules/clean';
import { collapseGroups } from "./modules/collapseGroups";
import { logs } from './modules/logs'
import { updateConvertProgress } from './modules/utils';
import animationUtil from './modules/animationUtil';
import { EventEmitter } from 'events';
import { CONVERT_COMPLETED } from './modules/constants';
import { ERRORS } from './modules/errors';
import { ValidateException } from './modules/validate';

const BODYMOVIN_VERSION = '5.7.5'; // The Bodymovin plugin version that we fully supported

let completed = 0;

function collectValidationErrors(e, index) {
    const validationError = {
        type: 'validation-exception',
        message: e.message + ' on layer index ' + index.toString()
    };
    logs.errors.push(validationError);
}

/**
 * Parse a Lottie file and generate an AVG
 */
function parseLottie(json: any, strip: boolean, wrap: boolean, emitter?: EventEmitter) {
    animationUtil.setAnimeStart(json.ip);
    animationUtil.setAnimeEnd(json.op);
    animationUtil.setAnimeFrameRate(json.fr);

    resources.clean();
    // reset the progress
    completed = 0;
    if (json.v !== BODYMOVIN_VERSION) {
        logs.errors.push(ERRORS.UNSUPPORTED_BODYMOVIN_VERSION)
    }
    if (json.markers && json.markers.length) {
        logs.errors.push(ERRORS.MARKERS)
    }
    let items = [];
    if (Array.isArray(json.layers)) {
        const numOfLayers: number = json.layers.length;
        json.layers.forEach((element: any, index: number) => {
            try {
                let item = parseLayer(element, `layers[${index}]`, json);
                if (emitter) {
                    // half converting each layer, half fixing parent layers
                    let progress = index / (numOfLayers * 2);
                    updateConvertProgress(emitter, progress);
                    completed = progress;
                }
                if (item != null) {
                    items.unshift(item);
                }
            } catch (e) {
                if (e instanceof ValidateException) {
                    collectValidationErrors(e, index);
                } else {
                    throw e;
                }
            }
        });
    }

    items = fixParentLayers(items, emitter, completed);

    let result: any = {
        type: 'AVG',
        version: '1.2',
        _start: json.ip,
        _end: json.op,
        _frameRate: json.fr,
        width: json.w,
        height: json.h,
        items: items,
        resources: resources.get(),
        _description: json.nm,
    };


    if (strip) {
        result = clean(result);
        try {
            result = collapseGroups(result);
        } catch (error) {
            console.warn('Failed collapsing unnecessary groups with combinding props.');
            try {
                // try again without props combining
                result = collapseGroups(result, false);
            } catch (error) {
                console.warn('Failed collapsing unnecessary groups without combinding props.');
            }
        }
    }

    let timeExpression = "(elapsedTime*" + (result._frameRate / 1000) + ")%" + (result._end - result._start);
    if (result._start != 0) {
        timeExpression = result._start + "+(" + timeExpression + ")";
    }
    // wrap items with a group for data binding
    result.items = {
        type: 'group',
        bind: [{
            name: "frame",
            value: '${' + timeExpression + '}'
        }],
        items: result.items
    };
    if (wrap) {
        result = {
            type: 'APL',
            version: '1.9',
            theme: 'light',
            mainTemplate: {
                parameters: ['payload'],
                items: {
                    type: 'VectorGraphic',
                    source: 'myGraphic',
                    width: '100%',
                    height: '100%',
                    scale: 'best-fit',
                    align: 'center'
                }
            },
            graphics: {
                myGraphic: result
            }
        };
    }

    if (result.type === 'AVG' || result.type === 'APL') {
        logs.success = true;
    }

    if (emitter) {
        emitter.emit('UpdateProgress', CONVERT_COMPLETED);
    }
    return result;
}

export default parseLottie;

