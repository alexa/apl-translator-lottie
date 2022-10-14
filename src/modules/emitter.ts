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

import { EventEmitter } from "events";

export class Emitter extends EventEmitter {
    private static instance: EventEmitter;

    public static getInstance(): EventEmitter {
        if (!Emitter.instance) {
            Emitter.instance = new EventEmitter();
        }
        return Emitter.instance;
    }

    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }   
}
