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
 * Validation methods.
 *
 * These methods take raw BodyMovin object data and check to see if each property
 * in the object has a matching property we are capturing.
 */

import { ERRORS } from './errors';
import { logs } from './logs';

interface mapObject {
    [key: string]: any;
}

export class ValidateException extends Error {
    constructor(
        public message: string,
        public path: string,
        public object?: any,
        public schema?: string
    ) {
        super(path);
        this.message = message;
        this.path = path;
        this.object = object;
        this.schema = schema;
    }

    toString() {
        return `${this.message} @${this.path}`;
    }
}

/**
 * Verify that the map passed in contains only keys as specified by the "keys" list.
 * Warn the user if an unrecognized key is received.
 * @param {*} msg The warning message prefix to show on the console
 * @param {*} map The object map to check for keys
 * @param  {...any} keys A list of keys which we expect to appear in the map
 */
export const validate = (msg, map, ...keys): void => {
    let s = new Set(keys);
    for (const key in map) {
        if (map.hasOwnProperty(key)) {
            if (!s.has(key) && !['TextLayer', 'ImageLayer'].includes(msg)) {
                // note: limit the json str len 
                ERRORS.UNKNOWN_KEY.message = `Unknown key ${key} in ${msg} value=${JSON.stringify(map[key]).substring(0,30)} ..`;
                logs.errors.push(ERRORS.UNKNOWN_KEY);
            }
        }
    }
};

/**
 * Schema validation with value extraction.
 *
 * This method takes an object and a schema.  It verifies that the
 * object has the properties listed in the schema, throwing an exception if there
 * is an error.  It can also verify that arrays and primitive objects have matching sizes.
 *
 * The schema format is { type: TYPE, required: BOOLEAN ... } for each type of object.
 * The basic schemas are:
 *
 * {
 *   type: 'boolean' | 'string' | 'number',
 *   required: BOOLEAN,  // If true, this property must exist
 *   storeValue: NAME    // If set, store this value as NAME in the result map.  It must be the same everywhere.
 * }
 *
 * {
 *   type: 'array',
 *   required: BOOLEAN,  // If true, this property must exist
 *   count: NUMBER,      // If set, the expected length of the array
 *   storeSize: NAME,    // If set, store the length of this array as NAME in the result map.  It must be the same everywhere.
 *   item: SCHEMA        // Defines the schema of each item in the array
 * }
 *
 * {
 *   type: 'object',
 *   required: BOOLEAN,  // If true, this property must exist
 *   properties: {       // Map of property names to schemas
 *      NAME: SCHEMA,
 *      NAME: SCHEMA,
 *      ...
 *   }
 * }
 */

/**
 * Verify that the map passed in contains only the keys as specified in the expected map.
 * For each matching property we pass it through an optional function and wrapper.
 */
export const validateMap = (type, value, map, jsonPath): mapObject => {
    if (jsonPath === undefined) {
        console.error('Undefined path');
        console.trace();
        throw new Error('Undefined path');
    }
    let result = {
        _type: type,
        _path: jsonPath,
        _color: undefined,
        _width: undefined,
        _height: undefined,
        _referenceId: undefined,
        layers: undefined
    };

    for (let key in value) {
        const localPath = `${jsonPath}.${key}`;

        let v = value[key];
        if (!value.hasOwnProperty(key)) {
            continue;
        }

        if (!(key in map)) {
            ERRORS.UNKNOWN_KEY.message = `Unknown key ${key} in ${type} value=${v} at ${localPath}`;
            logs.errors.push(ERRORS.UNKNOWN_KEY);
        }

        let entry = map[key];
        if (!entry) {
            ERRORS.UNABLE_TO_PROCESS.message = `Unable to process entry ${key} at ${localPath}`;
            logs.errors.push(ERRORS.UNABLE_TO_PROCESS);
        } else if (typeof entry === 'string') {
            // No function, no scaling
            result[entry] = v;
        } else if (typeof entry.name === 'string') {
            // Single value, one function, may have scaling
            v = entry.func ? entry.func(v, localPath) : v;
            result[entry.name] = v;
        } else if (Array.isArray(entry.name)) {
            v = entry.func ? entry.func(v, localPath) : v;

            if (!v || v.length < entry.name.length) {
                throw new ValidateException(
                    'Expected a result array but it is smaller than the entry array',
                    localPath
                );
            } else {
                for (let i = 0; i < entry.name.length; i++) {
                    result[entry.name[i]] = v[i];
                }
            }
        } else {
            throw new ValidateException(
                `Unrecognized map value at key=${key} value=${entry}`,
                localPath
            );
        }
    }
    return result;
};
