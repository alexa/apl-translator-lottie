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

import { ValidateException } from '../../modules/validate';
import { ERRORS, logs } from './deps';

export const enum PropTypes {
    ARRAY = 'array',
    OBJECT = 'object',
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean'
}

export const NO_TAG = '_';

export const primitiveTypeCheck = (v: any, expectedType: PropTypes): boolean => {
    switch (expectedType) {
        case PropTypes.ARRAY:
            return true;
        case PropTypes.NUMBER:
            return Number.isFinite(v);
        case PropTypes.STRING:
            return typeof v === 'string' || v instanceof String;
        case PropTypes.OBJECT:
            return typeof v === 'object' && v != null && !Array.isArray(v);
        default:
            return false;
    }
};

// merge declaration for optional method
export interface PropertySchema {
    doValidate?(val: any): boolean;
}

interface PropertySchemaParam {
    tag: string;
    extName: string;
    type: PropTypes;
    parent: PropertySchema;
    required?: boolean;
    notSupported?: boolean;
}

export class PropertySchema {
    protected _subPropSchemas: Map<string, PropertySchema>;
    protected _tag: string;
    protected _extName: string;
    protected _type: PropTypes;
    protected _parent: PropertySchema;
    protected _required: boolean;
    protected _notSupported: boolean;

    constructor({
        tag,
        extName,
        type,
        parent,
        required = false,
        notSupported = false
    }: PropertySchemaParam) {
        this._tag = tag;
        this._extName = extName;
        this._type = type;
        this._parent = parent;
        this._required = required;
        this._notSupported = notSupported;
    }

    public set subPropSchemas(props: Map<string, PropertySchema>) {
        this._subPropSchemas = props;
    }

    public get subPropSchemas() {
        return this._subPropSchemas;
    }

    public get tag() {
        return this._tag;
    }
    public get extName() {
        return this._extName;
    }
    public get type() {
        return this._type;
    }
    public get parent() {
        return this._parent;
    }
    public get notSupported() {
        return this._notSupported;
    }
    public get required() {
        return this._required;
    }

    public set parent(p: PropertySchema) {
        this._parent = p;
    }

    public validate(v: any): boolean {
        if (this.notSupported && this.required) {
            throw `${this.extName} can't be marked as required and notSupported at the same time!`;
        }
        if (this.notSupported) {
            ERRORS.NOT_SUPPORTED_FEATURE.message = `This ${this.tag}(${this.extName}) is not supported`;
            logs.errors.push(ERRORS.NOT_SUPPORTED_FEATURE);
            throw new ValidateException(
                ERRORS.NOT_SUPPORTED_FEATURE.message,
                this.getDataPath()
            );
        }
        if (!primitiveTypeCheck(v, this.type)) {
            ERRORS.NON_EXPECTED_TYPE.message = `Expect type ${
                this.type
            } for ${this.getDataPath()} ${this.tag}(${this.extName})`;
            logs.errors.push(ERRORS.NON_EXPECTED_TYPE);
            throw new ValidateException(
                ERRORS.NON_EXPECTED_TYPE.message,
                this.getDataPath()
            );
        }
        if (this.doValidate) {
            return this.doValidate(v);
        }
        return true;
    }

    // return unsupported or unidentified properties
    protected checkSubProperties(valueObj: any): Array<string> {
        return Object.keys(valueObj).filter((k) => {
            return !this.subPropSchemas.has(k);
        });
    }

    protected getPath(curPath: Array<string>, lvl: number): Array<string> {
        if (lvl > 500) {
            ERRORS.UNABLE_TO_PROCESS.message = `Too deep path!`;
            logs.errors.push(ERRORS.UNABLE_TO_PROCESS);
            throw `${ERRORS.UNABLE_TO_PROCESS.message}`;
        }
        if (this.tag !== NO_TAG) {
            curPath.push(this.tag);
        }
        if (this.parent) {
            this.parent.getPath(curPath, lvl + 1);
        }
        return curPath;
    }

    public getDataPath(): string {
        const lstPath: Array<string> = this.getPath([], 0);
        return lstPath.reverse().join('/');
    }

    public getValue(_obj: any, _relativePath: Array<string>): any {
        throw new Error('Implement your getValue function!');
    }
}
