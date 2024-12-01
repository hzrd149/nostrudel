"use strict";
/*
 * Copyright (C) 2010 ZXing authors
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
Object.defineProperty(exports, "__esModule", { value: true });
var BarcodeFormat_1 = require("../BarcodeFormat");
// import UPCEANReader from './UPCEANReader';
var AbstractUPCEANReader_1 = require("./AbstractUPCEANReader");
var Result_1 = require("../Result");
var ResultPoint_1 = require("../ResultPoint");
var ResultMetadataType_1 = require("../ResultMetadataType");
var NotFoundException_1 = require("../NotFoundException");
/**
 * @see UPCEANExtension2Support
 */
var UPCEANExtension5Support = /** @class */ (function () {
    function UPCEANExtension5Support() {
        this.CHECK_DIGIT_ENCODINGS = [0x18, 0x14, 0x12, 0x11, 0x0C, 0x06, 0x03, 0x0A, 0x09, 0x05];
        this.decodeMiddleCounters = Int32Array.from([0, 0, 0, 0]);
        this.decodeRowStringBuffer = '';
    }
    UPCEANExtension5Support.prototype.decodeRow = function (rowNumber, row, extensionStartRange) {
        var result = this.decodeRowStringBuffer;
        var end = this.decodeMiddle(row, extensionStartRange, result);
        var resultString = result.toString();
        var extensionData = UPCEANExtension5Support.parseExtensionString(resultString);
        var resultPoints = [
            new ResultPoint_1.default((extensionStartRange[0] + extensionStartRange[1]) / 2.0, rowNumber),
            new ResultPoint_1.default(end, rowNumber)
        ];
        var extensionResult = new Result_1.default(resultString, null, 0, resultPoints, BarcodeFormat_1.default.UPC_EAN_EXTENSION, new Date().getTime());
        if (extensionData != null) {
            extensionResult.putAllMetadata(extensionData);
        }
        return extensionResult;
    };
    UPCEANExtension5Support.prototype.decodeMiddle = function (row, startRange, resultString) {
        var e_1, _a;
        var counters = this.decodeMiddleCounters;
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        var end = row.getSize();
        var rowOffset = startRange[1];
        var lgPatternFound = 0;
        for (var x = 0; x < 5 && rowOffset < end; x++) {
            var bestMatch = AbstractUPCEANReader_1.default.decodeDigit(row, counters, rowOffset, AbstractUPCEANReader_1.default.L_AND_G_PATTERNS);
            resultString += String.fromCharCode(('0'.charCodeAt(0) + bestMatch % 10));
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
                lgPatternFound |= 1 << (4 - x);
            }
            if (x !== 4) {
                // Read off separator if not last
                rowOffset = row.getNextSet(rowOffset);
                rowOffset = row.getNextUnset(rowOffset);
            }
        }
        if (resultString.length !== 5) {
            throw new NotFoundException_1.default();
        }
        var checkDigit = this.determineCheckDigit(lgPatternFound);
        if (UPCEANExtension5Support.extensionChecksum(resultString.toString()) !== checkDigit) {
            throw new NotFoundException_1.default();
        }
        return rowOffset;
    };
    UPCEANExtension5Support.extensionChecksum = function (s) {
        var length = s.length;
        var sum = 0;
        for (var i = length - 2; i >= 0; i -= 2) {
            sum += s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
        }
        sum *= 3;
        for (var i = length - 1; i >= 0; i -= 2) {
            sum += s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
        }
        sum *= 3;
        return sum % 10;
    };
    UPCEANExtension5Support.prototype.determineCheckDigit = function (lgPatternFound) {
        for (var d = 0; d < 10; d++) {
            if (lgPatternFound === this.CHECK_DIGIT_ENCODINGS[d]) {
                return d;
            }
        }
        throw new NotFoundException_1.default();
    };
    UPCEANExtension5Support.parseExtensionString = function (raw) {
        if (raw.length !== 5) {
            return null;
        }
        var value = UPCEANExtension5Support.parseExtension5String(raw);
        if (value == null) {
            return null;
        }
        return new Map([[ResultMetadataType_1.default.SUGGESTED_PRICE, value]]);
    };
    UPCEANExtension5Support.parseExtension5String = function (raw) {
        var currency;
        switch (raw.charAt(0)) {
            case '0':
                currency = '£';
                break;
            case '5':
                currency = '$';
                break;
            case '9':
                // Reference: http://www.jollytech.com
                switch (raw) {
                    case '90000':
                        // No suggested retail price
                        return null;
                    case '99991':
                        // Complementary
                        return '0.00';
                    case '99990':
                        return 'Used';
                }
                // Otherwise... unknown currency?
                currency = '';
                break;
            default:
                currency = '';
                break;
        }
        var rawAmount = parseInt(raw.substring(1));
        var unitsString = (rawAmount / 100).toString();
        var hundredths = rawAmount % 100;
        var hundredthsString = hundredths < 10 ? '0' + hundredths : hundredths.toString(); // fixme
        return currency + unitsString + '.' + hundredthsString;
    };
    return UPCEANExtension5Support;
}());
exports.default = UPCEANExtension5Support;
