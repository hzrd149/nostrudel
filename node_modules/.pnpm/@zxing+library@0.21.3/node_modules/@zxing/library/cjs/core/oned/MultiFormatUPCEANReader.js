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
var DecodeHintType_1 = require("../DecodeHintType");
var Result_1 = require("../Result");
var OneDReader_1 = require("./OneDReader");
var EAN13Reader_1 = require("./EAN13Reader");
var EAN8Reader_1 = require("./EAN8Reader");
var UPCAReader_1 = require("./UPCAReader");
var NotFoundException_1 = require("../NotFoundException");
var UPCEReader_1 = require("./UPCEReader");
/**
 * <p>A reader that can read all available UPC/EAN formats. If a caller wants to try to
 * read all such formats, it is most efficient to use this implementation rather than invoke
 * individual readers.</p>
 *
 * @author Sean Owen
 */
var MultiFormatUPCEANReader = /** @class */ (function (_super) {
    __extends(MultiFormatUPCEANReader, _super);
    function MultiFormatUPCEANReader(hints) {
        var _this = _super.call(this) || this;
        var possibleFormats = hints == null ? null : hints.get(DecodeHintType_1.default.POSSIBLE_FORMATS);
        var readers = [];
        if (possibleFormats != null) {
            if (possibleFormats.indexOf(BarcodeFormat_1.default.EAN_13) > -1) {
                readers.push(new EAN13Reader_1.default());
            }
            if (possibleFormats.indexOf(BarcodeFormat_1.default.UPC_A) > -1) {
                readers.push(new UPCAReader_1.default());
            }
            if (possibleFormats.indexOf(BarcodeFormat_1.default.EAN_8) > -1) {
                readers.push(new EAN8Reader_1.default());
            }
            if (possibleFormats.indexOf(BarcodeFormat_1.default.UPC_E) > -1) {
                readers.push(new UPCEReader_1.default());
            }
        }
        if (readers.length === 0) {
            readers.push(new EAN13Reader_1.default());
            readers.push(new UPCAReader_1.default());
            readers.push(new EAN8Reader_1.default());
            readers.push(new UPCEReader_1.default());
        }
        _this.readers = readers;
        return _this;
    }
    MultiFormatUPCEANReader.prototype.decodeRow = function (rowNumber, row, hints) {
        var e_1, _a;
        try {
            for (var _b = __values(this.readers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var reader = _c.value;
                try {
                    // const result: Result = reader.decodeRow(rowNumber, row, startGuardPattern, hints);
                    var result = reader.decodeRow(rowNumber, row, hints);
                    // Special case: a 12-digit code encoded in UPC-A is identical to a "0"
                    // followed by those 12 digits encoded as EAN-13. Each will recognize such a code,
                    // UPC-A as a 12-digit string and EAN-13 as a 13-digit string starting with "0".
                    // Individually these are correct and their readers will both read such a code
                    // and correctly call it EAN-13, or UPC-A, respectively.
                    //
                    // In this case, if we've been looking for both types, we'd like to call it
                    // a UPC-A code. But for efficiency we only run the EAN-13 decoder to also read
                    // UPC-A. So we special case it here, and convert an EAN-13 result to a UPC-A
                    // result if appropriate.
                    //
                    // But, don't return UPC-A if UPC-A was not a requested format!
                    var ean13MayBeUPCA = result.getBarcodeFormat() === BarcodeFormat_1.default.EAN_13 &&
                        result.getText().charAt(0) === '0';
                    // @SuppressWarnings("unchecked")
                    var possibleFormats = hints == null ? null : hints.get(DecodeHintType_1.default.POSSIBLE_FORMATS);
                    var canReturnUPCA = possibleFormats == null || possibleFormats.includes(BarcodeFormat_1.default.UPC_A);
                    if (ean13MayBeUPCA && canReturnUPCA) {
                        var rawBytes = result.getRawBytes();
                        // Transfer the metadata across
                        var resultUPCA = new Result_1.default(result.getText().substring(1), rawBytes, (rawBytes ? rawBytes.length : null), result.getResultPoints(), BarcodeFormat_1.default.UPC_A);
                        resultUPCA.putAllMetadata(result.getResultMetadata());
                        return resultUPCA;
                    }
                    return result;
                }
                catch (err) {
                    // continue;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        throw new NotFoundException_1.default();
    };
    MultiFormatUPCEANReader.prototype.reset = function () {
        var e_2, _a;
        try {
            for (var _b = __values(this.readers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var reader = _c.value;
                reader.reset();
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    return MultiFormatUPCEANReader;
}(OneDReader_1.default));
exports.default = MultiFormatUPCEANReader;
