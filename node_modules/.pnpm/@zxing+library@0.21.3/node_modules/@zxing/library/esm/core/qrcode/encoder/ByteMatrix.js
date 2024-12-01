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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
var ByteMatrix = /** @class */ (function () {
    function ByteMatrix(width /*int*/, height /*int*/) {
        this.width = width;
        this.height = height;
        var bytes = new Array(height); // [height][width]
        for (var i = 0; i !== height; i++) {
            bytes[i] = new Uint8Array(width);
        }
        this.bytes = bytes;
    }
    ByteMatrix.prototype.getHeight = function () {
        return this.height;
    };
    ByteMatrix.prototype.getWidth = function () {
        return this.width;
    };
    ByteMatrix.prototype.get = function (x /*int*/, y /*int*/) {
        return this.bytes[y][x];
    };
    /**
     * @return an internal representation as bytes, in row-major order. array[y][x] represents point (x,y)
     */
    ByteMatrix.prototype.getArray = function () {
        return this.bytes;
    };
    // TYPESCRIPTPORT: preffer to let two methods instead of override to avoid type comparison inside
    ByteMatrix.prototype.setNumber = function (x /*int*/, y /*int*/, value /*byte|int*/) {
        this.bytes[y][x] = value;
    };
    // public set(x: number /*int*/, y: number /*int*/, value: number /*int*/): void {
    //   bytes[y][x] = (byte) value
    // }
    ByteMatrix.prototype.setBoolean = function (x /*int*/, y /*int*/, value) {
        this.bytes[y][x] = /*(byte) */ (value ? 1 : 0);
    };
    ByteMatrix.prototype.clear = function (value /*byte*/) {
        var e_1, _a;
        try {
            for (var _b = __values(this.bytes), _c = _b.next(); !_c.done; _c = _b.next()) {
                var aByte = _c.value;
                Arrays.fill(aByte, value);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    ByteMatrix.prototype.equals = function (o) {
        if (!(o instanceof ByteMatrix)) {
            return false;
        }
        var other = o;
        if (this.width !== other.width) {
            return false;
        }
        if (this.height !== other.height) {
            return false;
        }
        for (var y = 0, height = this.height; y < height; ++y) {
            var bytesY = this.bytes[y];
            var otherBytesY = other.bytes[y];
            for (var x = 0, width = this.width; x < width; ++x) {
                if (bytesY[x] !== otherBytesY[x]) {
                    return false;
                }
            }
        }
        return true;
    };
    /*@Override*/
    ByteMatrix.prototype.toString = function () {
        var result = new StringBuilder(); // (2 * width * height + 2)
        for (var y = 0, height = this.height; y < height; ++y) {
            var bytesY = this.bytes[y];
            for (var x = 0, width = this.width; x < width; ++x) {
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
    };
    return ByteMatrix;
}());
export default ByteMatrix;
