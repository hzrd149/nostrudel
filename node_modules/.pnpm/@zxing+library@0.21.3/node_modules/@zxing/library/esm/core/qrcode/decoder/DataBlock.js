/*
 * Copyright 2007 ZXing authors
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
import IllegalArgumentException from '../../IllegalArgumentException';
/**
 * <p>Encapsulates a block of data within a QR Code. QR Codes may split their data into
 * multiple blocks, each of which is a unit of data and error-correction codewords. Each
 * is represented by an instance of this class.</p>
 *
 * @author Sean Owen
 */
var DataBlock = /** @class */ (function () {
    function DataBlock(numDataCodewords /*int*/, codewords) {
        this.numDataCodewords = numDataCodewords;
        this.codewords = codewords;
    }
    /**
     * <p>When QR Codes use multiple data blocks, they are actually interleaved.
     * That is, the first byte of data block 1 to n is written, then the second bytes, and so on. This
     * method will separate the data into original blocks.</p>
     *
     * @param rawCodewords bytes as read directly from the QR Code
     * @param version version of the QR Code
     * @param ecLevel error-correction level of the QR Code
     * @return DataBlocks containing original bytes, "de-interleaved" from representation in the
     *         QR Code
     */
    DataBlock.getDataBlocks = function (rawCodewords, version, ecLevel) {
        var e_1, _a, e_2, _b;
        if (rawCodewords.length !== version.getTotalCodewords()) {
            throw new IllegalArgumentException();
        }
        // Figure out the number and size of data blocks used by this version and
        // error correction level
        var ecBlocks = version.getECBlocksForLevel(ecLevel);
        // First count the total number of data blocks
        var totalBlocks = 0;
        var ecBlockArray = ecBlocks.getECBlocks();
        try {
            for (var ecBlockArray_1 = __values(ecBlockArray), ecBlockArray_1_1 = ecBlockArray_1.next(); !ecBlockArray_1_1.done; ecBlockArray_1_1 = ecBlockArray_1.next()) {
                var ecBlock = ecBlockArray_1_1.value;
                totalBlocks += ecBlock.getCount();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (ecBlockArray_1_1 && !ecBlockArray_1_1.done && (_a = ecBlockArray_1.return)) _a.call(ecBlockArray_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // Now establish DataBlocks of the appropriate size and number of data codewords
        var result = new Array(totalBlocks);
        var numResultBlocks = 0;
        try {
            for (var ecBlockArray_2 = __values(ecBlockArray), ecBlockArray_2_1 = ecBlockArray_2.next(); !ecBlockArray_2_1.done; ecBlockArray_2_1 = ecBlockArray_2.next()) {
                var ecBlock = ecBlockArray_2_1.value;
                for (var i = 0; i < ecBlock.getCount(); i++) {
                    var numDataCodewords = ecBlock.getDataCodewords();
                    var numBlockCodewords = ecBlocks.getECCodewordsPerBlock() + numDataCodewords;
                    result[numResultBlocks++] = new DataBlock(numDataCodewords, new Uint8Array(numBlockCodewords));
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (ecBlockArray_2_1 && !ecBlockArray_2_1.done && (_b = ecBlockArray_2.return)) _b.call(ecBlockArray_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // All blocks have the same amount of data, except that the last n
        // (where n may be 0) have 1 more byte. Figure out where these start.
        var shorterBlocksTotalCodewords = result[0].codewords.length;
        var longerBlocksStartAt = result.length - 1;
        // TYPESCRIPTPORT: check length is correct here
        while (longerBlocksStartAt >= 0) {
            var numCodewords = result[longerBlocksStartAt].codewords.length;
            if (numCodewords === shorterBlocksTotalCodewords) {
                break;
            }
            longerBlocksStartAt--;
        }
        longerBlocksStartAt++;
        var shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords - ecBlocks.getECCodewordsPerBlock();
        // The last elements of result may be 1 element longer
        // first fill out as many elements as all of them have
        var rawCodewordsOffset = 0;
        for (var i = 0; i < shorterBlocksNumDataCodewords; i++) {
            for (var j = 0; j < numResultBlocks; j++) {
                result[j].codewords[i] = rawCodewords[rawCodewordsOffset++];
            }
        }
        // Fill out the last data block in the longer ones
        for (var j = longerBlocksStartAt; j < numResultBlocks; j++) {
            result[j].codewords[shorterBlocksNumDataCodewords] = rawCodewords[rawCodewordsOffset++];
        }
        // Now add in error correction blocks
        var max = result[0].codewords.length;
        for (var i = shorterBlocksNumDataCodewords; i < max; i++) {
            for (var j = 0; j < numResultBlocks; j++) {
                var iOffset = j < longerBlocksStartAt ? i : i + 1;
                result[j].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
            }
        }
        return result;
    };
    DataBlock.prototype.getNumDataCodewords = function () {
        return this.numDataCodewords;
    };
    DataBlock.prototype.getCodewords = function () {
        return this.codewords;
    };
    return DataBlock;
}());
export default DataBlock;
