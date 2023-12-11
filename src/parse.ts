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
import { CONVERT_COMPLETED, PLAYBACK_SPEED_DEFAULT, REPEAT_MODE_DEFAULT, REPEAT_COUNT_DEFAULT } from './modules/constants';
import { ERRORS } from './modules/errors';
import { ValidateException } from './modules/validate';

const BODYMOVIN_VERSION = '5.7.5'; // The Bodymovin plugin version that we fully supported
const AVG_VERSION = '1.2';

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
    let images = [];
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
                    if (item.type === 'Image') {
                        images.push(item);
                    } else {
                        items.unshift(item);
                    }
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

    let myGraphic: any = {
        type: 'AVG',
        version: AVG_VERSION,
        _start: json.ip,
        _end: json.op,
        _frameRate: json.fr,
        width: json.w,
        height: json.h,
        parameters: [],
        items,
        resources: resources.get(),
        _description: json.nm,
    };

    let aplDocument;

    if (strip) {
        myGraphic = clean(myGraphic);
        try {
            myGraphic = collapseGroups(myGraphic);
        } catch (error) {
            console.warn('Failed collapsing unnecessary groups with combinding props.');
            try {
                // try again without props combining
                myGraphic = collapseGroups(myGraphic, false);
            } catch (error) {
                console.warn('Failed collapsing unnecessary groups without combinding props.');
            }
        }
    }

    let timeExpression = "(elapsedTime*" + (myGraphic._frameRate / 1000) + ")%" + (myGraphic._end - myGraphic._start);
    if (myGraphic._start != 0) {
        timeExpression = myGraphic._start + "+(" + timeExpression + ")";
    }

    myGraphic.parameters = [
        {
            name: "playbackSpeed",
            default: PLAYBACK_SPEED_DEFAULT
        },
        {
            name: "repeatMode",
            default: REPEAT_MODE_DEFAULT
        },
        {
            name: "repeatCount",
            default: REPEAT_COUNT_DEFAULT
        }
    ];

    myGraphic.items = {
        type: 'group',
        items: myGraphic.items,
        bind: [
            {
                name: "frames",
                value: myGraphic._end - myGraphic._start
            },
            {
                name: "startFrame",
                value: myGraphic._start
            },
            {
                name: "__ELLAPSED_FRAME",
                value: "${Math.abs(playbackSpeed) * (elapsedTime * " + myGraphic._frameRate / 1000 + ")}"
            },
            {
                name: "__ELLAPSED_FRAME_CONSTRAINED",
                value: "${repeatCount == -1 ? __ELLAPSED_FRAME : __ELLAPSED_FRAME < frames * (repeatCount + 1) ? __ELLAPSED_FRAME : frames * (repeatCount + 1) - 1}"
            },
            {
                name: "__FRAME",
                value: "${__ELLAPSED_FRAME_CONSTRAINED % frames}"
            },
            {
                name: "__SEESAWED_FRAME",
                value: "${__ELLAPSED_FRAME_CONSTRAINED % (frames * 2) > frames ? frames * 2 - __ELLAPSED_FRAME_CONSTRAINED % (frames * 2) - 1 : __ELLAPSED_FRAME_CONSTRAINED % (frames * 2)}"
            },
            {
                name: "__CURRENT_FRAME",
                value: "${repeatMode == 'reverse' ? __SEESAWED_FRAME : __FRAME}"
            },
            {
                name: "frame",
                value: "${startFrame + (playbackSpeed < 0 ? (frames - __CURRENT_FRAME - 1) : __CURRENT_FRAME)}"
            }
        ]
    };

    if (wrap) {
        aplDocument = {
            type: 'APL',
            version: '2023.1',
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
            }
        };

        if (items.length > 0) {
            aplDocument.graphics = { myGraphic };
        }

        if (images.length > 0) {
            aplDocument.mainTemplate.items = {
                type: "Container",
                bind: [{
                    name: "frame",
                    value: '${' + timeExpression + '}'
                }],
                items: [],
                height: "100%",
                width: "100%"
            };

            if (items.length > 0) {
                aplDocument.mainTemplate.items.items.push({
                    type: 'VectorGraphic',
                    source: 'myGraphic',
                    width: '100%',
                    height: '100%',
                    scale: 'best-fit',
                    align: 'center'
                })
            }
    
            aplDocument.resources = resources.get()

            images.forEach(image => {
                aplDocument.mainTemplate.items.items.unshift(image);
            })
        }
    }

    if (aplDocument.type === 'AVG' || aplDocument.type === 'APL') {
        logs.success = true;
    }

    if (emitter) {
        emitter.emit('UpdateProgress', CONVERT_COMPLETED);
    }
    return aplDocument;
}

export default parseLottie;

