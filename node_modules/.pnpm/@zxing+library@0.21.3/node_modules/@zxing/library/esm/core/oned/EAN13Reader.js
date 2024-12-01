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
import BarcodeFormat from '../BarcodeFormat';
import UPCEANReader from './UPCEANReader';
import NotFoundException from '../NotFoundException';
/**
 * <p>Implements decoding of the EAN-13 format.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
var EAN13Reader = /** @class */ (function (_super) {
    __extends(EAN13Reader, _super);
    function EAN13Reader() {
        var _this = _super.call(this) || this;
        _this.decodeMiddleCounters = Int32Array.from([0, 0, 0, 0]);
        return _this;
    }
    EAN13Reader.prototype.decodeMiddle = function (row, startRange, resultString) {
        var e_1, _a, e_2, _b;
        var counters = this.decodeMiddleCounters;
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        var end = row.getSize();
        var rowOffset = startRange[1];
        var lgPatternFound = 0;
        for (var x = 0; x < 6 && rowOffset < end; x++) {
            var bestMatch = UPCEANReader.decodeDigit(row, counters, rowOffset, UPCEANReader.L_AND_G_PATTERNS);
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
                lgPatternFound |= 1 << (5 - x);
            }
        }
        resultString = EAN13Reader.determineFirstDigit(resultString, lgPatternFound);
        var middleRange = UPCEANReader.findGuardPattern(row, rowOffset, true, UPCEANReader.MIDDLE_PATTERN, new Int32Array(UPCEANReader.MIDDLE_PATTERN.length).fill(0));
        rowOffset = middleRange[1];
        for (var x = 0; x < 6 && rowOffset < end; x++) {
            var bestMatch = UPCEANReader.decodeDigit(row, counters, rowOffset, UPCEANReader.L_PATTERNS);
            resultString += String.fromCharCode(('0'.charCodeAt(0) + bestMatch));
            try {
                for (var counters_2 = (e_2 = void 0, __values(counters)), counters_2_1 = counters_2.next(); !counters_2_1.done; counters_2_1 = counters_2.next()) {
                    var counter = counters_2_1.value;
                    rowOffset += counter;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (counters_2_1 && !counters_2_1.done && (_b = counters_2.return)) _b.call(counters_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        return { rowOffset: rowOffset, resultString: resultString };
    };
    EAN13Reader.prototype.getBarcodeFormat = function () {
        return BarcodeFormat.EAN_13;
    };
    EAN13Reader.determineFirstDigit = function (resultString, lgPatternFound) {
        for (var d = 0; d < 10; d++) {
            if (lgPatternFound === this.FIRST_DIGIT_ENCODINGS[d]) {
                resultString = String.fromCharCode(('0'.charCodeAt(0) + d)) + resultString;
                return resultString;
            }
        }
        throw new NotFoundException();
    };
    EAN13Reader.FIRST_DIGIT_ENCODINGS = [0x00, 0x0B, 0x0D, 0xE, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1A];
    return EAN13Reader;
}(UPCEANReader));
export default EAN13Reader;
