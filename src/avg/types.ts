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

export type PathDataCommand =
    | 'M'
    | 'm'
    | 'L'
    | 'l'
    | 'H'
    | 'h'
    | 'V'
    | 'v'
    | 'C'
    | 'c'
    | 'S'
    | 's'
    | 'Q'
    | 'q'
    | 'T'
    | 't'
    | 'A'
    | 'a'
    | 'Z'
    | 'z';
export abstract class PathData {
    cmd: string;
    params: any[];

    constructor(cmd: PathDataCommand, params?: Array<any>) {
        this.cmd = cmd;
        this.params = params || [];
    }

    public toString(): string {
        if (this.params) {
            return `${this.cmd}${this.params.join(',')}`;
        }
        return this.cmd;
    }
}

export class PathDataM extends PathData {
    constructor(cmd: 'M' | 'm', x: number, y: number) {
        super(cmd, [x, y]);
    }
}

export class PathDataL extends PathData {
    constructor(cmd: 'L' | 'l', x: number, y: number) {
        super(cmd, [x, y]);
    }
}
export class PathDataH extends PathData {
    constructor(cmd: 'H' | 'h', x: number) {
        super(cmd, [x]);
    }
}

export class PathDataV extends PathData {
    constructor(cmd: 'V' | 'v', y: number) {
        super(cmd, [y]);
    }
}
export class PathDataC extends PathData {
    constructor(cmd: 'C' | 'c', x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
        super(cmd, [x1, y1, x2, y2, x, y]);
    }

    public toString(): string {
        return `${this.cmd}${this.params[0]},${this.params[1]} ${this.params[2]},${this.params[3]} ${this.params[4]},${this.params[5]}`;
    }
}
export class PathDataS extends PathData {
    constructor(cmd: 'S' | 's', x2: number, y2: number, x: number, y: number) {
        super(cmd, [x2, y2, x, y]);
    }

    public toString(): string {
        return `${this.cmd}${this.params[0]},${this.params[1]} ${this.params[2]},${this.params[3]}`;
    }
}
export class PathDataQ extends PathData {
    constructor(cmd: 'Q' | 'q', x1: number, y1: number, x: number, y: number) {
        super(cmd, [x1, y1, x, y]);
    }

    public toString(): string {
        return `${this.cmd}${this.params[0]},${this.params[1]} ${this.params[2]},${this.params[3]}`;
    }
}
export class PathDataT extends PathData {
    constructor(cmd: 'T' | 't', x: number, y: number) {
        super(cmd, [x, y]);
    }
}
export class PathDataA extends PathData {
    constructor(
        cmd: 'A' | 'a',
        rx: number,
        ry: number,
        angle: number,
        large_arc_flag: number,
        sweep_flag: number,
        x: number,
        y: number
    ) {
        super(cmd, [rx, ry, angle, large_arc_flag, sweep_flag, x, y]);
        if (large_arc_flag == undefined || sweep_flag == undefined) {
            console.trace();
            throw 'undefined param in PathDataA';
        }
    }

    public toString(): string {
        return `${this.cmd}${this.params.slice(0, 2).join(',')} ${this.params.slice(2, 5).join(' ')}  ${this.params
            .slice(5)
            .join(',')}`;
    }
}
export class PathDataZ extends PathData {
    constructor(cmd: 'Z' | 'z') {
        super(cmd, []);
    }
}

export function createPathData<T>(type: { new (...args): T }, ...args): T {
    return new type(...args);
}
