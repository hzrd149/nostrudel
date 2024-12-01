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
// package com.google.zxing.pdf417.decoder;
// import com.google.zxing.pdf417.PDF417Common;
import PDF417Common from '../PDF417Common';
import Formatter from '../../util/Formatter';
/**
 * @author Guenther Grau
 */
export default /*final*/ class DetectionResult {
    constructor(barcodeMetadata, boundingBox) {
        /*final*/ this.ADJUST_ROW_NUMBER_SKIP = 2;
        this.barcodeMetadata = barcodeMetadata;
        this.barcodeColumnCount = barcodeMetadata.getColumnCount();
        this.boundingBox = boundingBox;
        // this.detectionResultColumns = new DetectionResultColumn[this.barcodeColumnCount + 2];
        this.detectionResultColumns = new Array(this.barcodeColumnCount + 2);
    }
    getDetectionResultColumns() {
        this.adjustIndicatorColumnRowNumbers(this.detectionResultColumns[0]);
        this.adjustIndicatorColumnRowNumbers(this.detectionResultColumns[this.barcodeColumnCount + 1]);
        let unadjustedCodewordCount = PDF417Common.MAX_CODEWORDS_IN_BARCODE;
        let previousUnadjustedCount;
        do {
            previousUnadjustedCount = unadjustedCodewordCount;
            unadjustedCodewordCount = this.adjustRowNumbersAndGetCount();
        } while (unadjustedCodewordCount > 0 && unadjustedCodewordCount < previousUnadjustedCount);
        return this.detectionResultColumns;
    }
    adjustIndicatorColumnRowNumbers(detectionResultColumn) {
        if (detectionResultColumn != null) {
            detectionResultColumn
                .adjustCompleteIndicatorColumnRowNumbers(this.barcodeMetadata);
        }
    }
    // TODO ensure that no detected codewords with unknown row number are left
    // we should be able to estimate the row height and use it as a hint for the row number
    // we should also fill the rows top to bottom and bottom to top
    /**
     * @return number of codewords which don't have a valid row number. Note that the count is not accurate as codewords
     * will be counted several times. It just serves as an indicator to see when we can stop adjusting row numbers
     */
    adjustRowNumbersAndGetCount() {
        let unadjustedCount = this.adjustRowNumbersByRow();
        if (unadjustedCount === 0) {
            return 0;
        }
        for (let barcodeColumn /*int*/ = 1; barcodeColumn < this.barcodeColumnCount + 1; barcodeColumn++) {
            let codewords = this.detectionResultColumns[barcodeColumn].getCodewords();
            for (let codewordsRow /*int*/ = 0; codewordsRow < codewords.length; codewordsRow++) {
                if (codewords[codewordsRow] == null) {
                    continue;
                }
                if (!codewords[codewordsRow].hasValidRowNumber()) {
                    this.adjustRowNumbers(barcodeColumn, codewordsRow, codewords);
                }
            }
        }
        return unadjustedCount;
    }
    adjustRowNumbersByRow() {
        this.adjustRowNumbersFromBothRI();
        // TODO we should only do full row adjustments if row numbers of left and right row indicator column match.
        // Maybe it's even better to calculated the height (rows: d) and divide it by the number of barcode
        // rows. This, together with the LRI and RRI row numbers should allow us to get a good estimate where a row
        // number starts and ends.
        let unadjustedCount = this.adjustRowNumbersFromLRI();
        return unadjustedCount + this.adjustRowNumbersFromRRI();
    }
    adjustRowNumbersFromBothRI() {
        if (this.detectionResultColumns[0] == null || this.detectionResultColumns[this.barcodeColumnCount + 1] == null) {
            return;
        }
        let LRIcodewords = this.detectionResultColumns[0].getCodewords();
        let RRIcodewords = this.detectionResultColumns[this.barcodeColumnCount + 1].getCodewords();
        for (let codewordsRow /*int*/ = 0; codewordsRow < LRIcodewords.length; codewordsRow++) {
            if (LRIcodewords[codewordsRow] != null &&
                RRIcodewords[codewordsRow] != null &&
                LRIcodewords[codewordsRow].getRowNumber() === RRIcodewords[codewordsRow].getRowNumber()) {
                for (let barcodeColumn /*int*/ = 1; barcodeColumn <= this.barcodeColumnCount; barcodeColumn++) {
                    let codeword = this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow];
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
    }
    adjustRowNumbersFromRRI() {
        if (this.detectionResultColumns[this.barcodeColumnCount + 1] == null) {
            return 0;
        }
        let unadjustedCount = 0;
        let codewords = this.detectionResultColumns[this.barcodeColumnCount + 1].getCodewords();
        for (let codewordsRow /*int*/ = 0; codewordsRow < codewords.length; codewordsRow++) {
            if (codewords[codewordsRow] == null) {
                continue;
            }
            let rowIndicatorRowNumber = codewords[codewordsRow].getRowNumber();
            let invalidRowCounts = 0;
            for (let barcodeColumn /*int*/ = this.barcodeColumnCount + 1; barcodeColumn > 0 && invalidRowCounts < this.ADJUST_ROW_NUMBER_SKIP; barcodeColumn--) {
                let codeword = this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow];
                if (codeword != null) {
                    invalidRowCounts = DetectionResult.adjustRowNumberIfValid(rowIndicatorRowNumber, invalidRowCounts, codeword);
                    if (!codeword.hasValidRowNumber()) {
                        unadjustedCount++;
                    }
                }
            }
        }
        return unadjustedCount;
    }
    adjustRowNumbersFromLRI() {
        if (this.detectionResultColumns[0] == null) {
            return 0;
        }
        let unadjustedCount = 0;
        let codewords = this.detectionResultColumns[0].getCodewords();
        for (let codewordsRow /*int*/ = 0; codewordsRow < codewords.length; codewordsRow++) {
            if (codewords[codewordsRow] == null) {
                continue;
            }
            let rowIndicatorRowNumber = codewords[codewordsRow].getRowNumber();
            let invalidRowCounts = 0;
            for (let barcodeColumn /*int*/ = 1; barcodeColumn < this.barcodeColumnCount + 1 && invalidRowCounts < this.ADJUST_ROW_NUMBER_SKIP; barcodeColumn++) {
                let codeword = this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow];
                if (codeword != null) {
                    invalidRowCounts = DetectionResult.adjustRowNumberIfValid(rowIndicatorRowNumber, invalidRowCounts, codeword);
                    if (!codeword.hasValidRowNumber()) {
                        unadjustedCount++;
                    }
                }
            }
        }
        return unadjustedCount;
    }
    static adjustRowNumberIfValid(rowIndicatorRowNumber, invalidRowCounts, codeword) {
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
    }
    adjustRowNumbers(barcodeColumn, codewordsRow, codewords) {
        if (this.detectionResultColumns[barcodeColumn - 1] == null) {
            return;
        }
        let codeword = codewords[codewordsRow];
        let previousColumnCodewords = this.detectionResultColumns[barcodeColumn - 1].getCodewords();
        let nextColumnCodewords = previousColumnCodewords;
        if (this.detectionResultColumns[barcodeColumn + 1] != null) {
            nextColumnCodewords = this.detectionResultColumns[barcodeColumn + 1].getCodewords();
        }
        // let otherCodewords: Codeword[] = new Codeword[14];
        let otherCodewords = new Array(14);
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
        for (let otherCodeword of otherCodewords) {
            if (DetectionResult.adjustRowNumber(codeword, otherCodeword)) {
                return;
            }
        }
    }
    /**
     * @return true, if row number was adjusted, false otherwise
     */
    static adjustRowNumber(codeword, otherCodeword) {
        if (otherCodeword == null) {
            return false;
        }
        if (otherCodeword.hasValidRowNumber() && otherCodeword.getBucket() === codeword.getBucket()) {
            codeword.setRowNumber(otherCodeword.getRowNumber());
            return true;
        }
        return false;
    }
    getBarcodeColumnCount() {
        return this.barcodeColumnCount;
    }
    getBarcodeRowCount() {
        return this.barcodeMetadata.getRowCount();
    }
    getBarcodeECLevel() {
        return this.barcodeMetadata.getErrorCorrectionLevel();
    }
    setBoundingBox(boundingBox) {
        this.boundingBox = boundingBox;
    }
    getBoundingBox() {
        return this.boundingBox;
    }
    setDetectionResultColumn(barcodeColumn, detectionResultColumn) {
        this.detectionResultColumns[barcodeColumn] = detectionResultColumn;
    }
    getDetectionResultColumn(barcodeColumn) {
        return this.detectionResultColumns[barcodeColumn];
    }
    // @Override
    toString() {
        let rowIndicatorColumn = this.detectionResultColumns[0];
        if (rowIndicatorColumn == null) {
            rowIndicatorColumn = this.detectionResultColumns[this.barcodeColumnCount + 1];
        }
        // try (
        let formatter = new Formatter();
        // ) {
        for (let codewordsRow /*int*/ = 0; codewordsRow < rowIndicatorColumn.getCodewords().length; codewordsRow++) {
            formatter.format('CW %3d:', codewordsRow);
            for (let barcodeColumn /*int*/ = 0; barcodeColumn < this.barcodeColumnCount + 2; barcodeColumn++) {
                if (this.detectionResultColumns[barcodeColumn] == null) {
                    formatter.format('    |   ');
                    continue;
                }
                let codeword = this.detectionResultColumns[barcodeColumn].getCodewords()[codewordsRow];
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
    }
}
