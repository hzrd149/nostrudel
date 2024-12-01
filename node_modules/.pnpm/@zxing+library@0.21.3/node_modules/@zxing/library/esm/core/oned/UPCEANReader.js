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
import BarcodeFormat from '../BarcodeFormat';
import DecodeHintType from '../DecodeHintType';
import Result from '../Result';
import ResultMetadataType from '../ResultMetadataType';
import ResultPoint from '../ResultPoint';
import UPCEANExtensionSupport from './UPCEANExtensionSupport';
import AbstractUPCEANReader from './AbstractUPCEANReader';
import NotFoundException from '../NotFoundException';
import FormatException from '../FormatException';
import ChecksumException from '../ChecksumException';
/**
 * <p>Encapsulates functionality and implementation that is common to UPC and EAN families
 * of one-dimensional barcodes.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
var UPCEANReader = /** @class */ (function (_super) {
    __extends(UPCEANReader, _super);
    function UPCEANReader() {
        var _this = _super.call(this) || this;
        _this.decodeRowStringBuffer = '';
        UPCEANReader.L_AND_G_PATTERNS = UPCEANReader.L_PATTERNS.map(function (arr) { return Int32Array.from(arr); });
        for (var i = 10; i < 20; i++) {
            var widths = UPCEANReader.L_PATTERNS[i - 10];
            var reversedWidths = new Int32Array(widths.length);
            for (var j = 0; j < widths.length; j++) {
                reversedWidths[j] = widths[widths.length - j - 1];
            }
            UPCEANReader.L_AND_G_PATTERNS[i] = reversedWidths;
        }
        return _this;
    }
    UPCEANReader.prototype.decodeRow = function (rowNumber, row, hints) {
        var startGuardRange = UPCEANReader.findStartGuardPattern(row);
        var resultPointCallback = hints == null ? null : hints.get(DecodeHintType.NEED_RESULT_POINT_CALLBACK);
        if (resultPointCallback != null) {
            var resultPoint_1 = new ResultPoint((startGuardRange[0] + startGuardRange[1]) / 2.0, rowNumber);
            resultPointCallback.foundPossibleResultPoint(resultPoint_1);
        }
        var budello = this.decodeMiddle(row, startGuardRange, this.decodeRowStringBuffer);
        var endStart = budello.rowOffset;
        var result = budello.resultString;
        if (resultPointCallback != null) {
            var resultPoint_2 = new ResultPoint(endStart, rowNumber);
            resultPointCallback.foundPossibleResultPoint(resultPoint_2);
        }
        var endRange = UPCEANReader.decodeEnd(row, endStart);
        if (resultPointCallback != null) {
            var resultPoint_3 = new ResultPoint((endRange[0] + endRange[1]) / 2.0, rowNumber);
            resultPointCallback.foundPossibleResultPoint(resultPoint_3);
        }
        // Make sure there is a quiet zone at least as big as the end pattern after the barcode. The
        // spec might want more whitespace, but in practice this is the maximum we can count on.
        var end = endRange[1];
        var quietEnd = end + (end - endRange[0]);
        if (quietEnd >= row.getSize() || !row.isRange(end, quietEnd, false)) {
            throw new NotFoundException();
        }
        var resultString = result.toString();
        // UPC/EAN should never be less than 8 chars anyway
        if (resultString.length < 8) {
            throw new FormatException();
        }
        if (!UPCEANReader.checkChecksum(resultString)) {
            throw new ChecksumException();
        }
        var left = (startGuardRange[1] + startGuardRange[0]) / 2.0;
        var right = (endRange[1] + endRange[0]) / 2.0;
        var format = this.getBarcodeFormat();
        var resultPoint = [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)];
        var decodeResult = new Result(resultString, null, 0, resultPoint, format, new Date().getTime());
        var extensionLength = 0;
        try {
            var extensionResult = UPCEANExtensionSupport.decodeRow(rowNumber, row, endRange[1]);
            decodeResult.putMetadata(ResultMetadataType.UPC_EAN_EXTENSION, extensionResult.getText());
            decodeResult.putAllMetadata(extensionResult.getResultMetadata());
            decodeResult.addResultPoints(extensionResult.getResultPoints());
            extensionLength = extensionResult.getText().length;
        }
        catch (err) {
        }
        var allowedExtensions = hints == null ? null : hints.get(DecodeHintType.ALLOWED_EAN_EXTENSIONS);
        if (allowedExtensions != null) {
            var valid = false;
            for (var length_1 in allowedExtensions) {
                if (extensionLength.toString() === length_1) { // check me
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                throw new NotFoundException();
            }
        }
        if (format === BarcodeFormat.EAN_13 || format === BarcodeFormat.UPC_A) {
            // let countryID = eanManSupport.lookupContryIdentifier(resultString); todo
            // if (countryID != null) {
            //     decodeResult.putMetadata(ResultMetadataType.POSSIBLE_COUNTRY, countryID);
            // }
        }
        return decodeResult;
    };
    UPCEANReader.checkChecksum = function (s) {
        return UPCEANReader.checkStandardUPCEANChecksum(s);
    };
    UPCEANReader.checkStandardUPCEANChecksum = function (s) {
        var length = s.length;
        if (length === 0)
            return false;
        var check = parseInt(s.charAt(length - 1), 10);
        return UPCEANReader.getStandardUPCEANChecksum(s.substring(0, length - 1)) === check;
    };
    UPCEANReader.getStandardUPCEANChecksum = function (s) {
        var length = s.length;
        var sum = 0;
        for (var i = length - 1; i >= 0; i -= 2) {
            var digit = s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
            if (digit < 0 || digit > 9) {
                throw new FormatException();
            }
            sum += digit;
        }
        sum *= 3;
        for (var i = length - 2; i >= 0; i -= 2) {
            var digit = s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
            if (digit < 0 || digit > 9) {
                throw new FormatException();
            }
            sum += digit;
        }
        return (1000 - sum) % 10;
    };
    UPCEANReader.decodeEnd = function (row, endStart) {
        return UPCEANReader.findGuardPattern(row, endStart, false, UPCEANReader.START_END_PATTERN, new Int32Array(UPCEANReader.START_END_PATTERN.length).fill(0));
    };
    return UPCEANReader;
}(AbstractUPCEANReader));
export default UPCEANReader;
