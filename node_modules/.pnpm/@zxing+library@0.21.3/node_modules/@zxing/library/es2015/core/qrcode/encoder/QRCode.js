/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import StringBuilder from '../../util/StringBuilder';
/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author dswitkin@google.com (Daniel Switkin) - ported from C++
 */
export default class QRCode {
    constructor() {
        this.maskPattern = -1;
    }
    getMode() {
        return this.mode;
    }
    getECLevel() {
        return this.ecLevel;
    }
    getVersion() {
        return this.version;
    }
    getMaskPattern() {
        return this.maskPattern;
    }
    getMatrix() {
        return this.matrix;
    }
    /*@Override*/
    toString() {
        const result = new StringBuilder(); // (200)
        result.append('<<\n');
        result.append(' mode: ');
        result.append(this.mode ? this.mode.toString() : 'null');
        result.append('\n ecLevel: ');
        result.append(this.ecLevel ? this.ecLevel.toString() : 'null');
        result.append('\n version: ');
        result.append(this.version ? this.version.toString() : 'null');
        result.append('\n maskPattern: ');
        result.append(this.maskPattern.toString());
        if (this.matrix) {
            result.append('\n matrix:\n');
            result.append(this.matrix.toString());
        }
        else {
            result.append('\n matrix: null\n');
        }
        result.append('>>\n');
        return result.toString();
    }
    setMode(value) {
        this.mode = value;
    }
    setECLevel(value) {
        this.ecLevel = value;
    }
    setVersion(version) {
        this.version = version;
    }
    setMaskPattern(value /*int*/) {
        this.maskPattern = value;
    }
    setMatrix(value) {
        this.matrix = value;
    }
    // Check if "mask_pattern" is valid.
    static isValidMaskPattern(maskPattern /*int*/) {
        return maskPattern >= 0 && maskPattern < QRCode.NUM_MASK_PATTERNS;
    }
}
QRCode.NUM_MASK_PATTERNS = 8;
