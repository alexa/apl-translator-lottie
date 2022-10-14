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

import { EventEmitter } from 'events';
import animationUtil from './animationUtil';
import * as Avg from '../avg/types';
import { ERRORS } from './errors';
import { logs } from "./logs";
import Box from './range';

export const pathData2Str = (path: any[]): string => {
    let ret = path.map(pd => pd.toString());
    return ret.join(' ');
};

export const roundNum = (num: number) => {
    return isNaN(num) ? num : Math.round(num)
};

export const convertToColor = (map) => {
    const r = roundNum(map._red.multiply(255).embed());
    const g = roundNum(map._green.multiply(255).embed());
    const b = roundNum(map._blue.multiply(255).embed());
    const a = map._alpha.multiply(map._opacity).embed();
    return `rgb(${r},${g},${b},${a})`
};

export const calculateGradientTransform = (bounds: Box) => {
    const width = bounds.isDefined() ? bounds.width() : 1;
    const height = bounds.isDefined() ? bounds.height() : 1;
    const sx = width < height ? 1 : height / width;
    const sy = height < width ? 1 : width / height;

    return `translate(0.5, 0.5) scale(${sx},${sy}) translate(-0.5,-0.5)`;
};

/**
 * Transform Radial Gradient
 * @param bounds The box of the gradient
 * @param cx Center X
 * @param cy Center Y
 */
const calculateRadialGradientTransform = (bounds: Box, cx: any, cy: any): string => {
    // radial is symmetric and boxed by a square, so we need to scale it with shorter one between x-axis and y-axis
    const width = bounds.isDefined() ? bounds.width() : 1;
    const height = bounds.isDefined() ? bounds.height() : 1;
    const sx = width < height ? 1 : height / width;
    const sy = height < width ? 1 : width / height;

    // after scale, the square box moved to the center of canvas,
    // we need to move the center back to proper position without change the scale
    let tr = [`scale(${sx},${sy})`];
    if (width < height) {
      tr.push(`translate(0, ${cy.multiply((height-width)/width).embed()})`)
    } else if (width > height) {
      tr.push(`translate(${cx.multiply((width-height)/height).embed()}, 0)`)
    } else {
      tr.unshift('translate(0.5, 0.5)');
      tr.push('translate(-0.5, -0.5)');
    }

    return tr.join(' ');
};


const calculateGradient = (map: any, bounds: Box) => {
    let left = bounds.isDefined() ? bounds.left() : 0;
    let top = bounds.isDefined() ? bounds.top() : 0;
    let width = bounds.isDefined() ? bounds.width() : 1;
    let height = bounds.isDefined() ? bounds.height() : 1;

    if (map._gradientType == 1) { // Linear gradient
        return {
          fill: {
            type: 'linear',
            _bounds: bounds,
            inputRange: map._gradientStop.inputRange,
            colorRange: map._gradientStop.colorRange,
            x1: map._startPoint[0].subtract(left).divide(width).embed(),
            x2: map._endPoint[0].subtract(left).divide(width).embed(),
            y1: map._startPoint[1].subtract(top).divide(height).embed(),
            y2: map._endPoint[1].subtract(top).divide(height).embed(),
          },
          transform: calculateGradientTransform(bounds)
        }
    } else { // Radial gradient
        const dx = map._endPoint[0].subtract(map._startPoint[0]).divide(width);
        const dy = map._endPoint[1].subtract(map._startPoint[1]).divide(height);
        const r = dx.multiply(dx).add(dy.multiply(dy)).wrap('Math.sqrt', Math.sqrt).embed();
        const cx = map._startPoint[0].subtract(left).divide(width)
        const cy = map._startPoint[1].subtract(top).divide(height)

        return {
          fill: {
            type: 'radial',
            inputRange: map._gradientStop.inputRange,
            colorRange: map._gradientStop.colorRange,
            centerX: cx.embed(),
            centerY: cy.embed(),
            radius: r
          },
          transform: calculateRadialGradientTransform(bounds, cx, cy)
        }
    }
}


export const processPolyStarShape = (x) => {
    let px = x._positionX;  // Center points
    let py = x._positionY;

    // Assume the poly count doesn't animate
    let count = x._pointCount.asNumber();
    let deltaAngle = 360 / count;

    let pathData = [];

    for (let i = 0; i < count; i++) {
        let omega = x._rotation.add(deltaAngle * i).multiply(Math.PI / 180);
        let px = omega.wrap('Math.sin', Math.sin).multiply(x._outerRadius).add(x._positionX);
        let py = omega.wrap('Math.cos', Math.cos).multiply(-1).multiply(x._outerRadius).add(x._positionY);
        if (i == 0) {
            pathData.push(Avg.createPathData(Avg.PathDataM, "M", px.embed(), py.embed()));
        } else {
            pathData.push(Avg.createPathData(Avg.PathDataL, "L", px.embed(), py.embed()));
        }

        if (x._polygonType == 1) {  // Star
            let omega = x._rotation.add(deltaAngle * (i + 0.5)).multiply(Math.PI / 180);
            let px = omega.wrap('Math.sin', Math.sin).multiply(x._innerRadius).add(x._positionX);
            let py = omega.wrap('Math.cos', Math.cos).multiply(-1).multiply(x._innerRadius).add(x._positionY);
            pathData.push(Avg.createPathData(Avg.PathDataL, "L", px.embed(), py.embed()));
        }
    }
    pathData.push(Avg.createPathData(Avg.PathDataZ, "z"));

    x['_pathData'] = pathData;

    if (px.isNumber() && py.isNumber() && x._outerRadius.isNumber()) {
        x['_bounds'] = new Box(
            px.subtract(x._outerRadius).embed(),
            py.subtract(x._outerRadius).embed(),
            px.add(x._outerRadius).embed(),
            py.add(x._outerRadius).embed());
    }

    return x;
};

export const processRectShape = (x) => {
    let pathData = [];

    let px = x._positionX;  // Center points
    let py = x._positionY;
    let w2 = x._sizeX.multiply(0.5);  // Half width
    let h2 = x._sizeY.multiply(0.5);  // Half height
    if (!x._round.equals(0)) {
        let r = x._round.wrap('Math.min', Math.min, w2, h2);
        let w2r = x._sizeX.subtract(r.multiply(2)).embed();
        let h2r = x._sizeY.subtract(r.multiply(2)).embed();
        let rr = r.embed();
        let nr = r.negate().embed();
        pathData.push(Avg.createPathData(Avg.PathDataM, "M", px.add(w2).subtract(r).embed(), py.subtract(h2).embed()));
        pathData.push(Avg.createPathData(Avg.PathDataA, "a", rr, rr, 0, 0, 1, rr, rr));
        pathData.push(Avg.createPathData(Avg.PathDataL, "l", 0, h2r));
        pathData.push(Avg.createPathData(Avg.PathDataA, "a", rr, rr, 0, 0, 1, nr, rr));
        pathData.push(Avg.createPathData(Avg.PathDataL, "l", -w2r, 0));
        pathData.push(Avg.createPathData(Avg.PathDataA, "a", rr, rr, 0, 0, 1, nr, nr));
        pathData.push(Avg.createPathData(Avg.PathDataL, "l", 0, -h2r));
        pathData.push(Avg.createPathData(Avg.PathDataA, "a", rr, rr, 0, 0, 1, rr, nr));
        pathData.push(Avg.createPathData(Avg.PathDataZ, "z"));
    } else {
        pathData.push(Avg.createPathData(Avg.PathDataM, "M", px.subtract(w2).embed(), py.subtract(h2).embed()));
        pathData.push(Avg.createPathData(Avg.PathDataL, "l", x._sizeX.embed(), 0));
        pathData.push(Avg.createPathData(Avg.PathDataL, "l", 0, x._sizeY.embed()));
        pathData.push(Avg.createPathData(Avg.PathDataL, "l", -x._sizeX.embed(), 0));
        pathData.push(Avg.createPathData(Avg.PathDataZ, "z"));
    }

    x['_pathData'] = pathData;

    if (px.isNumber() && py.isNumber() && w2.isNumber() && h2.isNumber()) {
        x['_bounds'] = new Box(
            px.subtract(w2).embed(),
            py.subtract(h2).embed(),
            px.add(w2).embed(),
            py.add(h2).embed());
    }

    return x;
};

export const processEllipseShape = (x) => {
    let px = x._positionX;  // Center points
    let py = x._positionY;
    let w2 = x._sizeX.multiply(0.5);
    let h2 = x._sizeY.multiply(0.5);

    x['_pathData'] = [
        Avg.createPathData(Avg.PathDataM, "M",py.embed(), px.subtract(w2).embed()),
        Avg.createPathData(Avg.PathDataA, "a", w2.embed(), h2.embed(), 0, 0, 1, 0, x._sizeX.embed()),
        Avg.createPathData(Avg.PathDataA, "a", w2.embed(), h2.embed(), 0, 0, 1, 0, x._sizeX.negate().embed())
    ];

    if (px.isNumber() && py.isNumber() && w2.isNumber() && h2.isNumber()) {
        x['_bounds'] = new Box(
            px.subtract(w2).embed(),
            py.subtract(h2).embed(),
            px.add(w2).embed(),
            py.add(h2).embed());
    }

    return x;
}

/**
 * This function looks for the Value-based transform properties and converts
 * them to group-style transform properties
 */
export const assignTransform = (map, transform) => {
    const { _positionX, _positionY, pivotX, pivotY, scaleX, scaleY, rotation, opacity } = transform;
    let tx = _positionX.subtract(pivotX);
    if (!tx.equals(0)) { map['translateX'] = tx.embed(); }

    let ty = _positionY.subtract(pivotY);
    if (!ty.equals(0)) { map['translateY'] = ty.embed(); }

    if (!pivotX?.equals(0)) { map['pivotX'] = pivotX?.embed(); }
    if (!pivotY?.equals(0)) { map['pivotY'] = pivotY?.embed(); }
    if (!scaleX?.equals(1)) { map['scaleX'] = scaleX?.embed(); }
    if (!scaleY?.equals(1)) { map['scaleY'] = scaleY?.embed(); }
    if (!rotation?.equals(0)) { map['rotation'] = rotation?.embed(); }
    if (!opacity?.equals(1)) { map['opacity'] = opacity?.embed(); }

    if (map._hasMask) {
        let clipPath = [];
        if (Array.isArray(map._masks)) {
            map._masks.forEach(x => {
                clipPath = clipPath.concat(x._points._path);
                if (!x._opacity?.equals(1)) { map.opacity = x._opacity?.embed(); }
            });
        }
        if (clipPath.length > 0) {
            map.clipPath = pathData2Str(clipPath);
        }
    }
};

const DEFAULT_TRANSFORM = {
    translateX: 0,
    translateY: 0,
    pivotX: 0,
    pivotY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0
};

/**
 * This function returns true if there is a transform that needs to be copied.
 */
export const hasTransform = (map) => {
    for (let [key, value] of Object.entries(DEFAULT_TRANSFORM)) {
        if (map.hasOwnProperty(key) && map[key] != value) {
            return true;
        }
    }
    return false;
};

/**
 * This method copies over _calculated transforms (where the Values have been resolved)
 */
export const copyTransform = (map, other) => {
    for (let [key, value] of Object.entries(DEFAULT_TRANSFORM)) {
        if (other.hasOwnProperty(key)) {
            let v = other[key];
            if (v != value) {
                map[key] = v;
            }
        }
    }
};

export const copyGroupAndApplyFillStroke = (fs, group) => {
    let result = {
        type: 'group',
        items: []
    };
    copyTransform(result, group);
    group._paths.forEach(pd => {
        if (pd.path) {
            let item = Object.assign({
                type: 'path',
                pathData: pathData2Str(pd.path)
            }, fs);
            result.items.unshift(item);
        } else {
            throw new Error(`Unexpected element in group._paths ${pd}`);
        }
    });
    return result;
};

const ELLIPSE: string = 'ellipse';

const hasLinearStrokeBounds = (fs: any): boolean => {
    return fs.stroke && fs.stroke.type === 'linear' && fs.stroke._bounds && fs.stroke._bounds.isDefined();
};

const fixEllipsePathData = (path: Avg.PathData[], fs: any): Avg.PathData[] => {
    if (!hasLinearStrokeBounds(fs)) {
        return path;
    }
    const bounds = fs.stroke._bounds;

    const left = bounds.left();
    const top = bounds.top();
    const width = bounds.width();
    const height = bounds.height();
    // Note: AVG box is x-axis to right, y-axis to bottom;
    //       Lottie Ellipse box is x-axis to right, y-axis to top !! 
    const mX = fs.stroke.x1 * width + left; // stroke start;
    const mY = -(fs.stroke.y1 * height + top);

    let segNum = 1;
    path = path.map(p => {
        switch (p.cmd) {
            case 'M':
                p.params[0] = mX;
                p.params[1] = mY;
                break;
            case 'a':
                // change endpoint, 'a' is relative, x/y, there are two ellipse segment
                // based on svg: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d (Ellipse Arc)
                p.params[5] = (segNum == 1 ? -mX : mX) * 2;
                p.params[6] = (segNum == 1 ? -mY : mY) * 2;
                segNum += 1;
                break;
        }
        return p;
    });
    return path;
};

/**
 * primitive shape like ellipse/rect etc should adjust their start/end point based on the stroke position
 */
const fixPathStartEnd = (shapeType: string, path: Avg.PathData[], fs) => {
    if (shapeType === ELLIPSE) {
        path = fixEllipsePathData(path, fs);
    }
    return path;
};


/**
 * Post-process a GroupShape.  This is recursive - group shapes can occur within group shapes.
 * 
 * Process depth first.
 * Build up a path tree - a path tree is a set of groups and paths for rendering.
 * Each time we get a fill or a stroke operation, we take the current path tree, apply the fill/stroke to it, and add it to the list of "draw this".
 * 
 * Because each shape can be stroked or filled multiple times, we have to carefully merge the "draw" this tree.
 * Finally, when we get to the top-level GroupShape we can convert all of the "draw this" items into actual items to render.
 */
export const groupShapeToPath = (map) => {
    const STROKE_LINE_CAP = ["", "butt", "round", "square"];
    const STROKE_LINE_JOIN = ["", "miter", "round", "bevel"];

    let bounds = new Box();
    let paths = [];  // Contains both paths and groups
    let items = [];
    let trimPaths;
    let topLevelTrimPathItemIndex = 0;
    let topLevelItemSize;

    // Apply a fill or stroke effect to each entry in the "paths" array.
    const applyFillStroke = (fs) => {
        paths.forEach(pd => {
            if (pd.path) {
                let path = pd.path;

                if (pd._primitiveShape === ELLIPSE) {
                    path = fixPathStartEnd(pd._primitiveShape, pd.path, fs);
                }

                let item = Object.assign({
                    type: 'path',
                    pathData: pathData2Str(path)
                }, fs);

                items.unshift(item);
            }
            else if (pd.group) {  // We have an entire item tree here.  Walk the tree, extract the paths, and render
                items.unshift(copyGroupAndApplyFillStroke(fs, pd.group));
            }
            else {
                throw new Error(`Unexpected element in paths ${pd}`);
            }
        });
    };

    const applyTrimPaths = (items, trimPath) => {
        items.forEach(item => {
            if (item.type === 'path') {
                let strokeDashStart = "(elapsedTime*" + animationUtil.getAnimeFrameRate() / 1000 + ")%"
                    + (animationUtil.getAnimeEnd() - animationUtil.getAnimeStart())
                    + "*" + topLevelItemSize + "-" + (animationUtil.getAnimeEnd() - animationUtil.getAnimeStart())
                    * (topLevelItemSize - topLevelTrimPathItemIndex - 1);
                // if item already contains strokeDashArray or strokeDashOffset, DO NOT override, and show error msg
                if (item.strokeDashArray || item.strokeDashOffset) {
                    logs.errors.push(ERRORS.PROPERTY_DASH_TRIM_PATH_COEXIST)
                } else {
                    let pathLength = 100; // Need to update this static number to dynamic based on Lottie file
                    let dist = trimPath._end;
                    let offsetDist: any = 0;
                    if (trimPath._end._v === 0) trimPath._end._v = pathLength;
                    if (trimPath._start._v === 0)
                        dist = trimPath._end.subtract(trimPath._start);
                    else
                        offsetDist = `-${trimPath._start.subtract(trimPath._offset).embed()}`;
                    let strokeDashArrayStart = dist.embed();
                    if (trimPath._trimMultipleShapes === 2) strokeDashArrayStart = strokeDashArrayStart.replace('frame', strokeDashStart);
                    Object.assign(item, {
                        pathLength,
                        strokeDashArray: [strokeDashArrayStart, pathLength],
                        strokeDashOffset: offsetDist
                    });
                }
                topLevelTrimPathItemIndex += 1
            }
            else if (item.type === 'group') {
                applyTrimPaths(item.items, trimPath);
            }
        });
    };

    // Main Loop - iterate over the shapes and build up the output tree
    try {
        map._items.forEach(x => {
            if (x._hidden) {
                return;
            }

            switch (x._type) {
                case 'GroupShape':
                    items.unshift(x);
                    paths.push({ group: x });
                    break;
                case 'GenericShape':
                    paths.push({ path: x._pathData._path });
                    if (x._pathData._bounds instanceof Box) {
                        bounds = bounds.combine(x._pathData._bounds);
                    }
                    break;
                case 'FillShape':
                    applyFillStroke({
                        fill: convertToColor(x)
                    });
                    break;
                case 'GradientFill':
                    const gf = calculateGradient(x, bounds);
                    applyFillStroke({
                        fill: gf.fill,
                        fillTransform: gf.transform
                    });
                    break;
                case 'StrokeShape':
                    applyFillStroke({
                        stroke: convertToColor(x),
                        strokeWidth: x._width.embed(),
                        strokeLineCap: STROKE_LINE_CAP[x.lineCap],
                        strokeLineJoin: STROKE_LINE_JOIN[x.lineJoin],
                        // strokeMiterLimit: 4
                        strokeDashArray: x._dash ? x._dash.strokeDashArray : undefined,
                        strokeDashOffset: x._dash ? x._dash.strokeDashOffset : undefined,
                    });
                    break;
                case 'GradientStroke':
                    const gs = calculateGradient(x, bounds);
                    applyFillStroke({
                        stroke: gs.fill,
                        strokeTransform: gs.transform,
                        strokeWidth: x._width.embed(),
                        strokeLineCap: STROKE_LINE_CAP[x.lineCap],
                        strokeLineJoin: STROKE_LINE_JOIN[x.lineJoin],
                        // strokeMiterLimit: 4
                        strokeDashArray: x._dash ? x._dash.strokeDashArray : undefined,
                        strokeDashOffset: x._dash ? x._dash.strokeDashOffset : undefined,
                    });
                    break;
                case 'TransformShape':
                    assignTransform(map, x);
                    break;
                case 'RectangleShape':
                    paths.push({ path: x._pathData });
                    if (x._bounds instanceof Box) {
                        bounds = bounds.combine(x._bounds)
                    }
                    break;
                case 'EllipseShape':
                    paths.push({ _primitiveShape: ELLIPSE, path: x._pathData });
                    if (x._bounds instanceof Box) {
                        bounds = bounds.combine(x._bounds)
                    }
                    break;
                case 'PolyStarShape':
                    paths.push({ path: x._pathData });
                    if (x._bounds instanceof Box) {
                        bounds = bounds.combine(x._bounds)
                    }
                    break;
                case 'MergePaths':
                    logs.errors.push(ERRORS.MERGE_PATHS);
                    if (x._mergeMode == 1) {
                        let pd = paths.reduce((accum, pd) => {
                            return pd.path && pd.path.length > 0 ? accum.concat(pd.path) : accum;
                        }, []);
                        paths = [{ path: pd }];
                    }
                    break;
                case 'TrimPaths':
                    paths.forEach(pd => {
                        pd.trim = x;
                    });
                    trimPaths = x;
                    break;
                default:
                    console.warn('Unrecognized shape item', x);
                    break;
            }
        });

        if (trimPaths) {
            topLevelItemSize = items.length;
            applyTrimPaths(items, trimPaths);
        }

        if (bounds) {
            map['_bounds'] = bounds;
        }

        map['items'] = items;
        map['type'] = 'group';
        map['_paths'] = paths;
    } catch (e) {
        console.error(e);
    }

    return map;
};

export const updateConvertProgress = (emitter: EventEmitter, progress: number) => {
    // fix to 2 decimal          
    emitter.emit('UpdateProgress', Math.floor(progress * 100) / 100);
};

export const processBlendMode = (mode: number) => {
    if (mode > 0) logs.errors.push(ERRORS.BLEND_MODE)
};

export const processSkewTransform = (skew) => {
    if (skew.a != 0 || skew.k != 0) logs.errors.push(ERRORS.SKEW_TRANSFORM)
};

export const processFillRule = (ruleType: number) => {
    if (ruleType == 2) logs.errors.push(ERRORS.FILL_RULE_EVEN_ODD)
};
