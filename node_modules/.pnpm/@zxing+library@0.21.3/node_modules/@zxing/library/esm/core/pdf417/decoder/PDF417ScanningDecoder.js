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
// package com.google.zxing.pdf417.decoder;
// import com.google.zxing.ChecksumException;
import ChecksumException from '../../ChecksumException';
// import com.google.zxing.FormatException;
import FormatException from '../../FormatException';
// import com.google.zxing.NotFoundException;
import NotFoundException from '../../NotFoundException';
// import com.google.zxing.common.detector.MathUtils;
import MathUtils from '../../common/detector/MathUtils';
// import com.google.zxing.pdf417.PDF417Common;
import PDF417Common from '../PDF417Common';
// import com.google.zxing.pdf417.decoder.ec.ErrorCorrection;
import ErrorCorrection from './ec/ErrorCorrection';
// local
import BoundingBox from './BoundingBox';
import DetectionResultRowIndicatorColumn from './DetectionResultRowIndicatorColumn';
import DetectionResult from './DetectionResult';
import DetectionResultColumn from './DetectionResultColumn';
import Codeword from './Codeword';
import BarcodeValue from './BarcodeValue';
import PDF417CodewordDecoder from './PDF417CodewordDecoder';
import DecodedBitStreamParser from './DecodedBitStreamParser';
// utils
import Formatter from '../../util/Formatter';
// import java.util.ArrayList;
// import java.util.Collection;
// import java.util.Formatter;
// import java.util.List;
/**
 * @author Guenther Grau
 */
var PDF417ScanningDecoder = /** @class */ (function () {
    function PDF417ScanningDecoder() {
    }
    /**
     * @TODO don't pass in minCodewordWidth and maxCodewordWidth, pass in barcode columns for start and stop pattern
     *
     * columns. That way width can be deducted from the pattern column.
     * This approach also allows to detect more details about the barcode, e.g. if a bar type (white or black) is wider
     * than it should be. This can happen if the scanner used a bad blackpoint.
     *
     * @param BitMatrix
     * @param image
     * @param ResultPoint
     * @param imageTopLeft
     * @param ResultPoint
     * @param imageBottomLeft
     * @param ResultPoint
     * @param imageTopRight
     * @param ResultPoint
     * @param imageBottomRight
     * @param int
     * @param minCodewordWidth
     * @param int
     * @param maxCodewordWidth
     *
     * @throws NotFoundException
     * @throws FormatException
     * @throws ChecksumException
     */
    PDF417ScanningDecoder.decode = function (image, imageTopLeft, imageBottomLeft, imageTopRight, imageBottomRight, minCodewordWidth, maxCodewordWidth) {
        var boundingBox = new BoundingBox(image, imageTopLeft, imageBottomLeft, imageTopRight, imageBottomRight);
        var leftRowIndicatorColumn = null;
        var rightRowIndicatorColumn = null;
        var detectionResult;
        for (var firstPass /*boolean*/ = true;; firstPass = false) {
            if (imageTopLeft != null) {
                leftRowIndicatorColumn = PDF417ScanningDecoder.getRowIndicatorColumn(image, boundingBox, imageTopLeft, true, minCodewordWidth, maxCodewordWidth);
            }
            if (imageTopRight != null) {
                rightRowIndicatorColumn = PDF417ScanningDecoder.getRowIndicatorColumn(image, boundingBox, imageTopRight, false, minCodewordWidth, maxCodewordWidth);
            }
            detectionResult = PDF417ScanningDecoder.merge(leftRowIndicatorColumn, rightRowIndicatorColumn);
            if (detectionResult == null) {
                throw NotFoundException.getNotFoundInstance();
            }
            var resultBox = detectionResult.getBoundingBox();
            if (firstPass && resultBox != null &&
                (resultBox.getMinY() < boundingBox.getMinY() || resultBox.getMaxY() > boundingBox.getMaxY())) {
                boundingBox = resultBox;
            }
            else {
                break;
            }
        }
        detectionResult.setBoundingBox(boundingBox);
        var maxBarcodeColumn = detectionResult.getBarcodeColumnCount() + 1;
        detectionResult.setDetectionResultColumn(0, leftRowIndicatorColumn);
        detectionResult.setDetectionResultColumn(maxBarcodeColumn, rightRowIndicatorColumn);
        var leftToRight = leftRowIndicatorColumn != null;
        for (var barcodeColumnCount /*int*/ = 1; barcodeColumnCount <= maxBarcodeColumn; barcodeColumnCount++) {
            var barcodeColumn = leftToRight ? barcodeColumnCount : maxBarcodeColumn - barcodeColumnCount;
            if (detectionResult.getDetectionResultColumn(barcodeColumn) !== /* null */ undefined) {
                // This will be the case for the opposite row indicator column, which doesn't need to be decoded again.
                continue;
            }
            var detectionResultColumn = void 0;
            if (barcodeColumn === 0 || barcodeColumn === maxBarcodeColumn) {
                detectionResultColumn = new DetectionResultRowIndicatorColumn(boundingBox, barcodeColumn === 0);
            }
            else {
                detectionResultColumn = new DetectionResultColumn(boundingBox);
            }
            detectionResult.setDetectionResultColumn(barcodeColumn, detectionResultColumn);
            var startColumn = -1;
            var previousStartColumn = startColumn;
            // TODO start at a row for which we know the start position, then detect upwards and downwards from there.
            for (var imageRow /*int*/ = boundingBox.getMinY(); imageRow <= boundingBox.getMaxY(); imageRow++) {
                startColumn = PDF417ScanningDecoder.getStartColumn(detectionResult, barcodeColumn, imageRow, leftToRight);
                if (startColumn < 0 || startColumn > boundingBox.getMaxX()) {
                    if (previousStartColumn === -1) {
                        continue;
                    }
                    startColumn = previousStartColumn;
                }
                var codeword = PDF417ScanningDecoder.detectCodeword(image, boundingBox.getMinX(), boundingBox.getMaxX(), leftToRight, startColumn, imageRow, minCodewordWidth, maxCodewordWidth);
                if (codeword != null) {
                    detectionResultColumn.setCodeword(imageRow, codeword);
                    previousStartColumn = startColumn;
                    minCodewordWidth = Math.min(minCodewordWidth, codeword.getWidth());
                    maxCodewordWidth = Math.max(maxCodewordWidth, codeword.getWidth());
                }
            }
        }
        return PDF417ScanningDecoder.createDecoderResult(detectionResult);
    };
    /**
     *
     * @param leftRowIndicatorColumn
     * @param rightRowIndicatorColumn
     *
     * @throws NotFoundException
     */
    PDF417ScanningDecoder.merge = function (leftRowIndicatorColumn, rightRowIndicatorColumn) {
        if (leftRowIndicatorColumn == null && rightRowIndicatorColumn == null) {
            return null;
        }
        var barcodeMetadata = PDF417ScanningDecoder.getBarcodeMetadata(leftRowIndicatorColumn, rightRowIndicatorColumn);
        if (barcodeMetadata == null) {
            return null;
        }
        var boundingBox = BoundingBox.merge(PDF417ScanningDecoder.adjustBoundingBox(leftRowIndicatorColumn), PDF417ScanningDecoder.adjustBoundingBox(rightRowIndicatorColumn));
        return new DetectionResult(barcodeMetadata, boundingBox);
    };
    /**
     *
     * @param rowIndicatorColumn
     *
     * @throws NotFoundException
     */
    PDF417ScanningDecoder.adjustBoundingBox = function (rowIndicatorColumn) {
        var e_1, _a;
        if (rowIndicatorColumn == null) {
            return null;
        }
        var rowHeights = rowIndicatorColumn.getRowHeights();
        if (rowHeights == null) {
            return null;
        }
        var maxRowHeight = PDF417ScanningDecoder.getMax(rowHeights);
        var missingStartRows = 0;
        try {
            for (var rowHeights_1 = __values(rowHeights), rowHeights_1_1 = rowHeights_1.next(); !rowHeights_1_1.done; rowHeights_1_1 = rowHeights_1.next()) {
                var rowHeight = rowHeights_1_1.value /*int*/;
                missingStartRows += maxRowHeight - rowHeight;
                if (rowHeight > 0) {
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (rowHeights_1_1 && !rowHeights_1_1.done && (_a = rowHeights_1.return)) _a.call(rowHeights_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var codewords = rowIndicatorColumn.getCodewords();
        for (var row /*int*/ = 0; missingStartRows > 0 && codewords[row] == null; row++) {
            missingStartRows--;
        }
        var missingEndRows = 0;
        for (var row /*int*/ = rowHeights.length - 1; row >= 0; row--) {
            missingEndRows += maxRowHeight - rowHeights[row];
            if (rowHeights[row] > 0) {
                break;
            }
        }
        for (var row /*int*/ = codewords.length - 1; missingEndRows > 0 && codewords[row] == null; row--) {
            missingEndRows--;
        }
        return rowIndicatorColumn.getBoundingBox().addMissingRows(missingStartRows, missingEndRows, rowIndicatorColumn.isLeft());
    };
    PDF417ScanningDecoder.getMax = function (values) {
        var e_2, _a;
        var maxValue = -1;
        try {
            for (var values_1 = __values(values), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
                var value = values_1_1.value /*int*/;
                maxValue = Math.max(maxValue, value);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (values_1_1 && !values_1_1.done && (_a = values_1.return)) _a.call(values_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return maxValue;
    };
    PDF417ScanningDecoder.getBarcodeMetadata = function (leftRowIndicatorColumn, rightRowIndicatorColumn) {
        var leftBarcodeMetadata;
        if (leftRowIndicatorColumn == null ||
            (leftBarcodeMetadata = leftRowIndicatorColumn.getBarcodeMetadata()) == null) {
            return rightRowIndicatorColumn == null ? null : rightRowIndicatorColumn.getBarcodeMetadata();
        }
        var rightBarcodeMetadata;
        if (rightRowIndicatorColumn == null ||
            (rightBarcodeMetadata = rightRowIndicatorColumn.getBarcodeMetadata()) == null) {
            return leftBarcodeMetadata;
        }
        if (leftBarcodeMetadata.getColumnCount() !== rightBarcodeMetadata.getColumnCount() &&
            leftBarcodeMetadata.getErrorCorrectionLevel() !== rightBarcodeMetadata.getErrorCorrectionLevel() &&
            leftBarcodeMetadata.getRowCount() !== rightBarcodeMetadata.getRowCount()) {
            return null;
        }
        return leftBarcodeMetadata;
    };
    PDF417ScanningDecoder.getRowIndicatorColumn = function (image, boundingBox, startPoint, leftToRight, minCodewordWidth, maxCodewordWidth) {
        var rowIndicatorColumn = new DetectionResultRowIndicatorColumn(boundingBox, leftToRight);
        for (var i /*int*/ = 0; i < 2; i++) {
            var increment = i === 0 ? 1 : -1;
            var startColumn = Math.trunc(Math.trunc(startPoint.getX()));
            for (var imageRow /*int*/ = Math.trunc(Math.trunc(startPoint.getY())); imageRow <= boundingBox.getMaxY() &&
                imageRow >= boundingBox.getMinY(); imageRow += increment) {
                var codeword = PDF417ScanningDecoder.detectCodeword(image, 0, image.getWidth(), leftToRight, startColumn, imageRow, minCodewordWidth, maxCodewordWidth);
                if (codeword != null) {
                    rowIndicatorColumn.setCodeword(imageRow, codeword);
                    if (leftToRight) {
                        startColumn = codeword.getStartX();
                    }
                    else {
                        startColumn = codeword.getEndX();
                    }
                }
            }
        }
        return rowIndicatorColumn;
    };
    /**
     *
     * @param detectionResult
     * @param BarcodeValue
     * @param param2
     * @param param3
     * @param barcodeMatrix
     *
     * @throws NotFoundException
     */
    PDF417ScanningDecoder.adjustCodewordCount = function (detectionResult, barcodeMatrix) {
        var barcodeMatrix01 = barcodeMatrix[0][1];
        var numberOfCodewords = barcodeMatrix01.getValue();
        var calculatedNumberOfCodewords = detectionResult.getBarcodeColumnCount() *
            detectionResult.getBarcodeRowCount() -
            PDF417ScanningDecoder.getNumberOfECCodeWords(detectionResult.getBarcodeECLevel());
        if (numberOfCodewords.length === 0) {
            if (calculatedNumberOfCodewords < 1 || calculatedNumberOfCodewords > PDF417Common.MAX_CODEWORDS_IN_BARCODE) {
                throw NotFoundException.getNotFoundInstance();
            }
            barcodeMatrix01.setValue(calculatedNumberOfCodewords);
        }
        else if (numberOfCodewords[0] !== calculatedNumberOfCodewords) {
            // The calculated one is more reliable as it is derived from the row indicator columns
            barcodeMatrix01.setValue(calculatedNumberOfCodewords);
        }
    };
    /**
     *
     * @param detectionResult
     *
     * @throws FormatException
     * @throws ChecksumException
     * @throws NotFoundException
     */
    PDF417ScanningDecoder.createDecoderResult = function (detectionResult) {
        var barcodeMatrix = PDF417ScanningDecoder.createBarcodeMatrix(detectionResult);
        PDF417ScanningDecoder.adjustCodewordCount(detectionResult, barcodeMatrix);
        var erasures /*Collection<Integer>*/ = new Array();
        var codewords = new Int32Array(detectionResult.getBarcodeRowCount() * detectionResult.getBarcodeColumnCount());
        var ambiguousIndexValuesList = /*List<int[]>*/ [];
        var ambiguousIndexesList = /*Collection<Integer>*/ new Array();
        for (var row /*int*/ = 0; row < detectionResult.getBarcodeRowCount(); row++) {
            for (var column /*int*/ = 0; column < detectionResult.getBarcodeColumnCount(); column++) {
                var values = barcodeMatrix[row][column + 1].getValue();
                var codewordIndex = row * detectionResult.getBarcodeColumnCount() + column;
                if (values.length === 0) {
                    erasures.push(codewordIndex);
                }
                else if (values.length === 1) {
                    codewords[codewordIndex] = values[0];
                }
                else {
                    ambiguousIndexesList.push(codewordIndex);
                    ambiguousIndexValuesList.push(values);
                }
            }
        }
        var ambiguousIndexValues = new Array(ambiguousIndexValuesList.length);
        for (var i /*int*/ = 0; i < ambiguousIndexValues.length; i++) {
            ambiguousIndexValues[i] = ambiguousIndexValuesList[i];
        }
        return PDF417ScanningDecoder.createDecoderResultFromAmbiguousValues(detectionResult.getBarcodeECLevel(), codewords, PDF417Common.toIntArray(erasures), PDF417Common.toIntArray(ambiguousIndexesList), ambiguousIndexValues);
    };
    /**
     * This method deals with the fact, that the decoding process doesn't always yield a single most likely value. The
     * current error correction implementation doesn't deal with erasures very well, so it's better to provide a value
     * for these ambiguous codewords instead of treating it as an erasure. The problem is that we don't know which of
     * the ambiguous values to choose. We try decode using the first value, and if that fails, we use another of the
     * ambiguous values and try to decode again. This usually only happens on very hard to read and decode barcodes,
     * so decoding the normal barcodes is not affected by this.
     *
     * @param erasureArray contains the indexes of erasures
     * @param ambiguousIndexes array with the indexes that have more than one most likely value
     * @param ambiguousIndexValues two dimensional array that contains the ambiguous values. The first dimension must
     * be the same length as the ambiguousIndexes array
     *
     * @throws FormatException
     * @throws ChecksumException
     */
    PDF417ScanningDecoder.createDecoderResultFromAmbiguousValues = function (ecLevel, codewords, erasureArray, ambiguousIndexes, ambiguousIndexValues) {
        var ambiguousIndexCount = new Int32Array(ambiguousIndexes.length);
        var tries = 100;
        while (tries-- > 0) {
            for (var i /*int*/ = 0; i < ambiguousIndexCount.length; i++) {
                codewords[ambiguousIndexes[i]] = ambiguousIndexValues[i][ambiguousIndexCount[i]];
            }
            try {
                return PDF417ScanningDecoder.decodeCodewords(codewords, ecLevel, erasureArray);
            }
            catch (err) {
                var ignored = err instanceof ChecksumException;
                if (!ignored) {
                    throw err;
                }
            }
            if (ambiguousIndexCount.length === 0) {
                throw ChecksumException.getChecksumInstance();
            }
            for (var i /*int*/ = 0; i < ambiguousIndexCount.length; i++) {
                if (ambiguousIndexCount[i] < ambiguousIndexValues[i].length - 1) {
                    ambiguousIndexCount[i]++;
                    break;
                }
                else {
                    ambiguousIndexCount[i] = 0;
                    if (i === ambiguousIndexCount.length - 1) {
                        throw ChecksumException.getChecksumInstance();
                    }
                }
            }
        }
        throw ChecksumException.getChecksumInstance();
    };
    PDF417ScanningDecoder.createBarcodeMatrix = function (detectionResult) {
        var e_3, _a, e_4, _b;
        // let barcodeMatrix: BarcodeValue[][] =
        // new BarcodeValue[detectionResult.getBarcodeRowCount()][detectionResult.getBarcodeColumnCount() + 2];
        var barcodeMatrix = Array.from({ length: detectionResult.getBarcodeRowCount() }, function () { return new Array(detectionResult.getBarcodeColumnCount() + 2); });
        for (var row /*int*/ = 0; row < barcodeMatrix.length; row++) {
            for (var column_1 /*int*/ = 0; column_1 < barcodeMatrix[row].length; column_1++) {
                barcodeMatrix[row][column_1] = new BarcodeValue();
            }
        }
        var column = 0;
        try {
            for (var _c = __values(detectionResult.getDetectionResultColumns()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var detectionResultColumn = _d.value /*DetectionResultColumn*/;
                if (detectionResultColumn != null) {
                    try {
                        for (var _e = (e_4 = void 0, __values(detectionResultColumn.getCodewords())), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var codeword = _f.value /*Codeword*/;
                            if (codeword != null) {
                                var rowNumber = codeword.getRowNumber();
                                if (rowNumber >= 0) {
                                    if (rowNumber >= barcodeMatrix.length) {
                                        // We have more rows than the barcode metadata allows for, ignore them.
                                        continue;
                                    }
                                    barcodeMatrix[rowNumber][column].setValue(codeword.getValue());
                                }
                            }
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
                column++;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return barcodeMatrix;
    };
    PDF417ScanningDecoder.isValidBarcodeColumn = function (detectionResult, barcodeColumn) {
        return barcodeColumn >= 0 && barcodeColumn <= detectionResult.getBarcodeColumnCount() + 1;
    };
    PDF417ScanningDecoder.getStartColumn = function (detectionResult, barcodeColumn, imageRow, leftToRight) {
        var e_5, _a;
        var offset = leftToRight ? 1 : -1;
        var codeword = null;
        if (PDF417ScanningDecoder.isValidBarcodeColumn(detectionResult, barcodeColumn - offset)) {
            codeword = detectionResult.getDetectionResultColumn(barcodeColumn - offset).getCodeword(imageRow);
        }
        if (codeword != null) {
            return leftToRight ? codeword.getEndX() : codeword.getStartX();
        }
        codeword = detectionResult.getDetectionResultColumn(barcodeColumn).getCodewordNearby(imageRow);
        if (codeword != null) {
            return leftToRight ? codeword.getStartX() : codeword.getEndX();
        }
        if (PDF417ScanningDecoder.isValidBarcodeColumn(detectionResult, barcodeColumn - offset)) {
            codeword = detectionResult.getDetectionResultColumn(barcodeColumn - offset).getCodewordNearby(imageRow);
        }
        if (codeword != null) {
            return leftToRight ? codeword.getEndX() : codeword.getStartX();
        }
        var skippedColumns = 0;
        while (PDF417ScanningDecoder.isValidBarcodeColumn(detectionResult, barcodeColumn - offset)) {
            barcodeColumn -= offset;
            try {
                for (var _b = (e_5 = void 0, __values(detectionResult.getDetectionResultColumn(barcodeColumn).getCodewords())), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var previousRowCodeword = _c.value /*Codeword*/;
                    if (previousRowCodeword != null) {
                        return (leftToRight ? previousRowCodeword.getEndX() : previousRowCodeword.getStartX()) +
                            offset *
                                skippedColumns *
                                (previousRowCodeword.getEndX() - previousRowCodeword.getStartX());
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_5) throw e_5.error; }
            }
            skippedColumns++;
        }
        return leftToRight ? detectionResult.getBoundingBox().getMinX() : detectionResult.getBoundingBox().getMaxX();
    };
    PDF417ScanningDecoder.detectCodeword = function (image, minColumn, maxColumn, leftToRight, startColumn, imageRow, minCodewordWidth, maxCodewordWidth) {
        startColumn = PDF417ScanningDecoder.adjustCodewordStartColumn(image, minColumn, maxColumn, leftToRight, startColumn, imageRow);
        // we usually know fairly exact now how long a codeword is. We should provide minimum and maximum expected length
        // and try to adjust the read pixels, e.g. remove single pixel errors or try to cut off exceeding pixels.
        // min and maxCodewordWidth should not be used as they are calculated for the whole barcode an can be inaccurate
        // for the current position
        var moduleBitCount = PDF417ScanningDecoder.getModuleBitCount(image, minColumn, maxColumn, leftToRight, startColumn, imageRow);
        if (moduleBitCount == null) {
            return null;
        }
        var endColumn;
        var codewordBitCount = MathUtils.sum(moduleBitCount);
        if (leftToRight) {
            endColumn = startColumn + codewordBitCount;
        }
        else {
            for (var i /*int*/ = 0; i < moduleBitCount.length / 2; i++) {
                var tmpCount = moduleBitCount[i];
                moduleBitCount[i] = moduleBitCount[moduleBitCount.length - 1 - i];
                moduleBitCount[moduleBitCount.length - 1 - i] = tmpCount;
            }
            endColumn = startColumn;
            startColumn = endColumn - codewordBitCount;
        }
        // TODO implement check for width and correction of black and white bars
        // use start (and maybe stop pattern) to determine if black bars are wider than white bars. If so, adjust.
        // should probably done only for codewords with a lot more than 17 bits.
        // The following fixes 10-1.png, which has wide black bars and small white bars
        //    for (let i /*int*/ = 0; i < moduleBitCount.length; i++) {
        //      if (i % 2 === 0) {
        //        moduleBitCount[i]--;
        //      } else {
        //        moduleBitCount[i]++;
        //      }
        //    }
        // We could also use the width of surrounding codewords for more accurate results, but this seems
        // sufficient for now
        if (!PDF417ScanningDecoder.checkCodewordSkew(codewordBitCount, minCodewordWidth, maxCodewordWidth)) {
            // We could try to use the startX and endX position of the codeword in the same column in the previous row,
            // create the bit count from it and normalize it to 8. This would help with single pixel errors.
            return null;
        }
        var decodedValue = PDF417CodewordDecoder.getDecodedValue(moduleBitCount);
        var codeword = PDF417Common.getCodeword(decodedValue);
        if (codeword === -1) {
            return null;
        }
        return new Codeword(startColumn, endColumn, PDF417ScanningDecoder.getCodewordBucketNumber(decodedValue), codeword);
    };
    PDF417ScanningDecoder.getModuleBitCount = function (image, minColumn, maxColumn, leftToRight, startColumn, imageRow) {
        var imageColumn = startColumn;
        var moduleBitCount = new Int32Array(8);
        var moduleNumber = 0;
        var increment = leftToRight ? 1 : -1;
        var previousPixelValue = leftToRight;
        while ((leftToRight ? imageColumn < maxColumn : imageColumn >= minColumn) &&
            moduleNumber < moduleBitCount.length) {
            if (image.get(imageColumn, imageRow) === previousPixelValue) {
                moduleBitCount[moduleNumber]++;
                imageColumn += increment;
            }
            else {
                moduleNumber++;
                previousPixelValue = !previousPixelValue;
            }
        }
        if (moduleNumber === moduleBitCount.length ||
            ((imageColumn === (leftToRight ? maxColumn : minColumn)) &&
                moduleNumber === moduleBitCount.length - 1)) {
            return moduleBitCount;
        }
        return null;
    };
    PDF417ScanningDecoder.getNumberOfECCodeWords = function (barcodeECLevel) {
        return 2 << barcodeECLevel;
    };
    PDF417ScanningDecoder.adjustCodewordStartColumn = function (image, minColumn, maxColumn, leftToRight, codewordStartColumn, imageRow) {
        var correctedStartColumn = codewordStartColumn;
        var increment = leftToRight ? -1 : 1;
        // there should be no black pixels before the start column. If there are, then we need to start earlier.
        for (var i /*int*/ = 0; i < 2; i++) {
            while ((leftToRight ? correctedStartColumn >= minColumn : correctedStartColumn < maxColumn) &&
                leftToRight === image.get(correctedStartColumn, imageRow)) {
                if (Math.abs(codewordStartColumn - correctedStartColumn) > PDF417ScanningDecoder.CODEWORD_SKEW_SIZE) {
                    return codewordStartColumn;
                }
                correctedStartColumn += increment;
            }
            increment = -increment;
            leftToRight = !leftToRight;
        }
        return correctedStartColumn;
    };
    PDF417ScanningDecoder.checkCodewordSkew = function (codewordSize, minCodewordWidth, maxCodewordWidth) {
        return minCodewordWidth - PDF417ScanningDecoder.CODEWORD_SKEW_SIZE <= codewordSize &&
            codewordSize <= maxCodewordWidth + PDF417ScanningDecoder.CODEWORD_SKEW_SIZE;
    };
    /**
     * @throws FormatException,
     * @throws ChecksumException
     */
    PDF417ScanningDecoder.decodeCodewords = function (codewords, ecLevel, erasures) {
        if (codewords.length === 0) {
            throw FormatException.getFormatInstance();
        }
        var numECCodewords = 1 << (ecLevel + 1);
        var correctedErrorsCount = PDF417ScanningDecoder.correctErrors(codewords, erasures, numECCodewords);
        PDF417ScanningDecoder.verifyCodewordCount(codewords, numECCodewords);
        // Decode the codewords
        var decoderResult = DecodedBitStreamParser.decode(codewords, '' + ecLevel);
        decoderResult.setErrorsCorrected(correctedErrorsCount);
        decoderResult.setErasures(erasures.length);
        return decoderResult;
    };
    /**
     * <p>Given data and error-correction codewords received, possibly corrupted by errors, attempts to
     * correct the errors in-place.</p>
     *
     * @param codewords   data and error correction codewords
     * @param erasures positions of any known erasures
     * @param numECCodewords number of error correction codewords that are available in codewords
     * @throws ChecksumException if error correction fails
     */
    PDF417ScanningDecoder.correctErrors = function (codewords, erasures, numECCodewords) {
        if (erasures != null &&
            erasures.length > numECCodewords / 2 + PDF417ScanningDecoder.MAX_ERRORS ||
            numECCodewords < 0 ||
            numECCodewords > PDF417ScanningDecoder.MAX_EC_CODEWORDS) {
            // Too many errors or EC Codewords is corrupted
            throw ChecksumException.getChecksumInstance();
        }
        return PDF417ScanningDecoder.errorCorrection.decode(codewords, numECCodewords, erasures);
    };
    /**
     * Verify that all is OK with the codeword array.
     * @throws FormatException
     */
    PDF417ScanningDecoder.verifyCodewordCount = function (codewords, numECCodewords) {
        if (codewords.length < 4) {
            // Codeword array size should be at least 4 allowing for
            // Count CW, At least one Data CW, Error Correction CW, Error Correction CW
            throw FormatException.getFormatInstance();
        }
        // The first codeword, the Symbol Length Descriptor, shall always encode the total number of data
        // codewords in the symbol, including the Symbol Length Descriptor itself, data codewords and pad
        // codewords, but excluding the number of error correction codewords.
        var numberOfCodewords = codewords[0];
        if (numberOfCodewords > codewords.length) {
            throw FormatException.getFormatInstance();
        }
        if (numberOfCodewords === 0) {
            // Reset to the length of the array - 8 (Allow for at least level 3 Error Correction (8 Error Codewords)
            if (numECCodewords < codewords.length) {
                codewords[0] = codewords.length - numECCodewords;
            }
            else {
                throw FormatException.getFormatInstance();
            }
        }
    };
    PDF417ScanningDecoder.getBitCountForCodeword = function (codeword) {
        var result = new Int32Array(8);
        var previousValue = 0;
        var i = result.length - 1;
        while (true) {
            if ((codeword & 0x1) !== previousValue) {
                previousValue = codeword & 0x1;
                i--;
                if (i < 0) {
                    break;
                }
            }
            result[i]++;
            codeword >>= 1;
        }
        return result;
    };
    PDF417ScanningDecoder.getCodewordBucketNumber = function (codeword) {
        if (codeword instanceof Int32Array) {
            return this.getCodewordBucketNumber_Int32Array(codeword);
        }
        return this.getCodewordBucketNumber_number(codeword);
    };
    PDF417ScanningDecoder.getCodewordBucketNumber_number = function (codeword) {
        return PDF417ScanningDecoder.getCodewordBucketNumber(PDF417ScanningDecoder.getBitCountForCodeword(codeword));
    };
    PDF417ScanningDecoder.getCodewordBucketNumber_Int32Array = function (moduleBitCount) {
        return (moduleBitCount[0] - moduleBitCount[2] + moduleBitCount[4] - moduleBitCount[6] + 9) % 9;
    };
    PDF417ScanningDecoder.toString = function (barcodeMatrix) {
        var formatter = new Formatter();
        // try (let formatter = new Formatter()) {
        for (var row /*int*/ = 0; row < barcodeMatrix.length; row++) {
            formatter.format('Row %2d: ', row);
            for (var column /*int*/ = 0; column < barcodeMatrix[row].length; column++) {
                var barcodeValue = barcodeMatrix[row][column];
                if (barcodeValue.getValue().length === 0) {
                    formatter.format('        ', null);
                }
                else {
                    formatter.format('%4d(%2d)', barcodeValue.getValue()[0], barcodeValue.getConfidence(barcodeValue.getValue()[0]));
                }
            }
            formatter.format('%n');
        }
        return formatter.toString();
        // }
    };
    /*final*/ PDF417ScanningDecoder.CODEWORD_SKEW_SIZE = 2;
    /*final*/ PDF417ScanningDecoder.MAX_ERRORS = 3;
    /*final*/ PDF417ScanningDecoder.MAX_EC_CODEWORDS = 512;
    /*final*/ PDF417ScanningDecoder.errorCorrection = new ErrorCorrection();
    return PDF417ScanningDecoder;
}());
export default PDF417ScanningDecoder;
