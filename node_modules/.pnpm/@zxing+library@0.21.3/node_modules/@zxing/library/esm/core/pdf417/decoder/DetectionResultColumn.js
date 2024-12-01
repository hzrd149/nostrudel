/*
 * Copyright 2013 ZXing authors
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
// package com.google.zxing.pdf417.decoder;
// import java.util.Formatter;
import Formatter from '../../util/Formatter';
import BoundingBox from './BoundingBox';
/**
 * @author Guenther Grau
 */
var DetectionResultColumn = /** @class */ (function () {
    function DetectionResultColumn(boundingBox) {
        this.boundingBox = new BoundingBox(boundingBox);
        // this.codewords = new Codeword[boundingBox.getMaxY() - boundingBox.getMinY() + 1];
        this.codewords = new Array(boundingBox.getMaxY() - boundingBox.getMinY() + 1);
    }
    /*final*/ DetectionResultColumn.prototype.getCodewordNearby = function (imageRow) {
        var codeword = this.getCodeword(imageRow);
        if (codeword != null) {
            return codeword;
        }
        for (var i = 1; i < DetectionResultColumn.MAX_NEARBY_DISTANCE; i++) {
            var nearImageRow = this.imageRowToCodewordIndex(imageRow) - i;
            if (nearImageRow >= 0) {
                codeword = this.codewords[nearImageRow];
                if (codeword != null) {
                    return codeword;
                }
            }
            nearImageRow = this.imageRowToCodewordIndex(imageRow) + i;
            if (nearImageRow < this.codewords.length) {
                codeword = this.codewords[nearImageRow];
                if (codeword != null) {
                    return codeword;
                }
            }
        }
        return null;
    };
    /*final int*/ DetectionResultColumn.prototype.imageRowToCodewordIndex = function (imageRow) {
        return imageRow - this.boundingBox.getMinY();
    };
    /*final void*/ DetectionResultColumn.prototype.setCodeword = function (imageRow, codeword) {
        this.codewords[this.imageRowToCodewordIndex(imageRow)] = codeword;
    };
    /*final*/ DetectionResultColumn.prototype.getCodeword = function (imageRow) {
        return this.codewords[this.imageRowToCodewordIndex(imageRow)];
    };
    /*final*/ DetectionResultColumn.prototype.getBoundingBox = function () {
        return this.boundingBox;
    };
    /*final*/ DetectionResultColumn.prototype.getCodewords = function () {
        return this.codewords;
    };
    // @Override
    DetectionResultColumn.prototype.toString = function () {
        var e_1, _a;
        var formatter = new Formatter();
        var row = 0;
        try {
            for (var _b = __values(this.codewords), _c = _b.next(); !_c.done; _c = _b.next()) {
                var codeword = _c.value;
                if (codeword == null) {
                    formatter.format('%3d:    |   %n', row++);
                    continue;
                }
                formatter.format('%3d: %3d|%3d%n', row++, codeword.getRowNumber(), codeword.getValue());
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return formatter.toString();
    };
    DetectionResultColumn.MAX_NEARBY_DISTANCE = 5;
    return DetectionResultColumn;
}());
export default DetectionResultColumn;
