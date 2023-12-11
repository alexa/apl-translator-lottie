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

import { parseDashProperty, parseGradientStops, parseShapeItemArray } from "./shape";
import { parseVertices } from "./transform";
import {
    groupShapeToPath,
    processEllipseShape,
    processPolyStarShape,
    processRectShape,
    processBlendMode,
    processSkewTransform,
    processFillRule
} from "./utils";
import { validateMap } from "./validate";
import { resources } from "./value";

export const COMMON_SHAPE_MAP = {
    ty: "_shapeContentType",
    mn: "_matchName",
    hd: "_hidden",
    nm: "_description",
};

export const TRIM_PATHS_SHAPE_MAP = Object.assign({
    s: {
        name: "_start",
        func: x => resources.makeSingleValue(x)  // Will be 0 to 100
    },
    e: {
        name: "_end",
        func: x => resources.makeSingleValue(x)   // Will be 0 to 100
    },
    o: {
        name: "_offset",     // Angle in degrees
        func: x => resources.makeSingleValue(x) 
    },
    m: "_trimMultipleShapes",  // 1=Simultaneously, 2=Individually
    ix: "_propertyIndex"
}, COMMON_SHAPE_MAP);

export const MERGE_PATHS_SHAPE_MAP = Object.assign({
    mm: "_mergeMode",  // 1=Merge, 2=Add, 3=Subtract, 4=Intersect, 5=ExcludeIntersections
}, COMMON_SHAPE_MAP);

export const TRANSFORM_SHAPE_MAP = Object.assign({
    a: {
        name: ["pivotX", "pivotY"],
        func: resources.makeMultipleValues
    },
    p: {
        name: ["_positionX", "_positionY"],
        func: resources.makeMultipleValues
    },
    r: {
        name: "rotation",
        func: resources.makeSingleValue
    },
    s: {
        name: ["scaleX", "scaleY"],
        func: x => resources.makeMultipleValues(x).map(y => y.multiply(0.01))
    },
    o: {
        name: "opacity",
        func: x => resources.makeSingleValue(x).multiply(0.01)
    },
    sk: {
        name: "_skew",
        func: processSkewTransform
    },
    sa: {
        name: "_skewAxis",
        func: resources.makeSingleValue
    }
}, COMMON_SHAPE_MAP);

export const GROUP_SHAPE_MAP = Object.assign({
    it: {
        name: "_items",
        func: parseShapeItemArray
    },
    np: "_numberOfProperties",
    cix: "_propertyCIndex",
    ix: "_propertyIndex",
    bm: {
        name: "_blendMode",
        func: processBlendMode
    }
}, COMMON_SHAPE_MAP);

export const RECTANGLE_SHAPE_MAP = Object.assign({
    d: "_direction",  // 1=normal, 2=reverse
    s: {
        name: ['_sizeX', '_sizeY'],
        func: resources.makeMultipleValues
    },
    p: {
        name: ["_positionX", "_positionY"],
        func: resources.makeMultipleValues
    },
    r: {
        name: "_round",  // Need to be trimmed to the smaller of 1/2 _sizeX, _sizeY
        func: resources.makeSingleValue
    }
}, COMMON_SHAPE_MAP);

export const ELLIPSE_SHAPE_MAP = Object.assign({
    d: "_direction",
    s: {
        name: ['_sizeX', '_sizeY'],
        func: resources.makeMultipleValues
    },
    p: {
        name: ["_positionX", "_positionY"],
        func: resources.makeMultipleValues
    }
}, COMMON_SHAPE_MAP);

export const POLY_STAR_SHAPE_MAP = Object.assign({
    d: "_direction",
    sy: "_polygonType",  // 1=Star, 2=Polygon
    pt: {
        name: '_pointCount',
        func: resources.makeSingleValue
    },
    p: {
        name: ["_positionX", "_positionY"],
        func: resources.makeMultipleValues
    },
    r: {
        name: "_rotation",
        func: resources.makeSingleValue
    },
    or: {
        name: "_outerRadius",
        func: resources.makeSingleValue
    },
    ir: {
        name: "_innerRadius",
        func: resources.makeSingleValue,
    },
    os: {
        name: "_outerRoundness",
        func: x => resources.makeSingleValue(x).multiply(0.01)
    },
    is: {
        name: "_innerRoundness",
        func: x => resources.makeSingleValue(x).multiply(0.01)
    },
    ix: "_propertyIndex"
}, COMMON_SHAPE_MAP);

export const GENERIC_SHAPE_MAP = Object.assign({
    ks: {
        name: "_pathData",
        func: parseVertices
    },
    ind: "_layerIndex",
    ix: "_propertyIndex"
}, COMMON_SHAPE_MAP);

export const FILL_SHAPE_MAP = Object.assign({
    o: {
        name: "_opacity",
        func: x => resources.makeSingleValue(x).multiply(0.01)
    },
    c: {
        name: ["_red", "_green", "_blue", "_alpha"],
        func: resources.makeMultipleValues
    },
    bm: {
        name: "_blendMode",
        func: processBlendMode
    },
    r: {
        name: "_fillRule",
        func: processFillRule
    }
}, COMMON_SHAPE_MAP);

export const GRADIENT_FILL_MAP = Object.assign({
    o: {
        name: "_opacity",
        func: x => resources.makeSingleValue(x).multiply(0.01)
    },
    r: {
        name: "_fillRule",
        func: processFillRule
    },  // 1=Non-Zero winding, 2=Even-Odd
    t: "_gradientType",  // 1=Linear, 2=Radial
    s: {
        name: "_startPoint",  // Absolute dimensions for linear
        func: resources.makeMultipleValues
    },
    e: {
        name: "_endPoint",    // Absolute dimensions for linear
        func: resources.makeMultipleValues
    },
    h: "_h",  // Scaled by 0.01
    a: "_angle",
    g: {
        name: "_gradientStop",
        func: parseGradientStops
    },
    bm: {
        name: "_blendMode",
        func: processBlendMode
    },
}, COMMON_SHAPE_MAP);

export const STROKE_SHAPE_MAP = Object.assign({
    o: {
        name: "_opacity",
        func: x => resources.makeSingleValue(x).multiply(0.01)
    },
    c: {
        name: ["_red", "_green", "_blue", "_alpha"],
        func: resources.makeMultipleValues
    },
    w: {
        name: "_width",
        func: resources.makeSingleValue
    },
    bm: {
        name: "_blendMode",
        func: processBlendMode
    },
    lc: "lineCap",  // 1=butt, 2=round, 3=square.  Default=2
    lj: "lineJoin", // 1=miter, 2=round, 3=bevel.  Default=2
    ml: "mitreLimit", // number
    ml2: {
        name: "mitreLimit2",
        func: resources.makeSingleValue
    },
    d: {
        name: "_dash",  // An array of lines and gaps and an offset
        func: parseDashProperty
    },
}, COMMON_SHAPE_MAP);

export const GRADIENT_STROKE_MAP = Object.assign({
    o: {
        name: "_opacity",
        func: x => resources.makeSingleValue(x).multiply(0.01)
    },
    w: {
        name: "_width",
        func: resources.makeSingleValue
    },
    g: {
        name: "_gradientStop",
        func: parseGradientStops
    },
    s: {
        name: "_startPoint",  // Absolute dimensions for linear
        func: resources.makeMultipleValues
    },
    e: {
        name: "_endPoint",    // Absolute dimensions for linear
        func: resources.makeMultipleValues
    },
    t: "_gradientType",  // 1=Linear, 2=Radial
    lc: "lineCap",  // 1=butt, 2=round, 3=square.  Default=2
    lj: "lineJoin", // 1=miter, 2=round, 3=bevel.  Default=2
    ml: "mitreLimit", // number
    ml2: {
        name: "_mitreLimit2",
        func: resources.makeSingleValue
    },
    bm: {
        name: "_blendMode",
        func: processBlendMode
    },
    h: {
        name: "_h",
        func: resources.makeSingleValue
    },
    a: {
        name: "_a",
        func: resources.makeSingleValue
    },
    d: {
        name: "_dash",  // An array of lines and gaps and an offset
        func: parseDashProperty
    },

}, COMMON_SHAPE_MAP);

export const SHAPES = {
    gr: (shape, path) => groupShapeToPath(validateMap("GroupShape", shape, GROUP_SHAPE_MAP, path)),
    sh: (shape, path) => validateMap("GenericShape", shape, GENERIC_SHAPE_MAP, path),
    el: (shape, path) => processEllipseShape(validateMap("EllipseShape", shape, ELLIPSE_SHAPE_MAP, path)),
    rc: (shape, path) => processRectShape(validateMap("RectangleShape", shape, RECTANGLE_SHAPE_MAP, path)),
    sr: (shape, path) => processPolyStarShape(validateMap("PolyStarShape", shape, POLY_STAR_SHAPE_MAP, path)),
    tr: (shape, path) => validateMap("TransformShape", shape, TRANSFORM_SHAPE_MAP, path),
    tm: (shape, path) => validateMap("TrimPaths", shape, TRIM_PATHS_SHAPE_MAP, path),
    mm: (shape, path) => validateMap("MergePaths", shape, MERGE_PATHS_SHAPE_MAP, path),
    fl: (shape, path) => validateMap("FillShape", shape, FILL_SHAPE_MAP, path),
    st: (shape, path) => validateMap("StrokeShape", shape, STROKE_SHAPE_MAP, path),
    gs: (shape, path) => validateMap("GradientStroke", shape, GRADIENT_STROKE_MAP, path),
    gf: (shape, path) => validateMap("GradientFill", shape, GRADIENT_FILL_MAP, path)
};

export const CONVERT_COMPLETED = 1; // constant to indicate convert progress is completed

export const TYPE = 'type';
export const ITEMS = 'items';
export const GROUP = 'group';
export const TRANSLATE = 'translate';
export const TRANSLATE_X = 'translateX';
export const TRANSLATE_Y = 'translateY';
export const PIVOT = 'pivot';
export const PIVOT_X = 'pivotX';
export const PIVOT_Y = 'pivotY';
export const ROTATION = 'rotation';
export const SCALE = 'scale';
export const SCALE_X = 'scaleX';
export const SCALE_Y = 'scaleY';
export const OPACITY = 'opacity';
export const CLIPPATH = 'clipPath';

export const PLAYBACK_SPEED_DEFAULT = 1.0;
export const REPEAT_MODE_DEFAULT = "restart";
export const REPEAT_COUNT_DEFAULT = -1;
