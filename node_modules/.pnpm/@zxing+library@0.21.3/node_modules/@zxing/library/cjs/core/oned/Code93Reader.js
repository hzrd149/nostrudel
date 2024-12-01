"use strict";
/*
 * Copyright 2010 ZXing authors
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
var ChecksumException_1 = require("../ChecksumException");
var FormatException_1 = require("../FormatException");
var NotFoundException_1 = require("../NotFoundException");
var OneDReader_1 = require("./OneDReader");
var Result_1 = require("../Result");
//import com.google.zxing.ResultMetadataType;
var ResultPoint_1 = require("../ResultPoint");
/**
 * <p>Decodes Code 93 barcodes.</p>
 *
 * @author Sean Owen
 * @see Code39Reader
 */
var Code93Reader = /** @class */ (function (_super) {
    __extends(Code93Reader, _super);
    //public Code93Reader() {
    //  decodeRowResult = new StringBuilder(20);
    //  counters = new int[6];
    //}
    function Code93Reader() {
        var _this = _super.call(this) || this;
        _this.decodeRowResult = '';
        _this.counters = new Int32Array(6);
        return _this;
    }
    Code93Reader.prototype.decodeRow = function (rowNumber, row, hints) {
        var e_1, _a, e_2, _b;
        var start = this.findAsteriskPattern(row);
        // Read off white space
        var nextStart = row.getNextSet(start[1]);
        var end = row.getSize();
        var theCounters = this.counters;
        theCounters.fill(0);
        this.decodeRowResult = '';
        var decodedChar;
        var lastStart;
        do {
            Code93Reader.recordPattern(row, nextStart, theCounters);
            var pattern = this.toPattern(theCounters);
            if (pattern < 0) {
                throw new NotFoundException_1.default();
            }
            decodedChar = this.patternToChar(pattern);
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
        // Should be at least one more black module
        if (nextStart === end || !row.get(nextStart)) {
            throw new NotFoundException_1.default();
        }
        if (this.decodeRowResult.length < 2) {
            // false positive -- need at least 2 checksum digits
            throw new NotFoundException_1.default();
        }
        this.checkChecksums(this.decodeRowResult);
        // Remove checksum digits
        this.decodeRowResult = this.decodeRowResult.substring(0, this.decodeRowResult.length - 2);
        var resultString = this.decodeExtended(this.decodeRowResult);
        var left = (start[1] + start[0]) / 2.0;
        var right = lastStart + lastPatternSize / 2.0;
        return new Result_1.default(resultString, null, 0, [new ResultPoint_1.default(left, rowNumber), new ResultPoint_1.default(right, rowNumber)], BarcodeFormat_1.default.CODE_93, new Date().getTime());
    };
    Code93Reader.prototype.findAsteriskPattern = function (row) {
        var width = row.getSize();
        var rowOffset = row.getNextSet(0);
        this.counters.fill(0);
        var theCounters = this.counters;
        var patternStart = rowOffset;
        var isWhite = false;
        var patternLength = theCounters.length;
        var counterPosition = 0;
        for (var i = rowOffset; i < width; i++) {
            if (row.get(i) !== isWhite) {
                theCounters[counterPosition]++;
            }
            else {
                if (counterPosition === patternLength - 1) {
                    if (this.toPattern(theCounters) === Code93Reader.ASTERISK_ENCODING) {
                        return new Int32Array([patternStart, i]);
                    }
                    patternStart += theCounters[0] + theCounters[1];
                    theCounters.copyWithin(0, 2, 2 + counterPosition - 1);
                    theCounters[counterPosition - 1] = 0;
                    theCounters[counterPosition] = 0;
                    counterPosition--;
                }
                else {
                    counterPosition++;
                }
                theCounters[counterPosition] = 1;
                isWhite = !isWhite;
            }
        }
        throw new NotFoundException_1.default;
    };
    Code93Reader.prototype.toPattern = function (counters) {
        var e_3, _a;
        var sum = 0;
        try {
            for (var counters_1 = __values(counters), counters_1_1 = counters_1.next(); !counters_1_1.done; counters_1_1 = counters_1.next()) {
                var counter = counters_1_1.value;
                sum += counter;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (counters_1_1 && !counters_1_1.done && (_a = counters_1.return)) _a.call(counters_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        var pattern = 0;
        var max = counters.length;
        for (var i = 0; i < max; i++) {
            var scaled = Math.round(counters[i] * 9.0 / sum);
            if (scaled < 1 || scaled > 4) {
                return -1;
            }
            if ((i & 0x01) === 0) {
                for (var j = 0; j < scaled; j++) {
                    pattern = (pattern << 1) | 0x01;
                }
            }
            else {
                pattern <<= scaled;
            }
        }
        return pattern;
    };
    Code93Reader.prototype.patternToChar = function (pattern) {
        for (var i = 0; i < Code93Reader.CHARACTER_ENCODINGS.length; i++) {
            if (Code93Reader.CHARACTER_ENCODINGS[i] === pattern) {
                return Code93Reader.ALPHABET_STRING.charAt(i);
            }
        }
        throw new NotFoundException_1.default();
    };
    Code93Reader.prototype.decodeExtended = function (encoded) {
        var length = encoded.length;
        var decoded = '';
        for (var i = 0; i < length; i++) {
            var c = encoded.charAt(i);
            if (c >= 'a' && c <= 'd') {
                if (i >= length - 1) {
                    throw new FormatException_1.default();
                }
                var next = encoded.charAt(i + 1);
                var decodedChar = '\0';
                switch (c) {
                    case 'd':
                        // +A to +Z map to a to z
                        if (next >= 'A' && next <= 'Z') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) + 32);
                        }
                        else {
                            throw new FormatException_1.default();
                        }
                        break;
                    case 'a':
                        // $A to $Z map to control codes SH to SB
                        if (next >= 'A' && next <= 'Z') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) - 64);
                        }
                        else {
                            throw new FormatException_1.default();
                        }
                        break;
                    case 'b':
                        if (next >= 'A' && next <= 'E') {
                            // %A to %E map to control codes ESC to USep
                            decodedChar = String.fromCharCode(next.charCodeAt(0) - 38);
                        }
                        else if (next >= 'F' && next <= 'J') {
                            // %F to %J map to ; < = > ?
                            decodedChar = String.fromCharCode(next.charCodeAt(0) - 11);
                        }
                        else if (next >= 'K' && next <= 'O') {
                            // %K to %O map to [ \ ] ^ _
                            decodedChar = String.fromCharCode(next.charCodeAt(0) + 16);
                        }
                        else if (next >= 'P' && next <= 'T') {
                            // %P to %T map to { | } ~ DEL
                            decodedChar = String.fromCharCode(next.charCodeAt(0) + 43);
                        }
                        else if (next === 'U') {
                            // %U map to NUL
                            decodedChar = '\0';
                        }
                        else if (next === 'V') {
                            // %V map to @
                            decodedChar = '@';
                        }
                        else if (next === 'W') {
                            // %W map to `
                            decodedChar = '`';
                        }
                        else if (next >= 'X' && next <= 'Z') {
                            // %X to %Z all map to DEL (127)
                            decodedChar = String.fromCharCode(127);
                        }
                        else {
                            throw new FormatException_1.default();
                        }
                        break;
                    case 'c':
                        // /A to /O map to ! to , and /Z maps to :
                        if (next >= 'A' && next <= 'O') {
                            decodedChar = String.fromCharCode(next.charCodeAt(0) - 32);
                        }
                        else if (next === 'Z') {
                            decodedChar = ':';
                        }
                        else {
                            throw new FormatException_1.default();
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
    Code93Reader.prototype.checkChecksums = function (result) {
        var length = result.length;
        this.checkOneChecksum(result, length - 2, 20);
        this.checkOneChecksum(result, length - 1, 15);
    };
    Code93Reader.prototype.checkOneChecksum = function (result, checkPosition, weightMax) {
        var weight = 1;
        var total = 0;
        for (var i = checkPosition - 1; i >= 0; i--) {
            total += weight * Code93Reader.ALPHABET_STRING.indexOf(result.charAt(i));
            if (++weight > weightMax) {
                weight = 1;
            }
        }
        if (result.charAt(checkPosition) !== Code93Reader.ALPHABET_STRING[total % 47]) {
            throw new ChecksumException_1.default;
        }
    };
    // Note that 'abcd' are dummy characters in place of control characters.
    Code93Reader.ALPHABET_STRING = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%abcd*";
    /**
     * These represent the encodings of characters, as patterns of wide and narrow bars.
     * The 9 least-significant bits of each int correspond to the pattern of wide and narrow.
     */
    Code93Reader.CHARACTER_ENCODINGS = [
        0x114, 0x148, 0x144, 0x142, 0x128, 0x124, 0x122, 0x150, 0x112, 0x10A,
        0x1A8, 0x1A4, 0x1A2, 0x194, 0x192, 0x18A, 0x168, 0x164, 0x162, 0x134,
        0x11A, 0x158, 0x14C, 0x146, 0x12C, 0x116, 0x1B4, 0x1B2, 0x1AC, 0x1A6,
        0x196, 0x19A, 0x16C, 0x166, 0x136, 0x13A,
        0x12E, 0x1D4, 0x1D2, 0x1CA, 0x16E, 0x176, 0x1AE,
        0x126, 0x1DA, 0x1D6, 0x132, 0x15E,
    ];
    Code93Reader.ASTERISK_ENCODING = Code93Reader.CHARACTER_ENCODINGS[47];
    return Code93Reader;
}(OneDReader_1.default));
exports.default = Code93Reader;
