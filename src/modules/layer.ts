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

import { LAYER_ITEM_TYPE_ERROR_MAP, LAYER_ITEM_PROP_ERROR_MAP, SHAPE_ITEM_TYPE_ERROR_MAP, ERRORS } from './errors';
import { EventEmitter } from 'events';
import { logs } from './logs';
import { parseShapeItemArray } from './shape';
import {
    parseMask,
    parseTransform,
    parsePathData
} from './transform';
import {
    assignTransform,
    copyTransform,
    groupShapeToPath,
    hasTransform,
    updateConvertProgress,
    processBlendMode,
    pathData2Str
} from './utils';
import { validateMap } from './validate';

/************************* Layers *********************/

const COMMON_LAYER_MAP = {
    ty: "_layerType",
    ip: "_inPoint",
    op: "_outPoint",
    cl: "_class",
    hix: "_hix",
    ddd: "_3D",
    st: "_startTime",
    sr: "_stretch",
    ks: {
        name: "_transform",
        func: parseTransform
    },
    ao: "_autoOrient",
    ind: "_layerIndex",
    bm: {
        name: "_blendMode",
        func: processBlendMode
    },
    ef: "_effects",
    parent: "_parent",
    td: "_matteTarget", // If set to 1, it means a layer is using this layer as a track matte
    tt: "_matteMode",  // Defines the track matte mode for the layer, 0 = no matte (supported), 1 = alpha matte (supported), 2 = inverted matte, 3 = luma matte, 4 = luma inverted matte
    hasMask: "_hasMask",
    masksProperties: {
        name: "_masks",
        func: (x, path) => {
            let masks = [];
            if (Array.isArray(x)) {
                x.forEach((element, index) => {
                    let mask = parseMask(element, `${path}[${index}]`);
                    if (mask != null) {
                        masks.unshift(mask);
                    }
                });
            }
            return masks;
        }
    },
    nm: "_description"
};

const processCommonLayer = (map, json) => {
    assignTransform(map, map._transform);

    // If this layer has an in-point or out-point that falls
    // within the normal time interval of the animation, we adjust
    // the opacity to hide and show the layer if the opacity property has not been assigned to ease function
    if (map._inPoint > json.ip || map._outPoint < json.op) {
        if (map._outPoint < json.op) {
            logs.errors.push(SHAPE_ITEM_TYPE_ERROR_MAP.op);
        }
        if (map.opacity?.toString().includes('@ease')) {
            map['opacity'] = "${" + `frame >= ${map._inPoint} && frame <= ${map._outPoint} ? ${map.opacity.replace('${(', '').replace(')}', '')} : 0` + "}";
        } else {
            map['opacity'] = "${" + `frame >= ${map._inPoint} && frame <= ${map._outPoint} ? ${map._transform.opacity.v() || 1} : 0` + "}";
        }
    }

    // Auto-orienting layers need to update the rotation of the layer based on the easing curve of the position
    if (map._autoOrient) {
        let tx = map._transform._positionX.subtract(map._transform.pivotX);
        let ty = map._transform._positionY.subtract(map._transform.pivotY);
        let r = map._transform.rotation;

        map['rotation'] = "${" + `${r.v()} + 180 / Math.PI * Math.atan2(${ty.dv()}, ${tx.dv()})` + "}";
    }
};

/***************** Shape Layer *****************/

const SHAPE_LAYER_MAP = Object.assign({
    shapes: {
        name: "_items",
        func: (x, path) => parseShapeItemArray(x, path)
    }
}, COMMON_LAYER_MAP);

// Post-process a shape layer into a group
const processShapeLayer = (shape, path, json) => {
    let map = groupShapeToPath(validateMap("ShapeLayer", shape, SHAPE_LAYER_MAP, path));
    processCommonLayer(map, json);
    return map;
};

/***************** Null Layer *****************/

const NULL_LAYER_MAP = Object.assign({}, COMMON_LAYER_MAP);

const processNullLayer = (shape, path, json) => {
    let map = validateMap("NullLayer", shape, NULL_LAYER_MAP, path);
    processCommonLayer(map, json);
    return map;
};

/***************** Solid Layer *****************/
const SOLID_LAYER_MAP = Object.assign({
    sw: "_width",
    sh: "_height",
    sc: "_color",
}, COMMON_LAYER_MAP);

// Post-process a solid layer
const processSolidLayer = (shape, path, json) => {
    let map = validateMap("SolidLayer", shape, SOLID_LAYER_MAP, path);
    processCommonLayer(map, json);

    map['type'] = 'group';
    map['items'] = {
        type: 'path',
        fill: map._color,
        pathData: `M0,0 l${map._width},0 l0,${map._height} l${-map._width},0 z`
    };
    return map;
};

// Process an Image Layer
 
const IMAGE_LAYER_MAP = Object.assign({
}, COMMON_LAYER_MAP);
 
const processImageLayer = (shape, path, json) => {
    const imageAsset = json.assets.find(asset => {
        return asset.id === shape.refId;
    })
    let imageSource = '';
    if (imageAsset) {
        imageSource = imageAsset.e ? imageAsset.p : imageAsset.u + imageAsset.p
    }
    let map = validateMap("Image", shape, IMAGE_LAYER_MAP, path);
    processCommonLayer(map, json);

    const imageObject = {
        type: 'Image',
        width: imageAsset && imageAsset.w,
        height: imageAsset && imageAsset.h,
        position: 'absolute',
        source: imageSource,
        opacity: map.opacity,
        transform: [
        ],
        _path: path
    };

    if (map.translateX || map.translateY) {
        imageObject.transform.push({
            translateX: map.translateX,
            translateY: map.translateY
        });
    }

    if (map.rotation) {
        imageObject.transform.push({
            rotate: map.rotation
        });
    }

    if (map.scaleX || map.scaleY) {
        // TODO: calculate the scale * w / h transform if scale is an ease function
        if (typeof map.scaleX === 'number' && imageAsset) {
            imageObject.transform.push({
                translateX: -(imageAsset.w - imageAsset.w * map.scaleX) / 2,
                translateY: -(imageAsset.h - imageAsset.h * map.scaleY) / 2,
            });
        }
        imageObject.transform.push({
            scaleX: map.scaleX,
            scaleY: map.scaleY
        });
    }

    if (shape.tt || shape.hasMask) {
        logs.errors.push(ERRORS.UNSUPPORTED_IMAGE_FEATURES);
    }

    return imageObject;
};

/***************** Pre-comp Layer *****************/
const processPreCompLayer = (shape, path, json) => {
    const PRE_COMP_LAYER_MAP = Object.assign({
        refId: "_referenceId",
        w: "_width",
        h: "_height",
    }, COMMON_LAYER_MAP);

    let map = validateMap("PreCompLayer", shape, PRE_COMP_LAYER_MAP, path);
    processCommonLayer(map, json);

    let mAssets = {};
    if (Array.isArray(json.assets)) {
        json.assets.forEach((asset, index) => {
            mAssets[asset.id] = {
                raw: asset,
                path: `assets[${index}]`
            };
        });
    }

    let asset;
    try {
        asset = mAssets[map._referenceId];
    } catch (e) {
        console.error("mAssets find asset error: " + e);
    }

    let item;
    try {
        item = parseAsset(asset.raw, asset.path, json);
    } catch (e) {
        console.error("Cannot parse asset " + map._referenceId);
    }

    return Object.assign({
        type: 'group',
        items: item
    }, map);
};

/**
 * Layer Dispatch
 */
export const parseLayer = (element, path, json) => {
    const LAYERS = {
        0: processPreCompLayer,
        1: processSolidLayer,
        2: processImageLayer,
        3: processNullLayer,
        4: processShapeLayer,
        5: (path) => {
            return {
                type: "TextLayer",
                _path: path
            }
        }
    };

    
    // log only text layer errors
    if (element.ty === 5) {
        const layerError = LAYER_ITEM_TYPE_ERROR_MAP[element.ty];
        if (layerError) {
            logs.errors.push(layerError);
        }
    }

    // log layer property errors:
    logLayerPropErrors(element);

    if (element.ty in LAYERS) {
        return LAYERS[element.ty](element, path, json);
    }

    throw new Error(`Unrecognized layer type ${element.ty} @${path}`);

};

const logLayerPropErrors = (layerElement: any) => {
    Object.keys(LAYER_ITEM_PROP_ERROR_MAP).forEach(
        unsupportedProp => {
            if (layerElement.hasOwnProperty(unsupportedProp)) {
                if (unsupportedProp === 'ddd' && !layerElement[unsupportedProp]) return;
                if (unsupportedProp === 'sr' && layerElement[unsupportedProp] == 1) return;
                if (unsupportedProp === 'tt' && (layerElement[unsupportedProp] == 0 || layerElement[unsupportedProp] == 1 || layerElement.ty == 2)) return;
                logs.errors.push(LAYER_ITEM_PROP_ERROR_MAP[unsupportedProp]);
            }
        }
    )
};

export function getAssetMap(json) {
    return {
        id: "id",
        layers: {
            name: "layers",
            func: (x, path) => {
                let layers = [];
                if (Array.isArray(x)) {
                    x.forEach((element, index) => {
                        let item = parseLayer(element, `${path}[${index}]`, json);
                        if (item != null) {
                            layers.unshift(item);
                        }
                    });
                }
                return layers;
            }
        }
    };
}

const parseAsset = (asset, path, json) => {
    if (!asset) {
        return;
    }
    const ASSET_MAP = getAssetMap(json);
    let item = validateMap("Asset", asset, ASSET_MAP, path);
    fixParentLayers(item.layers);
    return item.layers;
};

/**
 * Apply Alpha Mattes to its previous layers
 */
const applyAlphaMatte = (items) => {
    let matteLayers = [];
    return items.slice().reverse().map((item: any) => {
        try {
            if (matteLayers.length > 0 && item._matteMode === 1) {
                let matteTargetItem = matteLayers.pop();
                matteTargetItem.items = item;
                return matteTargetItem;
            }
            if (item._matteTarget === 1) {
                let pathGroup = item._paths[0]?.group;
                let path = pathGroup._paths[0]?.path;

                if (pathGroup.translateX || pathGroup.translateY || pathGroup.scaleX || pathGroup.scaleY) {
                    path = parsePathData(
                        path,
                        pathGroup.translateX,
                        pathGroup.translateY,
                        pathGroup.scaleX,
                        pathGroup.scaleY
                    );
                }

                if (item.translateX || item.translateY || item.scaleX || item.scaleY) {
                    path = parsePathData(
                        path,
                        item.translateX,
                        item.translateY,
                        item.scaleX,
                        item.scaleY
                    );
                }

                let matteLayerWrapper = {
                    type: "group",
                    clipPath: pathData2Str(path),
                    _layerIndex: item._layerIndex
                };
                matteLayers.push(matteLayerWrapper);
                return undefined;
            } else {
                return item;
            }
        } catch (error) {
            return item;
        }
    }).reverse().filter((item) => !!item);
};

/**
 * Each layer can have a parent from which it inherits transformations.
 * Any layer which has one or more ancestors will be wrapped in groups
 * with appropriate transformations copied over.
 *
 * One needs to be careful about this because a re-parented item may have children.
 */
export const fixParentLayers = (items: any, emitter?: EventEmitter, completed?: number) => {
    // Create a map of layer index to layer
    const layerMap = {};
    items.forEach(item => {
        layerMap[item._layerIndex] = item;
    });

    // Fix up groups that have a parent
    // We modify the array in place
    for (let i = 0; i < items.length; i++) {
        let parentIndex = items[i]._parent;
        while (parentIndex !== undefined && layerMap[parentIndex]) {
            const parent = layerMap[parentIndex];
            if (hasTransform(parent)) {
                items[i] = {
                    type: 'group',
                    items: [items[i]],
                    _layerId: parentIndex
                };
                copyTransform(items[i], parent);
            }
            parentIndex = parent._parent;
        }
        if (emitter) updateConvertProgress(emitter, completed + (i / (items.length * 2)));
    }

    const parsedItems = items.reduce((acc, curr) => {
        const { _layerId, items } = curr;
        const findItem = acc.find(obj => _layerId && obj._layerId === _layerId);
        if (findItem) {
            findItem.items && findItem.items.push(...items);
        } else {
            acc.push(curr);
        }
        return acc;
    }, []);

    parsedItems.forEach(item => {
        if (item.items && Array.isArray(item.items) && item.items.some(obj => obj._matteMode || obj._matteTarget)) {
            // parse alpha matte in the sub-items
            item.items = applyAlphaMatte(item.items);
        }
    });

    return applyAlphaMatte(parsedItems);
};
