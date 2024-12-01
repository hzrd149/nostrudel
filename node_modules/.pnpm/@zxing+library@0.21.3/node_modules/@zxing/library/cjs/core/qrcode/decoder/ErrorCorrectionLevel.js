"use strict";
/*
 * Copyright 2007 ZXing authors
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCorrectionLevelValues = void 0;
/*namespace com.google.zxing.qrcode.decoder {*/
var ArgumentException_1 = require("../../ArgumentException");
var IllegalArgumentException_1 = require("../../IllegalArgumentException");
var ErrorCorrectionLevelValues;
(function (ErrorCorrectionLevelValues) {
    ErrorCorrectionLevelValues[ErrorCorrectionLevelValues["L"] = 0] = "L";
    ErrorCorrectionLevelValues[ErrorCorrectionLevelValues["M"] = 1] = "M";
    ErrorCorrectionLevelValues[ErrorCorrectionLevelValues["Q"] = 2] = "Q";
    ErrorCorrectionLevelValues[ErrorCorrectionLevelValues["H"] = 3] = "H";
})(ErrorCorrectionLevelValues = exports.ErrorCorrectionLevelValues || (exports.ErrorCorrectionLevelValues = {}));
/**
 * <p>See ISO 18004:2006, 6.5.1. This enum encapsulates the four error correction levels
 * defined by the QR code standard.</p>
 *
 * @author Sean Owen
 */
var ErrorCorrectionLevel = /** @class */ (function () {
    function ErrorCorrectionLevel(value, stringValue, bits /*int*/) {
        this.value = value;
        this.stringValue = stringValue;
        this.bits = bits;
        ErrorCorrectionLevel.FOR_BITS.set(bits, this);
        ErrorCorrectionLevel.FOR_VALUE.set(value, this);
    }
    ErrorCorrectionLevel.prototype.getValue = function () {
        return this.value;
    };
    ErrorCorrectionLevel.prototype.getBits = function () {
        return this.bits;
    };
    ErrorCorrectionLevel.fromString = function (s) {
        switch (s) {
            case 'L': return ErrorCorrectionLevel.L;
            case 'M': return ErrorCorrectionLevel.M;
            case 'Q': return ErrorCorrectionLevel.Q;
            case 'H': return ErrorCorrectionLevel.H;
            default: throw new ArgumentException_1.default(s + 'not available');
        }
    };
    ErrorCorrectionLevel.prototype.toString = function () {
        return this.stringValue;
    };
    ErrorCorrectionLevel.prototype.equals = function (o) {
        if (!(o instanceof ErrorCorrectionLevel)) {
            return false;
        }
        var other = o;
        return this.value === other.value;
    };
    /**
     * @param bits int containing the two bits encoding a QR Code's error correction level
     * @return ErrorCorrectionLevel representing the encoded error correction level
     */
    ErrorCorrectionLevel.forBits = function (bits /*int*/) {
        if (bits < 0 || bits >= ErrorCorrectionLevel.FOR_BITS.size) {
            throw new IllegalArgumentException_1.default();
        }
        return ErrorCorrectionLevel.FOR_BITS.get(bits);
    };
    ErrorCorrectionLevel.FOR_BITS = new Map();
    ErrorCorrectionLevel.FOR_VALUE = new Map();
    /** L = ~7% correction */
    ErrorCorrectionLevel.L = new ErrorCorrectionLevel(ErrorCorrectionLevelValues.L, 'L', 0x01);
    /** M = ~15% correction */
    ErrorCorrectionLevel.M = new ErrorCorrectionLevel(ErrorCorrectionLevelValues.M, 'M', 0x00);
    /** Q = ~25% correction */
    ErrorCorrectionLevel.Q = new ErrorCorrectionLevel(ErrorCorrectionLevelValues.Q, 'Q', 0x03);
    /** H = ~30% correction */
    ErrorCorrectionLevel.H = new ErrorCorrectionLevel(ErrorCorrectionLevelValues.H, 'H', 0x02);
    return ErrorCorrectionLevel;
}());
exports.default = ErrorCorrectionLevel;
