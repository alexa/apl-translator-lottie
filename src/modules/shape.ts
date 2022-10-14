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

import { validate } from "./validate";
import { SHAPES } from "./constants";
import { ERRORS, SHAPE_ITEM_TYPE_ERROR_MAP } from './errors';
import { resources } from "./value";
import { logs } from "./logs";
import { roundNum } from "./utils";

/**
 * Parse the gradient stops
 * g.p = number of stops
 * g.k = multi-value array object.  Four elements are repeated: stop, red, green, blue.
 */
export function parseGradientStops(g) {
    validate("gradient", g, 'p', 'k');

    const stopCount = g.p;
    const values = resources.makeMultipleValues(g.k);

    let stops = [];
    let colors = [];

    for (let index = 0; index < stopCount; index++) {
        let i = index * 4;
        stops.push(values[i].embed());

        const r = roundNum(values[i + 1].multiply(255).embed());
        const g = roundNum(values[i + 2].multiply(255).embed());
        const b = roundNum(values[i + 3].multiply(255).embed());

        colors.push(`rgb(${r},${g},${b})`);
    }

    return {
        'inputRange': stops,
        'colorRange': colors
    };
}

export function parseDashProperty(d) {
    let strokeDashArray = [];
    let strokeDashOffset = 0;

    d.forEach((dashItem, i) => {
        validate(`dash item ${i}`, dashItem, 'n', 'nm', 'v');
        validate("dash value", dashItem.v, 'a', 'k', 'ix');

        const embedValue = dashItem.v.a
            ? resources.makeMultipleValues(dashItem.v)?.[0]?.embed()
            : resources.makeSingleValue(dashItem.v)?.embed();

        if (dashItem.n === 'o') {
            // offset
            strokeDashOffset = embedValue
        } else {
            // dash or gap
            strokeDashArray.push(embedValue)
        }
    });
    return {
        'strokeDashArray': strokeDashArray,
        'strokeDashOffset': strokeDashOffset,
    };
}


export function parseShapeItem(shapeItem, path) {
    // log error:
    const err = SHAPE_ITEM_TYPE_ERROR_MAP[shapeItem.ty];
    if (err) {
        logs.errors.push(err)
    } else if (shapeItem.ty in SHAPES) {
        return SHAPES[shapeItem.ty](shapeItem, path);
    } else {
        // If type is not in SHAPES && no error detected, the type is unrecognized
        ERRORS.UNRECOGNIZED_SHAPE.message = `Unrecognized shape item ${shapeItem.ty} at ${path}`;
        logs.errors.push(ERRORS.UNRECOGNIZED_SHAPE)
    }
}

export function parseShapeItemArray(itemArray, path) {
    let items = [];
    if (Array.isArray(itemArray)) {
        itemArray.forEach((element, index) => {
            let item = parseShapeItem(element, `${path}[${index}]`);
            if (item != null) {
                items.push(item);
            }
        });
    }
    return items;
}
