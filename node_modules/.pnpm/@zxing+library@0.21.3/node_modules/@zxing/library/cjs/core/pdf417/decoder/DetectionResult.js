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
// package com.google.zxing.pdf417.decoder;
// import com.google.zxing.pdf417.PDF417Common;
var PDF417Common_1 = require("../PDF417Common");
var Formatter_1 = require("../../util/Formatter");
/**
 * @author Guenther Grau
 */
var DetectionResult = /** @class */ (function () {
    function DetectionResult(barcodeMetadata, boundingBox) {
        /*final*/ this.ADJUST_ROW_NUMBER_SKIP = 2;
        this.barcodeMetadata = barcodeMetadata;
        this.barcodeColumnCount = barcodeMetadata.getColumnCount();
        this.boundingBox = boundingBox;
        // this.detectionResultColumns = new DetectionResultColumn[this.barcodeColumnCount + 2];
        this.detectionResultColumns = new Array(this.barcodeColumnCount + 2);
    }
    DetectionResult.prototype.getDetectionResultColumns = function () {
        this.adjustIndicatorColumnRowNumbers(this.detectionResultColumns[0]);
        this.adjustIndicatorColumnRowNumbers(this.detectionResultColumns[this.barcodeColumnCount + 1]);
        var unadjustedCodewordCount = PDF417Common_1.default.MAX_CODEWORDS_IN_BARCODE;
        var previousUnadjustedCount;
        do {
            previousUnadjustedCount = unadjustedCodewordCount;
            unadjustedCodewordCount = this.adjustRowNumbersAndGetCount();
        } while (unadjustedCodewordCount > 0 && unadjustedCodewordCount < previousUnadjustedCount);
        return this.detectionResultColumns;
    };
    DetectionResult.prototype.adjustIndicatorColumnRowNumbers = function (detectionResultColumn) {
        if (detectionResultColumn != null) {
            detectionResultColumn
                .adjustCompleteIndicatorColumnRowNumbers(this.barcodeMetadata);
        }
    };
    // TODO ensure that no detected codewords with unknown row number are left
    // we should be able to estimate the row height and use it as a hint for the row number
    // we should also fill the rows top to bottom and bottom to top
    /**
     * @return number of codewords which don't have a valid row number. Note that the count is not accurate as codewords
     * will be counted several times. It just serves as an indicator to see when we can stop adjusting row numbers
     */
    DetectionResult.prototype.adjustRowNumbersAndGetCount = function () {
        var unadjustedCount = this.adjustRowNumbersByRow();
        if (unadjustedCount === 0) {
            return 0;
        }
        for (var barcodeColumn /*int*/ = 1; barcodeColumn < this.barcodeColumnCount + 1; barcodeColumn++) {
            var codewords = this.detectionResultColumns[barcodeColumn].getCodewords();
            for (var codewordsRow /*int*/ = 0; codewordsRow < codewords.length; codewordsRow++) {
                if (codewords[codewordsRow] == null) {
                    continue;
                }
                if (!codewords[codewordsRow].hasValidRowNumber()) {
                    this.adjustRowNumbers(barcodeColumn, codewordsRow, codewords);
                }
            }
        }
        return unadjustedCount;
    };
    DetectionResult.prototype.adjustRowNumbersByRow = function () {
        this.adjustRowNumbersFromBothRI();
        // TODO we should only do full row adjustments if row numbers of left and right row indicator column match.
        // Maybe it's even better to calculated the height (rows: d) and divide it by the number of barcode
        // rows. This, together with the LRI and RRI row numbers should allow us to get a good estimate where a row
        // number starts and ends.
        var unadjustedCount = this.adjustRowNumbersFromLRI();
        return unadjustedCount + this.adjustRowNumbersFromRRI();
    };
    DetectionResult.prototype.adjustRowNumbersFromBothRI = function () {
        if (this.detectionResultColumns[0] == null || this.detectionResultColumns[this.barcodeColumnCount + 1] == null) {
            return;
        }
        var LRIcodewords = this.detectionResultColumns[0].getCodewords();
        var RRIcodewords = this.detectionResultColumns[this.barcodeColumnCount + 1].getCodewords();
        for (var codewordsRow /*int*/ = 0; codewordsRow < LRIcodewords.length; codewordsRow++) {
            if (LRIcodewords[codewordsRow] != null &&
                RRIcodewords[codewordsRow] != null &&
                LRIcodewords[codewordsRow].getRowNumber() === RRIcodewords[codewordsRow].getRowNumber()) {
                for (var barcodeColumn /*int*/ = 1; barcodeColumn <= this.barcodeColumnCount; barcodeColumn++) {
                    var codeword = this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow];
                    if (codeword == null) {
                        continue;
                    }
                    codeword.setRowNumber(LRIcodewords[codewordsRow].getRowNumber());
                    if (!codeword.hasValidRowNumber()) {
                        this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow] = null;
                    }
                }
            }
        }
    };
    DetectionResult.prototype.adjustRowNumbersFromRRI = function () {
        if (this.detectionResultColumns[this.barcodeColumnCount + 1] == null) {
            return 0;
        }
        var unadjustedCount = 0;
        var codewords = this.detectionResultColumns[this.barcodeColumnCount + 1].getCodewords();
        for (var codewordsRow /*int*/ = 0; codewordsRow < codewords.length; codewordsRow++) {
            if (codewords[codewordsRow] == null) {
                continue;
            }
            var rowIndicatorRowNumber = codewords[codewordsRow].getRowNumber();
            var invalidRowCounts = 0;
            for (var barcodeColumn /*int*/ = this.barcodeColumnCount + 1; barcodeColumn > 0 && invalidRowCounts < this.ADJUST_ROW_NUMBER_SKIP; barcodeColumn--) {
                var codeword = this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow];
                if (codeword != null) {
                    invalidRowCounts = DetectionResult.adjustRowNumberIfValid(rowIndicatorRowNumber, invalidRowCounts, codeword);
                    if (!codeword.hasValidRowNumber()) {
                        unadjustedCount++;
                    }
                }
            }
        }
        return unadjustedCount;
    };
    DetectionResult.prototype.adjustRowNumbersFromLRI = function () {
        if (this.detectionResultColumns[0] == null) {
            return 0;
        }
        var unadjustedCount = 0;
        var codewords = this.detectionResultColumns[0].getCodewords();
        for (var codewordsRow /*int*/ = 0; codewordsRow < codewords.length; codewordsRow++) {
            if (codewords[codewordsRow] == null) {
                continue;
            }
            var rowIndicatorRowNumber = codewords[codewordsRow].getRowNumber();
            var invalidRowCounts = 0;
            for (var barcodeColumn /*int*/ = 1; barcodeColumn < this.barcodeColumnCount + 1 && invalidRowCounts < this.ADJUST_ROW_NUMBER_SKIP; barcodeColumn++) {
                var codeword = this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow];
                if (codeword != null) {
                    invalidRowCounts = DetectionResult.adjustRowNumberIfValid(rowIndicatorRowNumber, invalidRowCounts, codeword);
                    if (!codeword.hasValidRowNumber()) {
                        unadjustedCount++;
                    }
                }
            }
        }
        return unadjustedCount;
    };
    DetectionResult.adjustRowNumberIfValid = function (rowIndicatorRowNumber, invalidRowCounts, codeword) {
        if (codeword == null) {
            return invalidRowCounts;
        }
        if (!codeword.hasValidRowNumber()) {
            if (codeword.isValidRowNumber(rowIndicatorRowNumber)) {
                codeword.setRowNumber(rowIndicatorRowNumber);
                invalidRowCounts = 0;
            }
            else {
                ++invalidRowCounts;
            }
        }
        return invalidRowCounts;
    };
    DetectionResult.prototype.adjustRowNumbers = function (barcodeColumn, codewordsRow, codewords) {
        var e_1, _a;
        if (this.detectionResultColumns[barcodeColumn - 1] == null) {
            return;
        }
        var codeword = codewords[codewordsRow];
        var previousColumnCodewords = this.detectionResultColumns[barcodeColumn - 1].getCodewords();
        var nextColumnCodewords = previousColumnCodewords;
        if (this.detectionResultColumns[barcodeColumn + 1] != null) {
            nextColumnCodewords = this.detectionResultColumns[barcodeColumn + 1].getCodewords();
        }
        // let otherCodewords: Codeword[] = new Codeword[14];
        var otherCodewords = new Array(14);
        otherCodewords[2] = previousColumnCodewords[codewordsRow];
        otherCodewords[3] = nextColumnCodewords[codewordsRow];
        if (codewordsRow > 0) {
            otherCodewords[0] = codewords[codewordsRow - 1];
            otherCodewords[4] = previousColumnCodewords[codewordsRow - 1];
            otherCodewords[5] = nextColumnCodewords[codewordsRow - 1];
        }
        if (codewordsRow > 1) {
            otherCodewords[8] = codewords[codewordsRow - 2];
            otherCodewords[10] = previousColumnCodewords[codewordsRow - 2];
            otherCodewords[11] = nextColumnCodewords[codewordsRow - 2];
        }
        if (codewordsRow < codewords.length - 1) {
            otherCodewords[1] = codewords[codewordsRow + 1];
            otherCodewords[6] = previousColumnCodewords[codewordsRow + 1];
            otherCodewords[7] = nextColumnCodewords[codewordsRow + 1];
        }
        if (codewordsRow < codewords.length - 2) {
            otherCodewords[9] = codewords[codewordsRow + 2];
            otherCodewords[12] = previousColumnCodewords[codewordsRow + 2];
            otherCodewords[13] = nextColumnCodewords[codewordsRow + 2];
        }
        try {
            for (var otherCodewords_1 = __values(otherCodewords), otherCodewords_1_1 = otherCodewords_1.next(); !otherCodewords_1_1.done; otherCodewords_1_1 = otherCodewords_1.next()) {
                var otherCodeword = otherCodewords_1_1.value;
                if (DetectionResult.adjustRowNumber(codeword, otherCodeword)) {
                    return;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (otherCodewords_1_1 && !otherCodewords_1_1.done && (_a = otherCodewords_1.return)) _a.call(otherCodewords_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * @return true, if row number was adjusted, false otherwise
     */
    DetectionResult.adjustRowNumber = function (codeword, otherCodeword) {
        if (otherCodeword == null) {
            return false;
        }
        if (otherCodeword.hasValidRowNumber() && otherCodeword.getBucket() === codeword.getBucket()) {
            codeword.setRowNumber(otherCodeword.getRowNumber());
            return true;
        }
        return false;
    };
    DetectionResult.prototype.getBarcodeColumnCount = function () {
        return this.barcodeColumnCount;
    };
    DetectionResult.prototype.getBarcodeRowCount = function () {
        return this.barcodeMetadata.getRowCount();
    };
    DetectionResult.prototype.getBarcodeECLevel = function () {
        return this.barcodeMetadata.getErrorCorrectionLevel();
    };
    DetectionResult.prototype.setBoundingBox = function (boundingBox) {
        this.boundingBox = boundingBox;
    };
    DetectionResult.prototype.getBoundingBox = function () {
        return this.boundingBox;
    };
    DetectionResult.prototype.setDetectionResultColumn = function (barcodeColumn, detectionResultColumn) {
        this.detectionResultColumns[barcodeColumn] = detectionResultColumn;
    };
    DetectionResult.prototype.getDetectionResultColumn = function (barcodeColumn) {
        return this.detectionResultColumns[barcodeColumn];
    };
    // @Override
    DetectionResult.prototype.toString = function () {
        var rowIndicatorColumn = this.detectionResultColumns[0];
        if (rowIndicatorColumn == null) {
            rowIndicatorColumn = this.detectionResultColumns[this.barcodeColumnCount + 1];
        }
        // try (
        var formatter = new Formatter_1.default();
        // ) {
        for (var codewordsRow /*int*/ = 0; codewordsRow < rowIndicatorColumn.getCodewords().length; codewordsRow++) {
            formatter.format('CW %3d:', codewordsRow);
            for (var barcodeColumn /*int*/ = 0; barcodeColumn < this.barcodeColumnCount + 2; barcodeColumn++) {
                if (this.detectionResultColumns[barcodeColumn] == null) {
                    formatter.format('    |   ');
                    continue;
                }
                var codeword = this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow];
                if (codeword == null) {
                    formatter.format('    |   ');
                    continue;
                }
                formatter.format(' %3d|%3d', codeword.getRowNumber(), codeword.getValue());
            }
            formatter.format('%n');
        }
        return formatter.toString();
        // }
    };
    return DetectionResult;
}());
exports.default = DetectionResult;
