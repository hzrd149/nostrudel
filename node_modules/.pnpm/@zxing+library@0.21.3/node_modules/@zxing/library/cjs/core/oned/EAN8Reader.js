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
var BarcodeFormat_1 = require("../BarcodeFormat");
var UPCEANReader_1 = require("./UPCEANReader");
/**
 * <p>Implements decoding of the EAN-8 format.</p>
 *
 * @author Sean Owen
 */
var EAN8Reader = /** @class */ (function (_super) {
    __extends(EAN8Reader, _super);
    function EAN8Reader() {
        var _this = _super.call(this) || this;
        _this.decodeMiddleCounters = Int32Array.from([0, 0, 0, 0]);
        return _this;
    }
    EAN8Reader.prototype.decodeMiddle = function (row, startRange, resultString) {
        var e_1, _a, e_2, _b;
        var counters = this.decodeMiddleCounters;
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        var end = row.getSize();
        var rowOffset = startRange[1];
        for (var x = 0; x < 4 && rowOffset < end; x++) {
            var bestMatch = UPCEANReader_1.default.decodeDigit(row, counters, rowOffset, UPCEANReader_1.default.L_PATTERNS);
            resultString += String.fromCharCode(('0'.charCodeAt(0) + bestMatch));
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
        }
        var middleRange = UPCEANReader_1.default.findGuardPattern(row, rowOffset, true, UPCEANReader_1.default.MIDDLE_PATTERN, new Int32Array(UPCEANReader_1.default.MIDDLE_PATTERN.length).fill(0));
        rowOffset = middleRange[1];
        for (var x = 0; x < 4 && rowOffset < end; x++) {
            var bestMatch = UPCEANReader_1.default.decodeDigit(row, counters, rowOffset, UPCEANReader_1.default.L_PATTERNS);
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
    EAN8Reader.prototype.getBarcodeFormat = function () {
        return BarcodeFormat_1.default.EAN_8;
    };
    return EAN8Reader;
}(UPCEANReader_1.default));
exports.default = EAN8Reader;
