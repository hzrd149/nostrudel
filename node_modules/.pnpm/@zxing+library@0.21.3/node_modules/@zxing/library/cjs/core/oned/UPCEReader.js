"use strict";
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
var UPCEANReader_1 = require("./UPCEANReader");
var StringBuilder_1 = require("../util/StringBuilder");
var NotFoundException_1 = require("../NotFoundException");
var BarcodeFormat_1 = require("../BarcodeFormat");
// package com.google.zxing.oned;
// import com.google.zxing.BarcodeFormat;
// import com.google.zxing.FormatException;
// import com.google.zxing.NotFoundException;
// import com.google.zxing.common.BitArray;
/**
 * <p>Implements decoding of the UPC-E format.</p>
 * <p><a href="http://www.barcodeisland.com/upce.phtml">This</a> is a great reference for
 * UPC-E information.</p>
 *
 * @author Sean Owen
 *
 * @source https://github.com/zxing/zxing/blob/3c96923276dd5785d58eb970b6ba3f80d36a9505/core/src/main/java/com/google/zxing/oned/UPCEReader.java
 *
 * @experimental
 */
var UPCEReader = /** @class */ (function (_super) {
    __extends(UPCEReader, _super);
    function UPCEReader() {
        var _this = _super.call(this) || this;
        _this.decodeMiddleCounters = new Int32Array(4);
        return _this;
    }
    /**
     * @throws NotFoundException
     */
    // @Override
    UPCEReader.prototype.decodeMiddle = function (row, startRange, result) {
        var e_1, _a;
        var counters = this.decodeMiddleCounters.map(function (x) { return x; });
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        var end = row.getSize();
        var rowOffset = startRange[1];
        var lgPatternFound = 0;
        for (var x = 0; x < 6 && rowOffset < end; x++) {
            var bestMatch = UPCEReader.decodeDigit(row, counters, rowOffset, UPCEReader.L_AND_G_PATTERNS);
            result += String.fromCharCode(('0'.charCodeAt(0) + bestMatch % 10));
            try {
                for (var counters_1 = (e_1 = void 0, __values(counters)), counters_1_1 = counters_1.next(); !counters_1_1.done; counters_1_1 = counters_1.next()) {
                    var counter = counters_1_1.value;
                    rowOffset += counter;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (counters_1_1 && !counters_1_1.done && (_a = counters_1.return)) _a.call(counters_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (bestMatch >= 10) {
                lgPatternFound |= 1 << (5 - x);
            }
        }
        UPCEReader.determineNumSysAndCheckDigit(new StringBuilder_1.default(result), lgPatternFound);
        return rowOffset;
    };
    /**
     * @throws NotFoundException
     */
    // @Override
    UPCEReader.prototype.decodeEnd = function (row, endStart) {
        return UPCEReader.findGuardPatternWithoutCounters(row, endStart, true, UPCEReader.MIDDLE_END_PATTERN);
    };
    /**
     * @throws FormatException
     */
    // @Override
    UPCEReader.prototype.checkChecksum = function (s) {
        return UPCEANReader_1.default.checkChecksum(UPCEReader.convertUPCEtoUPCA(s));
    };
    /**
     * @throws NotFoundException
     */
    UPCEReader.determineNumSysAndCheckDigit = function (resultString, lgPatternFound) {
        for (var numSys = 0; numSys <= 1; numSys++) {
            for (var d = 0; d < 10; d++) {
                if (lgPatternFound === this.NUMSYS_AND_CHECK_DIGIT_PATTERNS[numSys][d]) {
                    resultString.insert(0, /*(char)*/ ('0' + numSys));
                    resultString.append(/*(char)*/ ('0' + d));
                    return;
                }
            }
        }
        throw NotFoundException_1.default.getNotFoundInstance();
    };
    // @Override
    UPCEReader.prototype.getBarcodeFormat = function () {
        return BarcodeFormat_1.default.UPC_E;
    };
    /**
     * Expands a UPC-E value back into its full, equivalent UPC-A code value.
     *
     * @param upce UPC-E code as string of digits
     * @return equivalent UPC-A code as string of digits
     */
    UPCEReader.convertUPCEtoUPCA = function (upce) {
        // the following line is equivalent to upce.getChars(1, 7, upceChars, 0);
        var upceChars = upce.slice(1, 7).split('').map(function (x) { return x.charCodeAt(0); });
        var result = new StringBuilder_1.default( /*12*/);
        result.append(upce.charAt(0));
        var lastChar = upceChars[5];
        switch (lastChar) {
            case 0:
            case 1:
            case 2:
                result.appendChars(upceChars, 0, 2);
                result.append(lastChar);
                result.append('0000');
                result.appendChars(upceChars, 2, 3);
                break;
            case 3:
                result.appendChars(upceChars, 0, 3);
                result.append('00000');
                result.appendChars(upceChars, 3, 2);
                break;
            case 4:
                result.appendChars(upceChars, 0, 4);
                result.append('00000');
                result.append(upceChars[4]);
                break;
            default:
                result.appendChars(upceChars, 0, 5);
                result.append('0000');
                result.append(lastChar);
                break;
        }
        // Only append check digit in conversion if supplied
        if (upce.length >= 8) {
            result.append(upce.charAt(7));
        }
        return result.toString();
    };
    /**
     * The pattern that marks the middle, and end, of a UPC-E pattern.
     * There is no "second half" to a UPC-E barcode.
     */
    UPCEReader.MIDDLE_END_PATTERN = Int32Array.from([1, 1, 1, 1, 1, 1]);
    // For an UPC-E barcode, the final digit is represented by the parities used
    // to encode the middle six digits, according to the table below.
    //
    //                Parity of next 6 digits
    //    Digit   0     1     2     3     4     5
    //       0    Even   Even  Even Odd  Odd   Odd
    //       1    Even   Even  Odd  Even Odd   Odd
    //       2    Even   Even  Odd  Odd  Even  Odd
    //       3    Even   Even  Odd  Odd  Odd   Even
    //       4    Even   Odd   Even Even Odd   Odd
    //       5    Even   Odd   Odd  Even Even  Odd
    //       6    Even   Odd   Odd  Odd  Even  Even
    //       7    Even   Odd   Even Odd  Even  Odd
    //       8    Even   Odd   Even Odd  Odd   Even
    //       9    Even   Odd   Odd  Even Odd   Even
    //
    // The encoding is represented by the following array, which is a bit pattern
    // using Odd = 0 and Even = 1. For example, 5 is represented by:
    //
    //              Odd Even Even Odd Odd Even
    // in binary:
    //                0    1    1   0   0    1   == 0x19
    //
    /**
     * See {@link #L_AND_G_PATTERNS}; these values similarly represent patterns of
     * even-odd parity encodings of digits that imply both the number system (0 or 1)
     * used, and the check digit.
     */
    UPCEReader.NUMSYS_AND_CHECK_DIGIT_PATTERNS = [
        Int32Array.from([0x38, 0x34, 0x32, 0x31, 0x2C, 0x26, 0x23, 0x2A, 0x29, 0x25]),
        Int32Array.from([0x07, 0x0B, 0x0D, 0x0E, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1]),
    ];
    return UPCEReader;
}(UPCEANReader_1.default));
exports.default = UPCEReader;
