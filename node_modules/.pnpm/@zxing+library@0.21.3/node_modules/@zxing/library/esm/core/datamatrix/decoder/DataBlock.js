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
/**
 * <p>Encapsulates a block of data within a Data Matrix Code. Data Matrix Codes may split their data into
 * multiple blocks, each of which is a unit of data and error-correction codewords. Each
 * is represented by an instance of this class.</p>
 *
 * @author bbrown@google.com (Brian Brown)
 */
var DataBlock = /** @class */ (function () {
    function DataBlock(numDataCodewords, codewords) {
        this.numDataCodewords = numDataCodewords;
        this.codewords = codewords;
    }
    /**
     * <p>When Data Matrix Codes use multiple data blocks, they actually interleave the bytes of each of them.
     * That is, the first byte of data block 1 to n is written, then the second bytes, and so on. This
     * method will separate the data into original blocks.</p>
     *
     * @param rawCodewords bytes as read directly from the Data Matrix Code
     * @param version version of the Data Matrix Code
     * @return DataBlocks containing original bytes, "de-interleaved" from representation in the
     *         Data Matrix Code
     */
    DataBlock.getDataBlocks = function (rawCodewords, version) {
        var e_1, _a, e_2, _b;
        // Figure out the number and size of data blocks used by this version
        var ecBlocks = version.getECBlocks();
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
                    var numBlockCodewords = ecBlocks.getECCodewords() + numDataCodewords;
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
        // (where n may be 0) have 1 less byte. Figure out where these start.
        // TODO(bbrown): There is only one case where there is a difference for Data Matrix for size 144
        var longerBlocksTotalCodewords = result[0].codewords.length;
        // int shorterBlocksTotalCodewords = longerBlocksTotalCodewords - 1;
        var longerBlocksNumDataCodewords = longerBlocksTotalCodewords - ecBlocks.getECCodewords();
        var shorterBlocksNumDataCodewords = longerBlocksNumDataCodewords - 1;
        // The last elements of result may be 1 element shorter for 144 matrix
        // first fill out as many elements as all of them have minus 1
        var rawCodewordsOffset = 0;
        for (var i = 0; i < shorterBlocksNumDataCodewords; i++) {
            for (var j = 0; j < numResultBlocks; j++) {
                result[j].codewords[i] = rawCodewords[rawCodewordsOffset++];
            }
        }
        // Fill out the last data block in the longer ones
        var specialVersion = version.getVersionNumber() === 24;
        var numLongerBlocks = specialVersion ? 8 : numResultBlocks;
        for (var j = 0; j < numLongerBlocks; j++) {
            result[j].codewords[longerBlocksNumDataCodewords - 1] = rawCodewords[rawCodewordsOffset++];
        }
        // Now add in error correction blocks
        var max = result[0].codewords.length;
        for (var i = longerBlocksNumDataCodewords; i < max; i++) {
            for (var j = 0; j < numResultBlocks; j++) {
                var jOffset = specialVersion ? (j + 8) % numResultBlocks : j;
                var iOffset = specialVersion && jOffset > 7 ? i - 1 : i;
                result[jOffset].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
            }
        }
        if (rawCodewordsOffset !== rawCodewords.length) {
            throw new IllegalArgumentException();
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
