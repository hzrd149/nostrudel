"use strict";
/*
 * Copyright 2013 ZXing authors
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
// import com.google.zxing.pdf417.PDF417Common;
var PDF417Common_1 = require("../PDF417Common");
var BarcodeMetadata_1 = require("./BarcodeMetadata");
var DetectionResultColumn_1 = require("./DetectionResultColumn");
var BarcodeValue_1 = require("./BarcodeValue");
/**
 * @author Guenther Grau
 */
var DetectionResultRowIndicatorColumn = /** @class */ (function (_super) {
    __extends(DetectionResultRowIndicatorColumn, _super);
    function DetectionResultRowIndicatorColumn(boundingBox, isLeft) {
        var _this = _super.call(this, boundingBox) || this;
        _this._isLeft = isLeft;
        return _this;
    }
    DetectionResultRowIndicatorColumn.prototype.setRowNumbers = function () {
        var e_1, _a;
        try {
            for (var _b = __values(this.getCodewords()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var codeword = _c.value /*Codeword*/;
                if (codeword != null) {
                    codeword.setRowNumberAsRowIndicatorColumn();
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
    };
    // TODO implement properly
    // TODO maybe we should add missing codewords to store the correct row number to make
    // finding row numbers for other columns easier
    // use row height count to make detection of invalid row numbers more reliable
    DetectionResultRowIndicatorColumn.prototype.adjustCompleteIndicatorColumnRowNumbers = function (barcodeMetadata) {
        var codewords = this.getCodewords();
        this.setRowNumbers();
        this.removeIncorrectCodewords(codewords, barcodeMetadata);
        var boundingBox = this.getBoundingBox();
        var top = this._isLeft ? boundingBox.getTopLeft() : boundingBox.getTopRight();
        var bottom = this._isLeft ? boundingBox.getBottomLeft() : boundingBox.getBottomRight();
        var firstRow = this.imageRowToCodewordIndex(Math.trunc(top.getY()));
        var lastRow = this.imageRowToCodewordIndex(Math.trunc(bottom.getY()));
        // We need to be careful using the average row height. Barcode could be skewed so that we have smaller and
        // taller rows
        // float averageRowHeight = (lastRow - firstRow) / /*(float)*/ barcodeMetadata.getRowCount();
        var barcodeRow = -1;
        var maxRowHeight = 1;
        var currentRowHeight = 0;
        for (var codewordsRow /*int*/ = firstRow; codewordsRow < lastRow; codewordsRow++) {
            if (codewords[codewordsRow] == null) {
                continue;
            }
            var codeword = codewords[codewordsRow];
            //      float expectedRowNumber = (codewordsRow - firstRow) / averageRowHeight;
            //      if (Math.abs(codeword.getRowNumber() - expectedRowNumber) > 2) {
            //        SimpleLog.log(LEVEL.WARNING,
            //            "Removing codeword, rowNumberSkew too high, codeword[" + codewordsRow + "]: Expected Row: " +
            //                expectedRowNumber + ", RealRow: " + codeword.getRowNumber() + ", value: " + codeword.getValue());
            //        codewords[codewordsRow] = null;
            //      }
            var rowDifference = codeword.getRowNumber() - barcodeRow;
            // TODO improve handling with case where first row indicator doesn't start with 0
            if (rowDifference === 0) {
                currentRowHeight++;
            }
            else if (rowDifference === 1) {
                maxRowHeight = Math.max(maxRowHeight, currentRowHeight);
                currentRowHeight = 1;
                barcodeRow = codeword.getRowNumber();
            }
            else if (rowDifference < 0 ||
                codeword.getRowNumber() >= barcodeMetadata.getRowCount() ||
                rowDifference > codewordsRow) {
                codewords[codewordsRow] = null;
            }
            else {
                var checkedRows = void 0;
                if (maxRowHeight > 2) {
                    checkedRows = (maxRowHeight - 2) * rowDifference;
                }
                else {
                    checkedRows = rowDifference;
                }
                var closePreviousCodewordFound = checkedRows >= codewordsRow;
                for (var i /*int*/ = 1; i <= checkedRows && !closePreviousCodewordFound; i++) {
                    // there must be (height * rowDifference) number of codewords missing. For now we assume height = 1.
                    // This should hopefully get rid of most problems already.
                    closePreviousCodewordFound = codewords[codewordsRow - i] != null;
                }
                if (closePreviousCodewordFound) {
                    codewords[codewordsRow] = null;
                }
                else {
                    barcodeRow = codeword.getRowNumber();
                    currentRowHeight = 1;
                }
            }
        }
        // return (int) (averageRowHeight + 0.5);
    };
    DetectionResultRowIndicatorColumn.prototype.getRowHeights = function () {
        var e_2, _a;
        var barcodeMetadata = this.getBarcodeMetadata();
        if (barcodeMetadata == null) {
            return null;
        }
        this.adjustIncompleteIndicatorColumnRowNumbers(barcodeMetadata);
        var result = new Int32Array(barcodeMetadata.getRowCount());
        try {
            for (var _b = __values(this.getCodewords()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var codeword = _c.value /*Codeword*/;
                if (codeword != null) {
                    var rowNumber = codeword.getRowNumber();
                    if (rowNumber >= result.length) {
                        // We have more rows than the barcode metadata allows for, ignore them.
                        continue;
                    }
                    result[rowNumber]++;
                } // else throw exception?
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return result;
    };
    // TODO maybe we should add missing codewords to store the correct row number to make
    // finding row numbers for other columns easier
    // use row height count to make detection of invalid row numbers more reliable
    DetectionResultRowIndicatorColumn.prototype.adjustIncompleteIndicatorColumnRowNumbers = function (barcodeMetadata) {
        var boundingBox = this.getBoundingBox();
        var top = this._isLeft ? boundingBox.getTopLeft() : boundingBox.getTopRight();
        var bottom = this._isLeft ? boundingBox.getBottomLeft() : boundingBox.getBottomRight();
        var firstRow = this.imageRowToCodewordIndex(Math.trunc(top.getY()));
        var lastRow = this.imageRowToCodewordIndex(Math.trunc(bottom.getY()));
        // float averageRowHeight = (lastRow - firstRow) / /*(float)*/ barcodeMetadata.getRowCount();
        var codewords = this.getCodewords();
        var barcodeRow = -1;
        var maxRowHeight = 1;
        var currentRowHeight = 0;
        for (var codewordsRow /*int*/ = firstRow; codewordsRow < lastRow; codewordsRow++) {
            if (codewords[codewordsRow] == null) {
                continue;
            }
            var codeword = codewords[codewordsRow];
            codeword.setRowNumberAsRowIndicatorColumn();
            var rowDifference = codeword.getRowNumber() - barcodeRow;
            // TODO improve handling with case where first row indicator doesn't start with 0
            if (rowDifference === 0) {
                currentRowHeight++;
            }
            else if (rowDifference === 1) {
                maxRowHeight = Math.max(maxRowHeight, currentRowHeight);
                currentRowHeight = 1;
                barcodeRow = codeword.getRowNumber();
            }
            else if (codeword.getRowNumber() >= barcodeMetadata.getRowCount()) {
                codewords[codewordsRow] = null;
            }
            else {
                barcodeRow = codeword.getRowNumber();
                currentRowHeight = 1;
            }
        }
        // return (int) (averageRowHeight + 0.5);
    };
    DetectionResultRowIndicatorColumn.prototype.getBarcodeMetadata = function () {
        var e_3, _a;
        var codewords = this.getCodewords();
        var barcodeColumnCount = new BarcodeValue_1.default();
        var barcodeRowCountUpperPart = new BarcodeValue_1.default();
        var barcodeRowCountLowerPart = new BarcodeValue_1.default();
        var barcodeECLevel = new BarcodeValue_1.default();
        try {
            for (var codewords_1 = __values(codewords), codewords_1_1 = codewords_1.next(); !codewords_1_1.done; codewords_1_1 = codewords_1.next()) {
                var codeword = codewords_1_1.value /*Codeword*/;
                if (codeword == null) {
                    continue;
                }
                codeword.setRowNumberAsRowIndicatorColumn();
                var rowIndicatorValue = codeword.getValue() % 30;
                var codewordRowNumber = codeword.getRowNumber();
                if (!this._isLeft) {
                    codewordRowNumber += 2;
                }
                switch (codewordRowNumber % 3) {
                    case 0:
                        barcodeRowCountUpperPart.setValue(rowIndicatorValue * 3 + 1);
                        break;
                    case 1:
                        barcodeECLevel.setValue(rowIndicatorValue / 3);
                        barcodeRowCountLowerPart.setValue(rowIndicatorValue % 3);
                        break;
                    case 2:
                        barcodeColumnCount.setValue(rowIndicatorValue + 1);
                        break;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (codewords_1_1 && !codewords_1_1.done && (_a = codewords_1.return)) _a.call(codewords_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        // Maybe we should check if we have ambiguous values?
        if ((barcodeColumnCount.getValue().length === 0) ||
            (barcodeRowCountUpperPart.getValue().length === 0) ||
            (barcodeRowCountLowerPart.getValue().length === 0) ||
            (barcodeECLevel.getValue().length === 0) ||
            barcodeColumnCount.getValue()[0] < 1 ||
            barcodeRowCountUpperPart.getValue()[0] + barcodeRowCountLowerPart.getValue()[0] < PDF417Common_1.default.MIN_ROWS_IN_BARCODE ||
            barcodeRowCountUpperPart.getValue()[0] + barcodeRowCountLowerPart.getValue()[0] > PDF417Common_1.default.MAX_ROWS_IN_BARCODE) {
            return null;
        }
        var barcodeMetadata = new BarcodeMetadata_1.default(barcodeColumnCount.getValue()[0], barcodeRowCountUpperPart.getValue()[0], barcodeRowCountLowerPart.getValue()[0], barcodeECLevel.getValue()[0]);
        this.removeIncorrectCodewords(codewords, barcodeMetadata);
        return barcodeMetadata;
    };
    DetectionResultRowIndicatorColumn.prototype.removeIncorrectCodewords = function (codewords, barcodeMetadata) {
        // Remove codewords which do not match the metadata
        // TODO Maybe we should keep the incorrect codewords for the start and end positions?
        for (var codewordRow /*int*/ = 0; codewordRow < codewords.length; codewordRow++) {
            var codeword = codewords[codewordRow];
            if (codewords[codewordRow] == null) {
                continue;
            }
            var rowIndicatorValue = codeword.getValue() % 30;
            var codewordRowNumber = codeword.getRowNumber();
            if (codewordRowNumber > barcodeMetadata.getRowCount()) {
                codewords[codewordRow] = null;
                continue;
            }
            if (!this._isLeft) {
                codewordRowNumber += 2;
            }
            switch (codewordRowNumber % 3) {
                case 0:
                    if (rowIndicatorValue * 3 + 1 !== barcodeMetadata.getRowCountUpperPart()) {
                        codewords[codewordRow] = null;
                    }
                    break;
                case 1:
                    if (Math.trunc(rowIndicatorValue / 3) !== barcodeMetadata.getErrorCorrectionLevel() ||
                        rowIndicatorValue % 3 !== barcodeMetadata.getRowCountLowerPart()) {
                        codewords[codewordRow] = null;
                    }
                    break;
                case 2:
                    if (rowIndicatorValue + 1 !== barcodeMetadata.getColumnCount()) {
                        codewords[codewordRow] = null;
                    }
                    break;
            }
        }
    };
    DetectionResultRowIndicatorColumn.prototype.isLeft = function () {
        return this._isLeft;
    };
    // @Override
    DetectionResultRowIndicatorColumn.prototype.toString = function () {
        return 'IsLeft: ' + this._isLeft + '\n' + _super.prototype.toString.call(this);
    };
    return DetectionResultRowIndicatorColumn;
}(DetectionResultColumn_1.default));
exports.default = DetectionResultRowIndicatorColumn;
