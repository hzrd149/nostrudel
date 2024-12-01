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
/*namespace com.google.zxing.oned {*/
var BarcodeFormat_1 = require("../BarcodeFormat");
var DecodeHintType_1 = require("../DecodeHintType");
var FormatException_1 = require("../FormatException");
var NotFoundException_1 = require("../NotFoundException");
var Result_1 = require("../Result");
var ResultPoint_1 = require("../ResultPoint");
var StringBuilder_1 = require("../util/StringBuilder");
var System_1 = require("../util/System");
var OneDReader_1 = require("./OneDReader");
/**
 * <p>Decodes ITF barcodes.</p>
 *
 * @author Tjieco
 */
var ITFReader = /** @class */ (function (_super) {
    __extends(ITFReader, _super);
    function ITFReader() {
        // private static W = 3; // Pixel width of a 3x wide line
        // private static w = 2; // Pixel width of a 2x wide line
        // private static N = 1; // Pixed width of a narrow line
        var _this = _super !== null && _super.apply(this, arguments) || this;
        // Stores the actual narrow line width of the image being decoded.
        _this.narrowLineWidth = -1;
        return _this;
    }
    // See ITFWriter.PATTERNS
    /*
  
    /!**
     * Patterns of Wide / Narrow lines to indicate each digit
     *!/
    */
    ITFReader.prototype.decodeRow = function (rowNumber, row, hints) {
        var e_1, _a;
        // Find out where the Middle section (payload) starts & ends
        var startRange = this.decodeStart(row);
        var endRange = this.decodeEnd(row);
        var result = new StringBuilder_1.default();
        ITFReader.decodeMiddle(row, startRange[1], endRange[0], result);
        var resultString = result.toString();
        var allowedLengths = null;
        if (hints != null) {
            allowedLengths = hints.get(DecodeHintType_1.default.ALLOWED_LENGTHS);
        }
        if (allowedLengths == null) {
            allowedLengths = ITFReader.DEFAULT_ALLOWED_LENGTHS;
        }
        // To avoid false positives with 2D barcodes (and other patterns), make
        // an assumption that the decoded string must be a 'standard' length if it's short
        var length = resultString.length;
        var lengthOK = false;
        var maxAllowedLength = 0;
        try {
            for (var allowedLengths_1 = __values(allowedLengths), allowedLengths_1_1 = allowedLengths_1.next(); !allowedLengths_1_1.done; allowedLengths_1_1 = allowedLengths_1.next()) {
                var value = allowedLengths_1_1.value;
                if (length === value) {
                    lengthOK = true;
                    break;
                }
                if (value > maxAllowedLength) {
                    maxAllowedLength = value;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (allowedLengths_1_1 && !allowedLengths_1_1.done && (_a = allowedLengths_1.return)) _a.call(allowedLengths_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (!lengthOK && length > maxAllowedLength) {
            lengthOK = true;
        }
        if (!lengthOK) {
            throw new FormatException_1.default();
        }
        var points = [new ResultPoint_1.default(startRange[1], rowNumber), new ResultPoint_1.default(endRange[0], rowNumber)];
        var resultReturn = new Result_1.default(resultString, null, // no natural byte representation for these barcodes
        0, points, BarcodeFormat_1.default.ITF, new Date().getTime());
        return resultReturn;
    };
    /*
    /!**
     * @param row          row of black/white values to search
     * @param payloadStart offset of start pattern
     * @param resultString {@link StringBuilder} to append decoded chars to
     * @throws NotFoundException if decoding could not complete successfully
     *!/*/
    ITFReader.decodeMiddle = function (row, payloadStart, payloadEnd, resultString) {
        // Digits are interleaved in pairs - 5 black lines for one digit, and the
        // 5
        // interleaved white lines for the second digit.
        // Therefore, need to scan 10 lines and then
        // split these into two arrays
        var counterDigitPair = new Int32Array(10); // 10
        var counterBlack = new Int32Array(5); // 5
        var counterWhite = new Int32Array(5); // 5
        counterDigitPair.fill(0);
        counterBlack.fill(0);
        counterWhite.fill(0);
        while (payloadStart < payloadEnd) {
            // Get 10 runs of black/white.
            OneDReader_1.default.recordPattern(row, payloadStart, counterDigitPair);
            // Split them into each array
            for (var k = 0; k < 5; k++) {
                var twoK = 2 * k;
                counterBlack[k] = counterDigitPair[twoK];
                counterWhite[k] = counterDigitPair[twoK + 1];
            }
            var bestMatch = ITFReader.decodeDigit(counterBlack);
            resultString.append(bestMatch.toString());
            bestMatch = this.decodeDigit(counterWhite);
            resultString.append(bestMatch.toString());
            counterDigitPair.forEach(function (counterDigit) {
                payloadStart += counterDigit;
            });
        }
    };
    /*/!**
     * Identify where the start of the middle / payload section starts.
     *
     * @param row row of black/white values to search
     * @return Array, containing index of start of 'start block' and end of
     *         'start block'
     *!/*/
    ITFReader.prototype.decodeStart = function (row) {
        var endStart = ITFReader.skipWhiteSpace(row);
        var startPattern = ITFReader.findGuardPattern(row, endStart, ITFReader.START_PATTERN);
        // Determine the width of a narrow line in pixels. We can do this by
        // getting the width of the start pattern and dividing by 4 because its
        // made up of 4 narrow lines.
        this.narrowLineWidth = (startPattern[1] - startPattern[0]) / 4;
        this.validateQuietZone(row, startPattern[0]);
        return startPattern;
    };
    /*/!**
     * The start & end patterns must be pre/post fixed by a quiet zone. This
     * zone must be at least 10 times the width of a narrow line.  Scan back until
     * we either get to the start of the barcode or match the necessary number of
     * quiet zone pixels.
     *
     * Note: Its assumed the row is reversed when using this method to find
     * quiet zone after the end pattern.
     *
     * ref: http://www.barcode-1.net/i25code.html
     *
     * @param row bit array representing the scanned barcode.
     * @param startPattern index into row of the start or end pattern.
     * @throws NotFoundException if the quiet zone cannot be found
     *!/*/
    ITFReader.prototype.validateQuietZone = function (row, startPattern) {
        var quietCount = this.narrowLineWidth * 10; // expect to find this many pixels of quiet zone
        // if there are not so many pixel at all let's try as many as possible
        quietCount = quietCount < startPattern ? quietCount : startPattern;
        for (var i = startPattern - 1; quietCount > 0 && i >= 0; i--) {
            if (row.get(i)) {
                break;
            }
            quietCount--;
        }
        if (quietCount !== 0) {
            // Unable to find the necessary number of quiet zone pixels.
            throw new NotFoundException_1.default();
        }
    };
    /*
    /!**
     * Skip all whitespace until we get to the first black line.
     *
     * @param row row of black/white values to search
     * @return index of the first black line.
     * @throws NotFoundException Throws exception if no black lines are found in the row
     *!/*/
    ITFReader.skipWhiteSpace = function (row) {
        var width = row.getSize();
        var endStart = row.getNextSet(0);
        if (endStart === width) {
            throw new NotFoundException_1.default();
        }
        return endStart;
    };
    /*/!**
     * Identify where the end of the middle / payload section ends.
     *
     * @param row row of black/white values to search
     * @return Array, containing index of start of 'end block' and end of 'end
     *         block'
     *!/*/
    ITFReader.prototype.decodeEnd = function (row) {
        // For convenience, reverse the row and then
        // search from 'the start' for the end block
        row.reverse();
        try {
            var endStart = ITFReader.skipWhiteSpace(row);
            var endPattern = void 0;
            try {
                endPattern = ITFReader.findGuardPattern(row, endStart, ITFReader.END_PATTERN_REVERSED[0]);
            }
            catch (error) {
                if (error instanceof NotFoundException_1.default) {
                    endPattern = ITFReader.findGuardPattern(row, endStart, ITFReader.END_PATTERN_REVERSED[1]);
                }
            }
            // The start & end patterns must be pre/post fixed by a quiet zone. This
            // zone must be at least 10 times the width of a narrow line.
            // ref: http://www.barcode-1.net/i25code.html
            this.validateQuietZone(row, endPattern[0]);
            // Now recalculate the indices of where the 'endblock' starts & stops to
            // accommodate
            // the reversed nature of the search
            var temp = endPattern[0];
            endPattern[0] = row.getSize() - endPattern[1];
            endPattern[1] = row.getSize() - temp;
            return endPattern;
        }
        finally {
            // Put the row back the right way.
            row.reverse();
        }
    };
    /*
    /!**
     * @param row       row of black/white values to search
     * @param rowOffset position to start search
     * @param pattern   pattern of counts of number of black and white pixels that are
     *                  being searched for as a pattern
     * @return start/end horizontal offset of guard pattern, as an array of two
     *         ints
     * @throws NotFoundException if pattern is not found
     *!/*/
    ITFReader.findGuardPattern = function (row, rowOffset, pattern) {
        var patternLength = pattern.length;
        var counters = new Int32Array(patternLength);
        var width = row.getSize();
        var isWhite = false;
        var counterPosition = 0;
        var patternStart = rowOffset;
        counters.fill(0);
        for (var x = rowOffset; x < width; x++) {
            if (row.get(x) !== isWhite) {
                counters[counterPosition]++;
            }
            else {
                if (counterPosition === patternLength - 1) {
                    if (OneDReader_1.default.patternMatchVariance(counters, pattern, ITFReader.MAX_INDIVIDUAL_VARIANCE) < ITFReader.MAX_AVG_VARIANCE) {
                        return [patternStart, x];
                    }
                    patternStart += counters[0] + counters[1];
                    System_1.default.arraycopy(counters, 2, counters, 0, counterPosition - 1);
                    counters[counterPosition - 1] = 0;
                    counters[counterPosition] = 0;
                    counterPosition--;
                }
                else {
                    counterPosition++;
                }
                counters[counterPosition] = 1;
                isWhite = !isWhite;
            }
        }
        throw new NotFoundException_1.default();
    };
    /*/!**
     * Attempts to decode a sequence of ITF black/white lines into single
     * digit.
     *
     * @param counters the counts of runs of observed black/white/black/... values
     * @return The decoded digit
     * @throws NotFoundException if digit cannot be decoded
     *!/*/
    ITFReader.decodeDigit = function (counters) {
        var bestVariance = ITFReader.MAX_AVG_VARIANCE; // worst variance we'll accept
        var bestMatch = -1;
        var max = ITFReader.PATTERNS.length;
        for (var i = 0; i < max; i++) {
            var pattern = ITFReader.PATTERNS[i];
            var variance = OneDReader_1.default.patternMatchVariance(counters, pattern, ITFReader.MAX_INDIVIDUAL_VARIANCE);
            if (variance < bestVariance) {
                bestVariance = variance;
                bestMatch = i;
            }
            else if (variance === bestVariance) {
                // if we find a second 'best match' with the same variance, we can not reliably report to have a suitable match
                bestMatch = -1;
            }
        }
        if (bestMatch >= 0) {
            return bestMatch % 10;
        }
        else {
            throw new NotFoundException_1.default();
        }
    };
    ITFReader.PATTERNS = [
        Int32Array.from([1, 1, 2, 2, 1]),
        Int32Array.from([2, 1, 1, 1, 2]),
        Int32Array.from([1, 2, 1, 1, 2]),
        Int32Array.from([2, 2, 1, 1, 1]),
        Int32Array.from([1, 1, 2, 1, 2]),
        Int32Array.from([2, 1, 2, 1, 1]),
        Int32Array.from([1, 2, 2, 1, 1]),
        Int32Array.from([1, 1, 1, 2, 2]),
        Int32Array.from([2, 1, 1, 2, 1]),
        Int32Array.from([1, 2, 1, 2, 1]),
        Int32Array.from([1, 1, 3, 3, 1]),
        Int32Array.from([3, 1, 1, 1, 3]),
        Int32Array.from([1, 3, 1, 1, 3]),
        Int32Array.from([3, 3, 1, 1, 1]),
        Int32Array.from([1, 1, 3, 1, 3]),
        Int32Array.from([3, 1, 3, 1, 1]),
        Int32Array.from([1, 3, 3, 1, 1]),
        Int32Array.from([1, 1, 1, 3, 3]),
        Int32Array.from([3, 1, 1, 3, 1]),
        Int32Array.from([1, 3, 1, 3, 1]) // 9
    ];
    ITFReader.MAX_AVG_VARIANCE = 0.38;
    ITFReader.MAX_INDIVIDUAL_VARIANCE = 0.5;
    /* /!** Valid ITF lengths. Anything longer than the largest value is also allowed. *!/*/
    ITFReader.DEFAULT_ALLOWED_LENGTHS = [6, 8, 10, 12, 14];
    /*/!**
     * Start/end guard pattern.
     *
     * Note: The end pattern is reversed because the row is reversed before
     * searching for the END_PATTERN
     *!/*/
    ITFReader.START_PATTERN = Int32Array.from([1, 1, 1, 1]);
    ITFReader.END_PATTERN_REVERSED = [
        Int32Array.from([1, 1, 2]),
        Int32Array.from([1, 1, 3]) // 3x
    ];
    return ITFReader;
}(OneDReader_1.default));
exports.default = ITFReader;
