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

/**
 * Clean up an AVG by removing unused cruft.
 *
 * 1. Walk the 'items' hierarchy and remove any item that doesn't have a 'type'.
 *    This removes things like null layers that were used in construction but don't have
 *    a visual representation.
 *
 * 2. Check all animation properties for easing curves. Remove any defined easing curves
 *    from the resources section that aren't used.
 */
export function clean(avg: any): any {
    const EASE_MATCH = /@ease\d+/g;

    function removeEmptyItems(element) {
        if (Array.isArray(element.items)) {
            element.items = element.items.filter(item => item.type);
            element.items.forEach(item => removeEmptyItems(item));
        }
    }

    function findEasingUse(element) {
        let found = new Set();

        function findIn(element) {
            if (element == undefined) {
                return;
            }

            for (let [key, value] of Object.entries(element)) {
                if (!key.startsWith('_')) {
                    if (typeof value === 'string') {
                        let values = value.match(EASE_MATCH);
                        if (Array.isArray(values)) {
                            values.forEach(x => found.add(x));
                        }
                    } else if (Array.isArray(value)) {
                        value.forEach(x => findIn(x));
                    } else if (typeof value !== 'boolean' && typeof value !== 'number') {
                        findIn(value);
                    }
                }
            }
        }

        findIn(element);
        return found;
    }

    removeEmptyItems(avg);

    let usedEasing = findEasingUse(avg.items);
    let easingMap = avg.resources[0].easing; // This is the raw map used in the AVG document
    for (let key in Object.keys(easingMap)) {
        if (easingMap.hasOwnProperty(key) && !usedEasing.has(key)) {
            easingMap.delete(key);
        }
    }

    const FUNC_MATCH = /@\w+/;
    const isAnimationGradient = (obj: any): boolean => {
        if (typeof obj === 'string' || obj instanceof String) {
            return FUNC_MATCH.test(obj.toString());
        }
        if (typeof obj == 'object') {
            for (const key in obj) {
                const val = obj[key];
                const result = isAnimationGradient(val);
                if (result) return result;
            }
        }
        return false;
    };

    let gradientInResource: any = avg.resources.find((e: any) => typeof e === 'object' && 'gradient' in e);
    let gradientSeqNum = 1000; // not necessary to be randomized, it's locally named.
    // make the gradient as resource if applicable
    const processGradient = (avgObj: any) => {
        if (!avgObj || typeof avgObj !== 'object') {
            return;
        }
        if ('type' in avgObj && avgObj['type'] === 'path') {
            ['fill', 'stroke'].forEach(k => {
                let obj = avgObj[k] ?? {};
                if (
                    typeof obj === 'object' &&
                    'type' in obj &&
                    ['linear', 'radial'].includes(obj['type']) &&
                    !isAnimationGradient(obj)
                ) {
                    // found gradient without animation functions/variables, make it as resource
                    const id = `gradient${gradientSeqNum++}`;
                    if (!gradientInResource) {
                        avg.resources.push({ gradient: {} });
                        gradientInResource = avg.resources[avg.resources.length - 1];
                    }
                    gradientInResource.gradient[id] = obj;
                    avgObj[k] = `@${id}`;
                }
            });
        } else if ('item' in avgObj) {
            processGradient(avgObj.item);
        } else if ('items' in avgObj) {
            if (Array.isArray(avgObj.items)) {
                avgObj.items.forEach((item: any) => processGradient(item));
            } else {
                processGradient(avgObj.items);
            }
        }
    };

    processGradient(avg);

    return avg;
}
