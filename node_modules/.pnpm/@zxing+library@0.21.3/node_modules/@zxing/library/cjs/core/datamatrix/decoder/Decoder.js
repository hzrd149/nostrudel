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
var ChecksumException_1 = require("../../ChecksumException");
var GenericGF_1 = require("../../common/reedsolomon/GenericGF");
var ReedSolomonDecoder_1 = require("../../common/reedsolomon/ReedSolomonDecoder");
var BitMatrixParser_1 = require("./BitMatrixParser");
var DataBlock_1 = require("./DataBlock");
var DecodedBitStreamParser_1 = require("./DecodedBitStreamParser");
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
/**
 * <p>The main class which implements Data Matrix Code decoding -- as opposed to locating and extracting
 * the Data Matrix Code from an image.</p>
 *
 * @author bbrown@google.com (Brian Brown)
 */
var Decoder = /** @class */ (function () {
    function Decoder() {
        this.rsDecoder = new ReedSolomonDecoder_1.default(GenericGF_1.default.DATA_MATRIX_FIELD_256);
    }
    /**
     * <p>Decodes a Data Matrix Code represented as a {@link BitMatrix}. A 1 or "true" is taken
     * to mean a black module.</p>
     *
     * @param bits booleans representing white/black Data Matrix Code modules
     * @return text and bytes encoded within the Data Matrix Code
     * @throws FormatException if the Data Matrix Code cannot be decoded
     * @throws ChecksumException if error correction fails
     */
    Decoder.prototype.decode = function (bits) {
        var e_1, _a;
        // Construct a parser and read version, error-correction level
        var parser = new BitMatrixParser_1.default(bits);
        var version = parser.getVersion();
        // Read codewords
        var codewords = parser.readCodewords();
        // Separate into data blocks
        var dataBlocks = DataBlock_1.default.getDataBlocks(codewords, version);
        // Count total number of data bytes
        var totalBytes = 0;
        try {
            for (var dataBlocks_1 = __values(dataBlocks), dataBlocks_1_1 = dataBlocks_1.next(); !dataBlocks_1_1.done; dataBlocks_1_1 = dataBlocks_1.next()) {
                var db = dataBlocks_1_1.value;
                totalBytes += db.getNumDataCodewords();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (dataBlocks_1_1 && !dataBlocks_1_1.done && (_a = dataBlocks_1.return)) _a.call(dataBlocks_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var resultBytes = new Uint8Array(totalBytes);
        var dataBlocksCount = dataBlocks.length;
        // Error-correct and copy data blocks together into a stream of bytes
        for (var j = 0; j < dataBlocksCount; j++) {
            var dataBlock = dataBlocks[j];
            var codewordBytes = dataBlock.getCodewords();
            var numDataCodewords = dataBlock.getNumDataCodewords();
            this.correctErrors(codewordBytes, numDataCodewords);
            for (var i = 0; i < numDataCodewords; i++) {
                // De-interlace data blocks.
                resultBytes[i * dataBlocksCount + j] = codewordBytes[i];
            }
        }
        // Decode the contents of that stream of bytes
        return DecodedBitStreamParser_1.default.decode(resultBytes);
    };
    /**
     * <p>Given data and error-correction codewords received, possibly corrupted by errors, attempts to
     * correct the errors in-place using Reed-Solomon error correction.</p>
     *
     * @param codewordBytes data and error correction codewords
     * @param numDataCodewords number of codewords that are data bytes
     * @throws ChecksumException if error correction fails
     */
    Decoder.prototype.correctErrors = function (codewordBytes, numDataCodewords) {
        // const numCodewords = codewordBytes.length;
        // First read into an array of ints
        var codewordsInts = new Int32Array(codewordBytes);
        // for (let i = 0; i < numCodewords; i++) {
        //   codewordsInts[i] = codewordBytes[i] & 0xFF;
        // }
        try {
            this.rsDecoder.decode(codewordsInts, codewordBytes.length - numDataCodewords);
        }
        catch (ignored /* ReedSolomonException */) {
            throw new ChecksumException_1.default();
        }
        // Copy back into array of bytes -- only need to worry about the bytes that were data
        // We don't care about errors in the error-correction codewords
        for (var i = 0; i < numDataCodewords; i++) {
            codewordBytes[i] = codewordsInts[i];
        }
    };
    return Decoder;
}());
exports.default = Decoder;
