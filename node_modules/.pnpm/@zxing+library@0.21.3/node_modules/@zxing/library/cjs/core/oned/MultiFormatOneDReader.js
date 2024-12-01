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
Object.defineProperty(exports, "__esModule", { value: true });
/*namespace com.google.zxing.oned {*/
var BarcodeFormat_1 = require("../BarcodeFormat");
var DecodeHintType_1 = require("../DecodeHintType");
var NotFoundException_1 = require("../NotFoundException");
var Code128Reader_1 = require("./Code128Reader");
var Code39Reader_1 = require("./Code39Reader");
var Code93Reader_1 = require("./Code93Reader");
var ITFReader_1 = require("./ITFReader");
var MultiFormatUPCEANReader_1 = require("./MultiFormatUPCEANReader");
var OneDReader_1 = require("./OneDReader");
var CodaBarReader_1 = require("./CodaBarReader");
var RSSExpandedReader_1 = require("./rss/expanded/RSSExpandedReader");
var RSS14Reader_1 = require("./rss/RSS14Reader");
/**
 * @author Daniel Switkin <dswitkin@google.com>
 * @author Sean Owen
 */
var MultiFormatOneDReader = /** @class */ (function (_super) {
    __extends(MultiFormatOneDReader, _super);
    function MultiFormatOneDReader(hints) {
        var _this = _super.call(this) || this;
        _this.readers = [];
        var possibleFormats = !hints ? null : hints.get(DecodeHintType_1.default.POSSIBLE_FORMATS);
        var useCode39CheckDigit = hints && hints.get(DecodeHintType_1.default.ASSUME_CODE_39_CHECK_DIGIT) !== undefined;
        var useCode39ExtendedMode = hints && hints.get(DecodeHintType_1.default.ENABLE_CODE_39_EXTENDED_MODE) !== undefined;
        if (possibleFormats) {
            if (possibleFormats.includes(BarcodeFormat_1.default.EAN_13) ||
                possibleFormats.includes(BarcodeFormat_1.default.UPC_A) ||
                possibleFormats.includes(BarcodeFormat_1.default.EAN_8) ||
                possibleFormats.includes(BarcodeFormat_1.default.UPC_E)) {
                _this.readers.push(new MultiFormatUPCEANReader_1.default(hints));
            }
            if (possibleFormats.includes(BarcodeFormat_1.default.CODE_39)) {
                _this.readers.push(new Code39Reader_1.default(useCode39CheckDigit, useCode39ExtendedMode));
            }
            if (possibleFormats.includes(BarcodeFormat_1.default.CODE_93)) {
                _this.readers.push(new Code93Reader_1.default());
            }
            if (possibleFormats.includes(BarcodeFormat_1.default.CODE_128)) {
                _this.readers.push(new Code128Reader_1.default());
            }
            if (possibleFormats.includes(BarcodeFormat_1.default.ITF)) {
                _this.readers.push(new ITFReader_1.default());
            }
            if (possibleFormats.includes(BarcodeFormat_1.default.CODABAR)) {
                _this.readers.push(new CodaBarReader_1.default());
            }
            if (possibleFormats.includes(BarcodeFormat_1.default.RSS_14)) {
                _this.readers.push(new RSS14Reader_1.default());
            }
            if (possibleFormats.includes(BarcodeFormat_1.default.RSS_EXPANDED)) {
                console.warn('RSS Expanded reader IS NOT ready for production yet! use at your own risk.');
                _this.readers.push(new RSSExpandedReader_1.default());
            }
        }
        if (_this.readers.length === 0) {
            _this.readers.push(new MultiFormatUPCEANReader_1.default(hints));
            _this.readers.push(new Code39Reader_1.default());
            // this.readers.push(new CodaBarReader());
            _this.readers.push(new Code93Reader_1.default());
            _this.readers.push(new MultiFormatUPCEANReader_1.default(hints));
            _this.readers.push(new Code128Reader_1.default());
            _this.readers.push(new ITFReader_1.default());
            _this.readers.push(new RSS14Reader_1.default());
            // this.readers.push(new RSSExpandedReader());
        }
        return _this;
    }
    // @Override
    MultiFormatOneDReader.prototype.decodeRow = function (rowNumber, row, hints) {
        for (var i = 0; i < this.readers.length; i++) {
            try {
                return this.readers[i].decodeRow(rowNumber, row, hints);
            }
            catch (re) {
                // continue
            }
        }
        throw new NotFoundException_1.default();
    };
    // @Override
    MultiFormatOneDReader.prototype.reset = function () {
        this.readers.forEach(function (reader) { return reader.reset(); });
    };
    return MultiFormatOneDReader;
}(OneDReader_1.default));
exports.default = MultiFormatOneDReader;
