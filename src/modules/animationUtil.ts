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
 * A util class for animation, there is only one singleton class instance in the application state
 *
 */
class AnimationUtil {
    private version = 1.1;
    private animeStart;
    private animeEnd;
    private animeFrameRate;

    setAnimeStart(val: number) {
        this.animeStart = val;
    }

    getAnimeStart(): number {
        return this.animeStart;
    }

    setAnimeEnd(val: number) {
        this.animeEnd = val;
    }

    getAnimeEnd(): number {
        return this.animeEnd;
    }

    setAnimeFrameRate(val: number) {
        this.animeFrameRate = val;
    }
    getAnimeFrameRate(): number {
        return this.animeFrameRate;
    }

    setVersion(v?: number) {
        if (v) this.version = v;
    }
}

const animationUtil = new AnimationUtil();
export default animationUtil;
