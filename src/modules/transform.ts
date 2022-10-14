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

import * as Avg from '../avg/types';
import { processSkewTransform } from './utils';
import Box from './range';
import { validate, validateMap } from './validate';
import { resources } from './value';

export const parseMask = (map, path) => {
    const MASK_MAP = {
        inv: "_inverted",
        mode: "_mode",
        o: {
            name: "_opacity",
            func: x => resources.makeSingleValue(x).multiply(0.01)
        },
        pt: {
            name: "_points",
            func: parseVertices
        },
        x: "_x",
        nm: "_description",
    };

    return validateMap("Mask", map, MASK_MAP, path);
};


export const parseTransform = (ks, path) => {
    const TRANSFORM_MAP = {
        a: {
            name: ["pivotX", "pivotY"],
            func: resources.makeMultipleValues
        },
        p: {
            name: ["_positionX", "_positionY"],
            func: x => {
                if (x.s) {
                    return [
                        resources.makeSingleValue(x.x),
                        resources.makeSingleValue(x.y)
                    ]
                }
                else {
                    return resources.makeMultipleValues(x);
                }
            }
        },
        s: {
            name: ["scaleX", "scaleY"],
            func: x => resources.makeMultipleValues(x).map(y => y.multiply(0.01))
        },
        r: {
            name: "rotation",
            func: resources.makeSingleValue
        },
        o: {
            name: "opacity",
            func: x => resources.makeSingleValue(x).multiply(0.01)
        },
        sk: {
            name: "skew",
            func: processSkewTransform
        }
    };
    return validateMap("transform", ks, TRANSFORM_MAP, path);
};

/**
 * k is an object of the form:
 *
 * k: {
 *   c: true/false   (if true, the curve is closed)
 *   i: [[X, Y],..]  In-point of the next segment in the curve
 *   o: [[X, Y],..]  Out-point of this segment in the curve
 *   v: [[X, Y],..]  Position of this point in the curve
 * }
 */
export const parseCurve = (k, animated: boolean, _path) => {
    validate("curve", k, 'v', 'i', 'o', 'c');

    let bounds = new Box();
    let result = [Avg.createPathData(Avg.PathDataM, "M", k.v[0][0].embed(), k.v[0][1].embed())];
    if (!animated) { bounds.update(k.v[0][0].asNumber(), k.v[0][1].asNumber()); }

    const itemCount = k.v.length;
    const segmentsToDraw = k.c ? itemCount : itemCount - 1;

    for (let j = 0; j < segmentsToDraw; j++) {
        // Starting point
        const sx = k.v[j][0];
        const sy = k.v[j][1];

        // Control point for curve start
        const ix = sx.add(k.o[j][0]);
        const iy = sy.add(k.o[j][1]);

        // Ending point
        const i = (j + 1) % itemCount;
        const ex = k.v[i][0];
        const ey = k.v[i][1];

        // Control point for curve end
        const ox = ex.add(k.i[i][0]);
        const oy = ey.add(k.i[i][1]);

        if (!animated) {
            bounds.update(ix.asNumber(), iy.asNumber());
            bounds.update(ex.asNumber(), ey.asNumber());
            bounds.update(ox.asNumber(), oy.asNumber());
        }

        result.push(Avg.createPathData(Avg.PathDataC, "C", ix.embed(), iy.embed(), ox.embed(), oy.embed(), ex.embed(), ey.embed()));
    }
    if (k.c) {
        // if the curve is closed
        result.push(Avg.createPathData(Avg.PathDataZ, "z"));
    }

    return {
        _path: result,
        _bounds: bounds
    }
};

/**
 * k is an array...
 *
 * k: [
 *   {
 *     i: { x: NUMBER, y: NUMBER },
 *     o: { x: NUMBER, y: NUMBER },
 *     t: NUMBER,
 *     s: [
 *        { *parseCurve* Format }
 *     ]
 *   },
 *   ....
 * ]
 */
export const parseVertices = (v, path) => {
    validate("vertices", v, 'k', 'a', 'ix');
    const k = resources.makePath(v);
    return parseCurve(k, v.a, path);
};

export const transformParams = (params, scaleX, scaleY, tX, tY, cmd?) => {
    for (let i = 0; i < params.length; i++) {
        let param = params[i];
        if (cmd === 'A' && i >= 2 && i <= 4) {
            continue
        }
        if (!isNaN(param)) {
            params[i] = i % 2 ? param * scaleY + tY : param * scaleX + tX;
        }
    }
    return params
};

export const parsePathData = (path: Avg.PathData[],
    translateX: number = 0, translateY: number = 0,
    scaleX: number = 1, scaleY: number = 1): Avg.PathData[] => {
    translateX = isNaN(translateX) ? 0 : translateX;
    translateY = isNaN(translateY) ? 0 : translateY;
    scaleX = isNaN(scaleX) ? 0 : scaleX;
    scaleY = isNaN(scaleY) ? 0 : scaleY;

    path.forEach(v => {
        const cmdUpperCase = v.cmd.toUpperCase();
        const isAbsVertex = v.cmd === cmdUpperCase;
        const tX = isAbsVertex ? translateX : 0;
        const tY = isAbsVertex ? translateY : 0;
        transformParams(v.params, scaleX, scaleY, tX, tY, cmdUpperCase);
        switch (cmdUpperCase) {
            case "M":
            case "L":
            case "H":
            case "V":
            case "A":
            case "C":
            case "Q":
            case "T":
            case "Z":
                return Avg.createPathData(
                    Avg[`PathData${cmdUpperCase}`],
                    v.cmd,
                    ...v.params
                );
            default:
                console.error("Unknown PathData cmd ", v.cmd);
                return v;
        }
    });
    return path;
};
