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

export const ERRORS = {
    PROPERTY_DASH_TRIM_PATH_COEXIST: {
        id: 'LOTTIE_ERRORS_DASH_AND_TRIM_PATH',
        type: 'property-dash',
        message:
            '"Dash" property and "Trim Path" on same object is not supported.'
    },
    BLEND_MODE: {
        id: 'LOTTIE_ERRORS_BLEND_MODE',
        type: 'blend-mode',
        message: '"Blend Modes" are not supported.'
    },
    MERGE_PATHS: {
        id: 'LOTTIE_ERRORS_MERGE_PATHS',
        type: 'merge-paths',
        message: 'The "Merge Paths" are not supported.'
    },
    SKEW_TRANSFORM: {
        id: 'LOTTIE_ERRORS_SKEW_TRANSFORM',
        type: 'skew-transform',
        message: 'Unable to convert Lottie files using skew transformations.'
    },
    FILL_RULE_EVEN_ODD: {
        id: 'LOTTIE_ERRORS_FILL_RULE_EVEN_ODD',
        type: 'fill-rule-even-odd',
        message: 'The "Even-odd" fill rule is not supported.'
    },
    MARKERS: {
        id: 'LOTTIE_ERRORS_MARKERS',
        type: 'markers',
        message: '"Markers" are not supported.'
    },
    UNRECOGNIZED_SHAPE: {
        type: 'unrecognized-shape',
        message: ''
    },
    UNKNOWN_KEY: {
        type: 'unknown-key',
        message: ''
    },
    UNABLE_TO_PROCESS: {
        type: 'unable-to-process',
        message: ''
    },
    UNSUPPORTED_BODYMOVIN_VERSION: {
        id: 'LOTTIE_ERRORS_UNSUPPORTED_VERSION',
        type: 'unsupported-bodymovin-version',
        message: 'APL currently best supports Bodymovin version 5.7.5. It looks like this Lottie file is created with a different Bodymovin version and some features might not be fully supported. Preview your animation to verify.'
    },
    NON_EXPECTED_TYPE: {
        id: 'LOTTIE_NON_EXPECTED_TYPE',
        message: ''
    },
    TOO_FEW_IN_ARRAY: {
        id: 'LOTTIE_TOO_FEW_IN_ARRAY',
        message: ''
    },
    TOO_MANY_IN_ARRAY: {
        id: 'LOTTIE_TOO_MANY_IN_ARRAY',
        message: ''
    },
    SHOULDBE_ONE_OF_TYPES: {
        id: 'LOTTIE_ONE_OF_TYPES',
        message: ''
    },
    NOT_SUPPORTED_FEATURE: {
        id: 'LOTTIE_NOT_SUPPORTED',
        message: ''
    },
    ALPHA_GRADIENT_LOCATION_MISMATCH: {
        type: 'alpha-gradient-location',
        message: 'Different locations for rgb and alpha codes are not currently supported, resulting in altered opacity. For optimal results, alpha should be located directly with rgb.'
    }
};

export const SHAPE_ITEM_TYPE_ERROR_MAP = {
    rp: {
        id: 'LOTTIE_ERRORS_REPEATER',
        type: 'repeater',
        message: '"Repeater" is not supported.'
    },
    rd: {
        id: 'LOTTIE_ERRORS_ROUND_CORNERS',
        type: 'add-rd',
        message: 'The "Round Corners" path operation is not supported.'
    },
    op: {
        id: 'LOTTIE_ERRORS_OUT_POINT',
        type: 'out-point',
        message:
            '"Out point" is not fully supported for trimming your composition.'
    }
};

export const LAYER_ITEM_TYPE_ERROR_MAP = {
    5: {
        id: 'LOTTIE_ERRORS_TEXT_LAYER',
        type: 'text-layer',
        message: '"Text" layer is not supported.'
    },
    2: {
        id: 'LOTTIE_ERRORS_IMAGE_LAYER',
        type: 'image-layer',
        message: '"Images" layer is not supported.'
    }
};

export const LAYER_ITEM_PROP_ERROR_MAP = {
    sr: {
        id: 'LOTTIE_ERRORS_TIME_STRETCH',
        type: 'property-time-stretch',
        message: '"Time Stretch" property is not supported.'
    },
    tm: {
        id: 'LOTTIE_ERRORS_TIME_REMAP',
        type: 'property-time-remap',
        message: '"Time Remap" property is not supported.'
    },
    ef: {
        id: 'LOTTIE_ERRORS_EFFECTS',
        type: 'property-effects',
        message: '"Effects" property is not fully supported.'
    },
    hasMask: {
        id: 'LOTTIE_ERRORS_MASK',
        type: 'has-mask',
        message: '"Mask" property is not fully supported.'
    },
    tt: {
        id: 'LOTTIE_ERRORS_MATTES',
        type: 'has-mattes',
        message: '"Mattes" property is not fully supported. We only support Matte Mode "Normal" ("tt" = 0) and "Alpha" ("tt" = 1).'
    },
    cl: {
        id: 'LOTTIE_ERRORS_CLASS',
        type: 'property-class',
        message: '"Class" property is not fully supported.'
    },
    hix: {
        id: 'LOTTIE_ERRORS_HIX',
        type: 'property-hix',
        message: '"Hix" property is not fully supported.'
    },
    ddd: {
        id: 'LOTTIE_ERRORS_3D',
        type: 'layer-3d',
        message: 'Unable to convert Lottie files using 3D Effects.'
    }
};
