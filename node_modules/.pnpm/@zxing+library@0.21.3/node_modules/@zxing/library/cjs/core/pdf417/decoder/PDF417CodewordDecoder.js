"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
// package com.google.zxing.pdf417.decoder;
// import com.google.zxing.common.detector.MathUtils;
var MathUtils_1 = require("../../common/detector/MathUtils");
// import com.google.zxing.pdf417.PDF417Common;
var PDF417Common_1 = require("../PDF417Common");
var Float_1 = require("../../util/Float");
/**
 * @author Guenther Grau
 * @author creatale GmbH (christoph.schulz@creatale.de)
 */
var PDF417CodewordDecoder = /** @class */ (function () {
    function PDF417CodewordDecoder() {
    }
    /* @note
     * this action have to be performed before first use of class
     * - static constructor
     * working with 32bit float (based from Java logic)
    */
    PDF417CodewordDecoder.initialize = function () {
        // Pre-computes the symbol ratio table.
        for ( /*int*/var i = 0; i < PDF417Common_1.default.SYMBOL_TABLE.length; i++) {
            var currentSymbol = PDF417Common_1.default.SYMBOL_TABLE[i];
            var currentBit = currentSymbol & 0x1;
            for ( /*int*/var j = 0; j < PDF417Common_1.default.BARS_IN_MODULE; j++) {
                var size = 0.0;
                while ((currentSymbol & 0x1) === currentBit) {
                    size += 1.0;
                    currentSymbol >>= 1;
                }
                currentBit = currentSymbol & 0x1;
                if (!PDF417CodewordDecoder.RATIOS_TABLE[i]) {
                    PDF417CodewordDecoder.RATIOS_TABLE[i] = new Array(PDF417Common_1.default.BARS_IN_MODULE);
                }
                PDF417CodewordDecoder.RATIOS_TABLE[i][PDF417Common_1.default.BARS_IN_MODULE - j - 1] = Math.fround(size / PDF417Common_1.default.MODULES_IN_CODEWORD);
            }
        }
        this.bSymbolTableReady = true;
    };
    PDF417CodewordDecoder.getDecodedValue = function (moduleBitCount) {
        var decodedValue = PDF417CodewordDecoder.getDecodedCodewordValue(PDF417CodewordDecoder.sampleBitCounts(moduleBitCount));
        if (decodedValue !== -1) {
            return decodedValue;
        }
        return PDF417CodewordDecoder.getClosestDecodedValue(moduleBitCount);
    };
    PDF417CodewordDecoder.sampleBitCounts = function (moduleBitCount) {
        var bitCountSum = MathUtils_1.default.sum(moduleBitCount);
        var result = new Int32Array(PDF417Common_1.default.BARS_IN_MODULE);
        var bitCountIndex = 0;
        var sumPreviousBits = 0;
        for ( /*int*/var i = 0; i < PDF417Common_1.default.MODULES_IN_CODEWORD; i++) {
            var sampleIndex = bitCountSum / (2 * PDF417Common_1.default.MODULES_IN_CODEWORD) +
                (i * bitCountSum) / PDF417Common_1.default.MODULES_IN_CODEWORD;
            if (sumPreviousBits + moduleBitCount[bitCountIndex] <= sampleIndex) {
                sumPreviousBits += moduleBitCount[bitCountIndex];
                bitCountIndex++;
            }
            result[bitCountIndex]++;
        }
        return result;
    };
    PDF417CodewordDecoder.getDecodedCodewordValue = function (moduleBitCount) {
        var decodedValue = PDF417CodewordDecoder.getBitValue(moduleBitCount);
        return PDF417Common_1.default.getCodeword(decodedValue) === -1 ? -1 : decodedValue;
    };
    PDF417CodewordDecoder.getBitValue = function (moduleBitCount) {
        var result = /*long*/ 0;
        for (var /*int*/ i = 0; i < moduleBitCount.length; i++) {
            for ( /*int*/var bit = 0; bit < moduleBitCount[i]; bit++) {
                result = (result << 1) | (i % 2 === 0 ? 1 : 0);
            }
        }
        return Math.trunc(result);
    };
    // working with 32bit float (as in Java)
    PDF417CodewordDecoder.getClosestDecodedValue = function (moduleBitCount) {
        var bitCountSum = MathUtils_1.default.sum(moduleBitCount);
        var bitCountRatios = new Array(PDF417Common_1.default.BARS_IN_MODULE);
        if (bitCountSum > 1) {
            for (var /*int*/ i = 0; i < bitCountRatios.length; i++) {
                bitCountRatios[i] = Math.fround(moduleBitCount[i] / bitCountSum);
            }
        }
        var bestMatchError = Float_1.default.MAX_VALUE;
        var bestMatch = -1;
        if (!this.bSymbolTableReady) {
            PDF417CodewordDecoder.initialize();
        }
        for ( /*int*/var j = 0; j < PDF417CodewordDecoder.RATIOS_TABLE.length; j++) {
            var error = 0.0;
            var ratioTableRow = PDF417CodewordDecoder.RATIOS_TABLE[j];
            for ( /*int*/var k = 0; k < PDF417Common_1.default.BARS_IN_MODULE; k++) {
                var diff = Math.fround(ratioTableRow[k] - bitCountRatios[k]);
                error += Math.fround(diff * diff);
                if (error >= bestMatchError) {
                    break;
                }
            }
            if (error < bestMatchError) {
                bestMatchError = error;
                bestMatch = PDF417Common_1.default.SYMBOL_TABLE[j];
            }
        }
        return bestMatch;
    };
    // flag that the table is ready for use
    PDF417CodewordDecoder.bSymbolTableReady = false;
    PDF417CodewordDecoder.RATIOS_TABLE = new Array(PDF417Common_1.default.SYMBOL_TABLE.length).map(function (x) { return x = new Array(PDF417Common_1.default.BARS_IN_MODULE); });
    return PDF417CodewordDecoder;
}());
exports.default = PDF417CodewordDecoder;
