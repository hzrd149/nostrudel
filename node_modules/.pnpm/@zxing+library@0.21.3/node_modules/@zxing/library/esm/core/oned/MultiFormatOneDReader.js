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
/*namespace com.google.zxing.oned {*/
import BarcodeFormat from '../BarcodeFormat';
import DecodeHintType from '../DecodeHintType';
import NotFoundException from '../NotFoundException';
import Code128Reader from './Code128Reader';
import Code39Reader from './Code39Reader';
import Code93Reader from './Code93Reader';
import ITFReader from './ITFReader';
import MultiFormatUPCEANReader from './MultiFormatUPCEANReader';
import OneDReader from './OneDReader';
import CodaBarReader from './CodaBarReader';
import RSSExpandedReader from './rss/expanded/RSSExpandedReader';
import RSS14Reader from './rss/RSS14Reader';
/**
 * @author Daniel Switkin <dswitkin@google.com>
 * @author Sean Owen
 */
var MultiFormatOneDReader = /** @class */ (function (_super) {
    __extends(MultiFormatOneDReader, _super);
    function MultiFormatOneDReader(hints) {
        var _this = _super.call(this) || this;
        _this.readers = [];
        var possibleFormats = !hints ? null : hints.get(DecodeHintType.POSSIBLE_FORMATS);
        var useCode39CheckDigit = hints && hints.get(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT) !== undefined;
        var useCode39ExtendedMode = hints && hints.get(DecodeHintType.ENABLE_CODE_39_EXTENDED_MODE) !== undefined;
        if (possibleFormats) {
            if (possibleFormats.includes(BarcodeFormat.EAN_13) ||
                possibleFormats.includes(BarcodeFormat.UPC_A) ||
                possibleFormats.includes(BarcodeFormat.EAN_8) ||
                possibleFormats.includes(BarcodeFormat.UPC_E)) {
                _this.readers.push(new MultiFormatUPCEANReader(hints));
            }
            if (possibleFormats.includes(BarcodeFormat.CODE_39)) {
                _this.readers.push(new Code39Reader(useCode39CheckDigit, useCode39ExtendedMode));
            }
            if (possibleFormats.includes(BarcodeFormat.CODE_93)) {
                _this.readers.push(new Code93Reader());
            }
            if (possibleFormats.includes(BarcodeFormat.CODE_128)) {
                _this.readers.push(new Code128Reader());
            }
            if (possibleFormats.includes(BarcodeFormat.ITF)) {
                _this.readers.push(new ITFReader());
            }
            if (possibleFormats.includes(BarcodeFormat.CODABAR)) {
                _this.readers.push(new CodaBarReader());
            }
            if (possibleFormats.includes(BarcodeFormat.RSS_14)) {
                _this.readers.push(new RSS14Reader());
            }
            if (possibleFormats.includes(BarcodeFormat.RSS_EXPANDED)) {
                console.warn('RSS Expanded reader IS NOT ready for production yet! use at your own risk.');
                _this.readers.push(new RSSExpandedReader());
            }
        }
        if (_this.readers.length === 0) {
            _this.readers.push(new MultiFormatUPCEANReader(hints));
            _this.readers.push(new Code39Reader());
            // this.readers.push(new CodaBarReader());
            _this.readers.push(new Code93Reader());
            _this.readers.push(new MultiFormatUPCEANReader(hints));
            _this.readers.push(new Code128Reader());
            _this.readers.push(new ITFReader());
            _this.readers.push(new RSS14Reader());
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
        throw new NotFoundException();
    };
    // @Override
    MultiFormatOneDReader.prototype.reset = function () {
        this.readers.forEach(function (reader) { return reader.reset(); });
    };
    return MultiFormatOneDReader;
}(OneDReader));
export default MultiFormatOneDReader;
