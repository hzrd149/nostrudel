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
/*namespace com.google.zxing.qrcode.encoder {*/
/*import java.util.Arrays;*/
import Arrays from '../../util/Arrays';
import StringBuilder from '../../util/StringBuilder';
/**
 * JAVAPORT: The original code was a 2D array of ints, but since it only ever gets assigned
 * -1, 0, and 1, I'm going to use less memory and go with bytes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
export default class ByteMatrix {
    constructor(width /*int*/, height /*int*/) {
        this.width = width;
        this.height = height;
        const bytes = new Array(height); // [height][width]
        for (let i = 0; i !== height; i++) {
            bytes[i] = new Uint8Array(width);
        }
        this.bytes = bytes;
    }
    getHeight() {
        return this.height;
    }
    getWidth() {
        return this.width;
    }
    get(x /*int*/, y /*int*/) {
        return this.bytes[y][x];
    }
    /**
     * @return an internal representation as bytes, in row-major order. array[y][x] represents point (x,y)
     */
    getArray() {
        return this.bytes;
    }
    // TYPESCRIPTPORT: preffer to let two methods instead of override to avoid type comparison inside
    setNumber(x /*int*/, y /*int*/, value /*byte|int*/) {
        this.bytes[y][x] = value;
    }
    // public set(x: number /*int*/, y: number /*int*/, value: number /*int*/): void {
    //   bytes[y][x] = (byte) value
    // }
    setBoolean(x /*int*/, y /*int*/, value) {
        this.bytes[y][x] = /*(byte) */ (value ? 1 : 0);
    }
    clear(value /*byte*/) {
        for (const aByte of this.bytes) {
            Arrays.fill(aByte, value);
        }
    }
    equals(o) {
        if (!(o instanceof ByteMatrix)) {
            return false;
        }
        const other = o;
        if (this.width !== other.width) {
            return false;
        }
        if (this.height !== other.height) {
            return false;
        }
        for (let y = 0, height = this.height; y < height; ++y) {
            const bytesY = this.bytes[y];
            const otherBytesY = other.bytes[y];
            for (let x = 0, width = this.width; x < width; ++x) {
                if (bytesY[x] !== otherBytesY[x]) {
                    return false;
                }
            }
        }
        return true;
    }
    /*@Override*/
    toString() {
        const result = new StringBuilder(); // (2 * width * height + 2)
        for (let y = 0, height = this.height; y < height; ++y) {
            const bytesY = this.bytes[y];
            for (let x = 0, width = this.width; x < width; ++x) {
                switch (bytesY[x]) {
                    case 0:
                        result.append(' 0');
                        break;
                    case 1:
                        result.append(' 1');
                        break;
                    default:
                        result.append('  ');
                        break;
                }
            }
            result.append('\n');
        }
        return result.toString();
    }
}
