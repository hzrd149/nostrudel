"use strict";
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
var BitArray_1 = require("../../common/BitArray");
var IllegalArgumentException_1 = require("../../IllegalArgumentException");
var StringUtils_1 = require("../../common/StringUtils");
var BitMatrix_1 = require("../../common/BitMatrix");
var AztecCode_1 = require("./AztecCode");
var ReedSolomonEncoder_1 = require("../../common/reedsolomon/ReedSolomonEncoder");
var GenericGF_1 = require("../../common/reedsolomon/GenericGF");
var HighLevelEncoder_1 = require("./HighLevelEncoder");
var Integer_1 = require("../../util/Integer");
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
// package com.google.zxing.aztec.encoder;
// import com.google.zxing.common.BitArray;
// import com.google.zxing.common.BitMatrix;
// import com.google.zxing.common.reedsolomon.GenericGF;
// import com.google.zxing.common.reedsolomon.ReedSolomonEncoder;
/**
 * Generates Aztec 2D barcodes.
 *
 * @author Rustam Abdullaev
 */
var Encoder = /** @class */ (function () {
    function Encoder() {
    }
    /**
     * Encodes the given binary content as an Aztec symbol
     *
     * @param data input data string
     * @return Aztec symbol matrix with metadata
     */
    Encoder.encodeBytes = function (data) {
        return Encoder.encode(data, Encoder.DEFAULT_EC_PERCENT, Encoder.DEFAULT_AZTEC_LAYERS);
    };
    /**
     * Encodes the given binary content as an Aztec symbol
     *
     * @param data input data string
     * @param minECCPercent minimal percentage of error check words (According to ISO/IEC 24778:2008,
     *                      a minimum of 23% + 3 words is recommended)
     * @param userSpecifiedLayers if non-zero, a user-specified value for the number of layers
     * @return Aztec symbol matrix with metadata
     */
    Encoder.encode = function (data, minECCPercent, userSpecifiedLayers) {
        // High-level encode
        var bits = new HighLevelEncoder_1.default(data).encode();
        // stuff bits and choose symbol size
        var eccBits = Integer_1.default.truncDivision((bits.getSize() * minECCPercent), 100) + 11;
        var totalSizeBits = bits.getSize() + eccBits;
        var compact;
        var layers;
        var totalBitsInLayer;
        var wordSize;
        var stuffedBits;
        if (userSpecifiedLayers !== Encoder.DEFAULT_AZTEC_LAYERS) {
            compact = userSpecifiedLayers < 0;
            layers = Math.abs(userSpecifiedLayers);
            if (layers > (compact ? Encoder.MAX_NB_BITS_COMPACT : Encoder.MAX_NB_BITS)) {
                throw new IllegalArgumentException_1.default(StringUtils_1.default.format('Illegal value %s for layers', userSpecifiedLayers));
            }
            totalBitsInLayer = Encoder.totalBitsInLayer(layers, compact);
            wordSize = Encoder.WORD_SIZE[layers];
            var usableBitsInLayers = totalBitsInLayer - (totalBitsInLayer % wordSize);
            stuffedBits = Encoder.stuffBits(bits, wordSize);
            if (stuffedBits.getSize() + eccBits > usableBitsInLayers) {
                throw new IllegalArgumentException_1.default('Data to large for user specified layer');
            }
            if (compact && stuffedBits.getSize() > wordSize * 64) {
                // Compact format only allows 64 data words, though C4 can hold more words than that
                throw new IllegalArgumentException_1.default('Data to large for user specified layer');
            }
        }
        else {
            wordSize = 0;
            stuffedBits = null;
            // We look at the possible table sizes in the order Compact1, Compact2, Compact3,
            // Compact4, Normal4,...  Normal(i) for i < 4 isn't typically used since Compact(i+1)
            // is the same size, but has more data.
            for (var i /*int*/ = 0;; i++) {
                if (i > Encoder.MAX_NB_BITS) {
                    throw new IllegalArgumentException_1.default('Data too large for an Aztec code');
                }
                compact = i <= 3;
                layers = compact ? i + 1 : i;
                totalBitsInLayer = Encoder.totalBitsInLayer(layers, compact);
                if (totalSizeBits > totalBitsInLayer) {
                    continue;
                }
                // [Re]stuff the bits if this is the first opportunity, or if the
                // wordSize has changed
                if (stuffedBits == null || wordSize !== Encoder.WORD_SIZE[layers]) {
                    wordSize = Encoder.WORD_SIZE[layers];
                    stuffedBits = Encoder.stuffBits(bits, wordSize);
                }
                var usableBitsInLayers = totalBitsInLayer - (totalBitsInLayer % wordSize);
                if (compact && stuffedBits.getSize() > wordSize * 64) {
                    // Compact format only allows 64 data words, though C4 can hold more words than that
                    continue;
                }
                if (stuffedBits.getSize() + eccBits <= usableBitsInLayers) {
                    break;
                }
            }
        }
        var messageBits = Encoder.generateCheckWords(stuffedBits, totalBitsInLayer, wordSize);
        // generate mode message
        var messageSizeInWords = stuffedBits.getSize() / wordSize;
        var modeMessage = Encoder.generateModeMessage(compact, layers, messageSizeInWords);
        // allocate symbol
        var baseMatrixSize = (compact ? 11 : 14) + layers * 4; // not including alignment lines
        var alignmentMap = new Int32Array(baseMatrixSize);
        var matrixSize;
        if (compact) {
            // no alignment marks in compact mode, alignmentMap is a no-op
            matrixSize = baseMatrixSize;
            for (var i /*int*/ = 0; i < alignmentMap.length; i++) {
                alignmentMap[i] = i;
            }
        }
        else {
            matrixSize = baseMatrixSize + 1 + 2 * Integer_1.default.truncDivision((Integer_1.default.truncDivision(baseMatrixSize, 2) - 1), 15);
            var origCenter = Integer_1.default.truncDivision(baseMatrixSize, 2);
            var center = Integer_1.default.truncDivision(matrixSize, 2);
            for (var i /*int*/ = 0; i < origCenter; i++) {
                var newOffset = i + Integer_1.default.truncDivision(i, 15);
                alignmentMap[origCenter - i - 1] = center - newOffset - 1;
                alignmentMap[origCenter + i] = center + newOffset + 1;
            }
        }
        var matrix = new BitMatrix_1.default(matrixSize);
        // draw data bits
        for (var i /*int*/ = 0, rowOffset = 0; i < layers; i++) {
            var rowSize = (layers - i) * 4 + (compact ? 9 : 12);
            for (var j /*int*/ = 0; j < rowSize; j++) {
                var columnOffset = j * 2;
                for (var k /*int*/ = 0; k < 2; k++) {
                    if (messageBits.get(rowOffset + columnOffset + k)) {
                        matrix.set(alignmentMap[i * 2 + k], alignmentMap[i * 2 + j]);
                    }
                    if (messageBits.get(rowOffset + rowSize * 2 + columnOffset + k)) {
                        matrix.set(alignmentMap[i * 2 + j], alignmentMap[baseMatrixSize - 1 - i * 2 - k]);
                    }
                    if (messageBits.get(rowOffset + rowSize * 4 + columnOffset + k)) {
                        matrix.set(alignmentMap[baseMatrixSize - 1 - i * 2 - k], alignmentMap[baseMatrixSize - 1 - i * 2 - j]);
                    }
                    if (messageBits.get(rowOffset + rowSize * 6 + columnOffset + k)) {
                        matrix.set(alignmentMap[baseMatrixSize - 1 - i * 2 - j], alignmentMap[i * 2 + k]);
                    }
                }
            }
            rowOffset += rowSize * 8;
        }
        // draw mode message
        Encoder.drawModeMessage(matrix, compact, matrixSize, modeMessage);
        // draw alignment marks
        if (compact) {
            Encoder.drawBullsEye(matrix, Integer_1.default.truncDivision(matrixSize, 2), 5);
        }
        else {
            Encoder.drawBullsEye(matrix, Integer_1.default.truncDivision(matrixSize, 2), 7);
            for (var i /*int*/ = 0, j = 0; i < Integer_1.default.truncDivision(baseMatrixSize, 2) - 1; i += 15, j += 16) {
                for (var k /*int*/ = Integer_1.default.truncDivision(matrixSize, 2) & 1; k < matrixSize; k += 2) {
                    matrix.set(Integer_1.default.truncDivision(matrixSize, 2) - j, k);
                    matrix.set(Integer_1.default.truncDivision(matrixSize, 2) + j, k);
                    matrix.set(k, Integer_1.default.truncDivision(matrixSize, 2) - j);
                    matrix.set(k, Integer_1.default.truncDivision(matrixSize, 2) + j);
                }
            }
        }
        var aztec = new AztecCode_1.default();
        aztec.setCompact(compact);
        aztec.setSize(matrixSize);
        aztec.setLayers(layers);
        aztec.setCodeWords(messageSizeInWords);
        aztec.setMatrix(matrix);
        return aztec;
    };
    Encoder.drawBullsEye = function (matrix, center, size) {
        for (var i /*int*/ = 0; i < size; i += 2) {
            for (var j /*int*/ = center - i; j <= center + i; j++) {
                matrix.set(j, center - i);
                matrix.set(j, center + i);
                matrix.set(center - i, j);
                matrix.set(center + i, j);
            }
        }
        matrix.set(center - size, center - size);
        matrix.set(center - size + 1, center - size);
        matrix.set(center - size, center - size + 1);
        matrix.set(center + size, center - size);
        matrix.set(center + size, center - size + 1);
        matrix.set(center + size, center + size - 1);
    };
    Encoder.generateModeMessage = function (compact, layers, messageSizeInWords) {
        var modeMessage = new BitArray_1.default();
        if (compact) {
            modeMessage.appendBits(layers - 1, 2);
            modeMessage.appendBits(messageSizeInWords - 1, 6);
            modeMessage = Encoder.generateCheckWords(modeMessage, 28, 4);
        }
        else {
            modeMessage.appendBits(layers - 1, 5);
            modeMessage.appendBits(messageSizeInWords - 1, 11);
            modeMessage = Encoder.generateCheckWords(modeMessage, 40, 4);
        }
        return modeMessage;
    };
    Encoder.drawModeMessage = function (matrix, compact, matrixSize, modeMessage) {
        var center = Integer_1.default.truncDivision(matrixSize, 2);
        if (compact) {
            for (var i /*int*/ = 0; i < 7; i++) {
                var offset = center - 3 + i;
                if (modeMessage.get(i)) {
                    matrix.set(offset, center - 5);
                }
                if (modeMessage.get(i + 7)) {
                    matrix.set(center + 5, offset);
                }
                if (modeMessage.get(20 - i)) {
                    matrix.set(offset, center + 5);
                }
                if (modeMessage.get(27 - i)) {
                    matrix.set(center - 5, offset);
                }
            }
        }
        else {
            for (var i /*int*/ = 0; i < 10; i++) {
                var offset = center - 5 + i + Integer_1.default.truncDivision(i, 5);
                if (modeMessage.get(i)) {
                    matrix.set(offset, center - 7);
                }
                if (modeMessage.get(i + 10)) {
                    matrix.set(center + 7, offset);
                }
                if (modeMessage.get(29 - i)) {
                    matrix.set(offset, center + 7);
                }
                if (modeMessage.get(39 - i)) {
                    matrix.set(center - 7, offset);
                }
            }
        }
    };
    Encoder.generateCheckWords = function (bitArray, totalBits, wordSize) {
        var e_1, _a;
        // bitArray is guaranteed to be a multiple of the wordSize, so no padding needed
        var messageSizeInWords = bitArray.getSize() / wordSize;
        var rs = new ReedSolomonEncoder_1.default(Encoder.getGF(wordSize));
        var totalWords = Integer_1.default.truncDivision(totalBits, wordSize);
        var messageWords = Encoder.bitsToWords(bitArray, wordSize, totalWords);
        rs.encode(messageWords, totalWords - messageSizeInWords);
        var startPad = totalBits % wordSize;
        var messageBits = new BitArray_1.default();
        messageBits.appendBits(0, startPad);
        try {
            for (var _b = __values(Array.from(messageWords)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var messageWord = _c.value /*: int*/;
                messageBits.appendBits(messageWord, wordSize);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return messageBits;
    };
    Encoder.bitsToWords = function (stuffedBits, wordSize, totalWords) {
        var message = new Int32Array(totalWords);
        var i;
        var n;
        for (i = 0, n = stuffedBits.getSize() / wordSize; i < n; i++) {
            var value = 0;
            for (var j /*int*/ = 0; j < wordSize; j++) {
                value |= stuffedBits.get(i * wordSize + j) ? (1 << wordSize - j - 1) : 0;
            }
            message[i] = value;
        }
        return message;
    };
    Encoder.getGF = function (wordSize) {
        switch (wordSize) {
            case 4:
                return GenericGF_1.default.AZTEC_PARAM;
            case 6:
                return GenericGF_1.default.AZTEC_DATA_6;
            case 8:
                return GenericGF_1.default.AZTEC_DATA_8;
            case 10:
                return GenericGF_1.default.AZTEC_DATA_10;
            case 12:
                return GenericGF_1.default.AZTEC_DATA_12;
            default:
                throw new IllegalArgumentException_1.default('Unsupported word size ' + wordSize);
        }
    };
    Encoder.stuffBits = function (bits, wordSize) {
        var out = new BitArray_1.default();
        var n = bits.getSize();
        var mask = (1 << wordSize) - 2;
        for (var i /*int*/ = 0; i < n; i += wordSize) {
            var word = 0;
            for (var j /*int*/ = 0; j < wordSize; j++) {
                if (i + j >= n || bits.get(i + j)) {
                    word |= 1 << (wordSize - 1 - j);
                }
            }
            if ((word & mask) === mask) {
                out.appendBits(word & mask, wordSize);
                i--;
            }
            else if ((word & mask) === 0) {
                out.appendBits(word | 1, wordSize);
                i--;
            }
            else {
                out.appendBits(word, wordSize);
            }
        }
        return out;
    };
    Encoder.totalBitsInLayer = function (layers, compact) {
        return ((compact ? 88 : 112) + 16 * layers) * layers;
    };
    Encoder.DEFAULT_EC_PERCENT = 33; // default minimal percentage of error check words
    Encoder.DEFAULT_AZTEC_LAYERS = 0;
    Encoder.MAX_NB_BITS = 32;
    Encoder.MAX_NB_BITS_COMPACT = 4;
    Encoder.WORD_SIZE = Int32Array.from([
        4, 6, 6, 8, 8, 8, 8, 8, 8, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
        12, 12, 12, 12, 12, 12, 12, 12, 12, 12
    ]);
    return Encoder;
}());
exports.default = Encoder;
