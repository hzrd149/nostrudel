/*
 * Copyright (C) 2012 ZXing authors
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
import BarcodeFormat from '../BarcodeFormat';
import AbstractUPCEANReader from './AbstractUPCEANReader';
import Result from '../Result';
import ResultPoint from '../ResultPoint';
import ResultMetadataType from '../ResultMetadataType';
import NotFoundException from '../NotFoundException';
/**
 * @see UPCEANExtension5Support
 */
var UPCEANExtension2Support = /** @class */ (function () {
    function UPCEANExtension2Support() {
        this.decodeMiddleCounters = Int32Array.from([0, 0, 0, 0]);
        this.decodeRowStringBuffer = '';
    }
    UPCEANExtension2Support.prototype.decodeRow = function (rowNumber, row, extensionStartRange) {
        var result = this.decodeRowStringBuffer;
        var end = this.decodeMiddle(row, extensionStartRange, result);
        var resultString = result.toString();
        var extensionData = UPCEANExtension2Support.parseExtensionString(resultString);
        var resultPoints = [
            new ResultPoint((extensionStartRange[0] + extensionStartRange[1]) / 2.0, rowNumber),
            new ResultPoint(end, rowNumber)
        ];
        var extensionResult = new Result(resultString, null, 0, resultPoints, BarcodeFormat.UPC_EAN_EXTENSION, new Date().getTime());
        if (extensionData != null) {
            extensionResult.putAllMetadata(extensionData);
        }
        return extensionResult;
    };
    UPCEANExtension2Support.prototype.decodeMiddle = function (row, startRange, resultString) {
        var e_1, _a;
        var counters = this.decodeMiddleCounters;
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        var end = row.getSize();
        var rowOffset = startRange[1];
        var checkParity = 0;
        for (var x = 0; x < 2 && rowOffset < end; x++) {
            var bestMatch = AbstractUPCEANReader.decodeDigit(row, counters, rowOffset, AbstractUPCEANReader.L_AND_G_PATTERNS);
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
                checkParity |= 1 << (1 - x);
            }
            if (x !== 1) {
                // Read off separator if not last
                rowOffset = row.getNextSet(rowOffset);
                rowOffset = row.getNextUnset(rowOffset);
            }
        }
        if (resultString.length !== 2) {
            throw new NotFoundException();
        }
        if (parseInt(resultString.toString()) % 4 !== checkParity) {
            throw new NotFoundException();
        }
        return rowOffset;
    };
    UPCEANExtension2Support.parseExtensionString = function (raw) {
        if (raw.length !== 2) {
            return null;
        }
        return new Map([[ResultMetadataType.ISSUE_NUMBER, parseInt(raw)]]);
    };
    return UPCEANExtension2Support;
}());
export default UPCEANExtension2Support;
