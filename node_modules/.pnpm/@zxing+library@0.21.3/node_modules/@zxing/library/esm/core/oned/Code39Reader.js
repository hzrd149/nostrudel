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
/*namespace com.google.zxing.oned {*/
import BarcodeFormat from '../BarcodeFormat';
import ChecksumException from '../ChecksumException';
import FormatException from '../FormatException';
import NotFoundException from '../NotFoundException';
import OneDReader from './OneDReader';
import Result from '../Result';
import ResultPoint from '../ResultPoint';
/**
 * <p>Decodes Code 39 barcodes. Supports "Full ASCII Code 39" if USE_CODE_39_EXTENDED_MODE is set.</p>
 *
 * @author Sean Owen
 * @see Code93Reader
 */
var Code39Reader = /** @class */ (function (_super) {
    __extends(Code39Reader, _super);
    /**
     * Creates a reader that assumes all encoded data is data, and does not treat the final
     * character as a check digit. It will not decoded "extended Code 39" sequences.
     */
    // public Code39Reader() {
    //   this(false);
    // }
    /**
     * Creates a reader that can be configured to check the last character as a check digit.
     * It will not decoded "extended Code 39" sequences.
     *
     * @param usingCheckDigit if true, treat the last data character as a check digit, not
     * data, and verify that the checksum passes.
     */
    // public Code39Reader(boolean usingCheckDigit) {
    //   this(usingCheckDigit, false);
    // }
    /**
     * Creates a reader that can be configured to check the last character as a check digit,
     * or optionally attempt to decode "extended Code 39" sequences that are used to encode
     * the full ASCII character set.
     *
     * @param usingCheckDigit if true, treat the last data character as a check digit, not
     * data, and verify that the checksum passes.
     * @param extendedMode if true, will attempt to decode extended Code 39 sequences in the
     * text.
     */
    function Code39Reader(usingCheckDigit, extendedMode) {
        if (usingCheckDigit === void 0) { usingCheckDigit = false; }
        if (extendedMode === void 0) { extendedMode = false; }
        var _this = _super.call(this) || this;
        _this.usingCheckDigit = usingCheckDigit;
        _this.extendedMode = extendedMode;
        _this.decodeRowResult = '';
        _this.counters = new Int32Array(9);
        return _this;
    }
    Code39Reader.prototype.decodeRow = function (rowNumber, row, hints) {
        var e_1, _a, e_2, _b;
        var theCounters = this.counters;
        theCounters.fill(0);
        this.decodeRowResult = '';
        var start = Code39Reader.findAsteriskPattern(row, theCounters);
        // Read off white space
        var nextStart = row.getNextSet(start[1]);
        var end = row.getSize();
        var decodedChar;
        var lastStart;
        do {
            Code39Reader.recordPattern(row, nextStart, theCounters);
            var pattern = Code39Reader.toNarrowWidePattern(theCounters);
            if (pattern < 0) {
                throw new NotFoundException();
            }
            decodedChar = Code39Reader.patternToChar(pattern);
            this.decodeRowResult += decodedChar;
            lastStart = nextStart;
            try {
                for (var theCounters_1 = (e_1 = void 0, __values(theCounters)), theCounters_1_1 = theCounters_1.next(); !theCounters_1_1.done; theCounters_1_1 = theCounters_1.next()) {
                    var counter = theCounters_1_1.value;
                    nextStart += counter;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (theCounters_1_1 && !theCounters_1_1.done && (_a = theCounters_1.return)) _a.call(theCounters_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Read off white space
            nextStart = row.getNextSet(nextStart);
        } while (decodedChar !== '*');
        this.decodeRowResult = this.decodeRowResult.substring(0, this.decodeRowResult.length - 1); // remove asterisk
        // Look for whitespace after pattern:
        var lastPatternSize = 0;
        try {
            for (var theCounters_2 = __values(theCounters), theCounters_2_1 = theCounters_2.next(); !theCounters_2_1.done; theCounters_2_1 = theCounters_2.next()) {
                var counter = theCounters_2_1.value;
                lastPatternSize += counter;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (theCounters_2_1 && !theCounters_2_1.done && (_b = theCounters_2.return)) _b.call(theCounters_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var whiteSpaceAfterEnd = nextStart - lastStart - lastPatternSize;
        // If 50% of last pattern size, following last pattern, is not whitespace, fail
        // (but if it's whitespace to the very end of the image, that's OK)
        if (nextStart !== end && (whiteSpaceAfterEnd * 2) < lastPatternSize) {
            throw new NotFoundException();
        }
        if (this.usingCheckDigit) {
            var max = this.decodeRowResult.length - 1;
            var total = 0;
            for (var i = 0; i < max; i++) {
                total += Code39Reader.ALPHABET_STRING.indexOf(this.decodeRowResult.charAt(i));
            }
            if (this.decodeRowResult.charAt(max) !== Code39Reader.ALPHABET_STRING.charAt(total % 43)) {
                throw new ChecksumException();
            }
            this.decodeRowResult = this.decodeRowResult.substring(0, max);
        }
        if (this.decodeRowResult.length === 0) {
            // false positive
            throw new NotFoundException();
        }
        var resultString;
        if (this.extendedMode) {
            resultString = Code39Reader.decodeExtended(this.decodeRowResult);
        }
        else {
            resultString = this.decodeRowResult;
        }
        var left = (start[1] + start[0]) / 2.0;
        var right = lastStart + lastPatternSize / 2.0;
        return new Result(resultString, null, 0, [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)], BarcodeFormat.CODE_39, new Date().getTime());
    };
    Code39Reader.findAsteriskPattern = function (row, counters) {
        var width = row.getSize();
        var rowOffset = row.getNextSet(0);
        var counterPosition = 0;
        var patternStart = rowOffset;
        var isWhite = false;
        var patternLength = counters.length;
        for (var i = rowOffset; i < width; i++) {
            if (row.get(i) !== isWhite) {
                counters[counterPosition]++;
            }
            else {
                if (counterPosition === patternLength - 1) {
                    // Look for whitespace before start pattern, >= 50% of width of start pattern
                    if (this.toNarrowWidePattern(counters) === Code39Reader.ASTERISK_ENCODING &&
                        row.isRange(Math.max(0, patternStart - Math.floor((i - patternStart) / 2)), patternStart, false)) {
                        return [patternStart, i];
                    }
                    patternStart += counters[0] + counters[1];
                    counters.copyWithin(0, 2, 2 + counterPosition - 1);
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
        throw new NotFoundException();
    };
    // For efficiency, returns -1 on failure. Not throwing here saved as many as 700 exceptions
    // per image when using some of our blackbox images.
    Code39Reader.toNarrowWidePattern = function (counters) {
        var e_3, _a;
        var numCounters = counters.length;
        var maxNarrowCounter = 0;
        var wideCounters;
        do {
            var minCounter = 0x7fffffff;
            try {
                for (var counters_1 = (e_3 = void 0, __values(counters)), counters_1_1 = counters_1.next(); !counters_1_1.done; counters_1_1 = counters_1.next()) {
                    var counter = counters_1_1.value;
                    if (counter < minCounter && counter > maxNarrowCounter) {
                        minCounter = counter;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (counters_1_1 && !counters_1_1.done && (_a = counters_1.return)) _a.call(counters_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            maxNarrowCounter = minCounter;
            wideCounters = 0;
            var totalWideCountersWidth = 0;
            var pattern = 0;
            for (var i = 0; i < numCounters; i++) {
                var counter = counters[i];
                if (counter > maxNarrowCounter) {
                    pattern |= 1 << (numCounters - 1 - i);
                    wideCounters++;
                    totalWideCountersWidth += counter;
                }
            }
            if (wideCounters === 3) {
                // Found 3 wide counters, but are they close enough in width?
                // We can perform a cheap, conservative check to see if any individual
                // counter is more than 1.5 times the average:
                for (var i = 0; i < numCounters && wideCounters > 0; i++) {
                    var counter = counters[i];
                    if (counter > maxNarrowCounter) {
                        wideCounters--;
                        // totalWideCountersWidth = 3 * average, so this checks if counter >= 3/2 * average
                        if ((counter * 2) >= totalWideCountersWidth) {
                            return -1;
                        }
                    }
                }
                return pattern;
            }
        } while (wideCounters > 3);
        return -1;
    };
    Code39Reader.patternToChar = function (pattern) {
        for (var i = 0; i < Code39Reader.CHARACTER_ENCODINGS.length; i++) {
            if (Code39Reader.CHARACTER_ENCODINGS[i] === pattern) {
                return Code39Reader.ALPHABET_STRING.charAt(i);
            }
        }
        if (pattern === Code39Reader.ASTERISK_ENCODING) {
            return '*';
        }
        throw new NotFoundException();
    };
    Code39Reader.decodeExtended = function (encoded) {
        var length = encoded.length;
        var decoded = '';
        for (var i = 0; i < length; i++) {
            var c = encoded.charAt(i);
            if (c === '+' || c === '$' || c === '%' || c === '/') {
                var next = encoded.charAt(i + 1);
                var decodedChar = '\0';
                switch (c) {
                    case '+':
                        // +A to +Z map to a to z
                        if (next >= 'A' && next <= 'Z') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) + 32);
                        }
                        else {
                            throw new FormatException();
                        }
                        break;
                    case '$':
                        // $A to $Z map to control codes SH to SB
                        if (next >= 'A' && next <= 'Z') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) - 64);
                        }
                        else {
                            throw new FormatException();
                        }
                        break;
                    case '%':
                        // %A to %E map to control codes ESC to US
                        if (next >= 'A' && next <= 'E') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) - 38);
                        }
                        else if (next >= 'F' && next <= 'J') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) - 11);
                        }
                        else if (next >= 'K' && next <= 'O') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) + 16);
                        }
                        else if (next >= 'P' && next <= 'T') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) + 43);
                        }
                        else if (next === 'U') {
                            decodedChar = '\0';
                        }
                        else if (next === 'V') {
                            decodedChar = '@';
                        }
                        else if (next === 'W') {
                            decodedChar = '`';
                        }
                        else if (next === 'X' || next === 'Y' || next === 'Z') {
                            decodedChar = '\x7f';
                        }
                        else {
                            throw new FormatException();
                        }
                        break;
                    case '/':
                        // /A to /O map to ! to , and /Z maps to :
                        if (next >= 'A' && next <= 'O') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) - 32);
                        }
                        else if (next === 'Z') {
                            decodedChar = ':';
                        }
                        else {
                            throw new FormatException();
                        }
                        break;
                }
                decoded += decodedChar;
                // bump up i again since we read two characters
                i++;
            }
            else {
                decoded += c;
            }
        }
        return decoded;
    };
    Code39Reader.ALPHABET_STRING = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
    /**
     * These represent the encodings of characters, as patterns of wide and narrow bars.
     * The 9 least-significant bits of each int correspond to the pattern of wide and narrow,
     * with 1s representing "wide" and 0s representing narrow.
     */
    Code39Reader.CHARACTER_ENCODINGS = [
        0x034, 0x121, 0x061, 0x160, 0x031, 0x130, 0x070, 0x025, 0x124, 0x064,
        0x109, 0x049, 0x148, 0x019, 0x118, 0x058, 0x00D, 0x10C, 0x04C, 0x01C,
        0x103, 0x043, 0x142, 0x013, 0x112, 0x052, 0x007, 0x106, 0x046, 0x016,
        0x181, 0x0C1, 0x1C0, 0x091, 0x190, 0x0D0, 0x085, 0x184, 0x0C4, 0x0A8,
        0x0A2, 0x08A, 0x02A // /-%
    ];
    Code39Reader.ASTERISK_ENCODING = 0x094;
    return Code39Reader;
}(OneDReader));
export default Code39Reader;
