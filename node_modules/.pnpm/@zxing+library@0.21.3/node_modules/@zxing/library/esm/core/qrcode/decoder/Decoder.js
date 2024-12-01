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
/*namespace com.google.zxing.qrcode.decoder {*/
import ChecksumException from '../../ChecksumException';
import BitMatrix from '../../common/BitMatrix';
import GenericGF from '../../common/reedsolomon/GenericGF';
import ReedSolomonDecoder from '../../common/reedsolomon/ReedSolomonDecoder';
import BitMatrixParser from './BitMatrixParser';
import DataBlock from './DataBlock';
import DecodedBitStreamParser from './DecodedBitStreamParser';
import QRCodeDecoderMetaData from './QRCodeDecoderMetaData';
/*import java.util.Map;*/
/**
 * <p>The main class which implements QR Code decoding -- as opposed to locating and extracting
 * the QR Code from an image.</p>
 *
 * @author Sean Owen
 */
var Decoder = /** @class */ (function () {
    function Decoder() {
        this.rsDecoder = new ReedSolomonDecoder(GenericGF.QR_CODE_FIELD_256);
    }
    // public decode(image: boolean[][]): DecoderResult /*throws ChecksumException, FormatException*/ {
    //   return decode(image, null)
    // }
    /**
     * <p>Convenience method that can decode a QR Code represented as a 2D array of booleans.
     * "true" is taken to mean a black module.</p>
     *
     * @param image booleans representing white/black QR Code modules
     * @param hints decoding hints that should be used to influence decoding
     * @return text and bytes encoded within the QR Code
     * @throws FormatException if the QR Code cannot be decoded
     * @throws ChecksumException if error correction fails
     */
    Decoder.prototype.decodeBooleanArray = function (image, hints) {
        return this.decodeBitMatrix(BitMatrix.parseFromBooleanArray(image), hints);
    };
    // public decodeBitMatrix(bits: BitMatrix): DecoderResult /*throws ChecksumException, FormatException*/ {
    //   return decode(bits, null)
    // }
    /**
     * <p>Decodes a QR Code represented as a {@link BitMatrix}. A 1 or "true" is taken to mean a black module.</p>
     *
     * @param bits booleans representing white/black QR Code modules
     * @param hints decoding hints that should be used to influence decoding
     * @return text and bytes encoded within the QR Code
     * @throws FormatException if the QR Code cannot be decoded
     * @throws ChecksumException if error correction fails
     */
    Decoder.prototype.decodeBitMatrix = function (bits, hints) {
        // Construct a parser and read version, error-correction level
        var parser = new BitMatrixParser(bits);
        var ex = null;
        try {
            return this.decodeBitMatrixParser(parser, hints);
        }
        catch (e /*: FormatException, ChecksumException*/) {
            ex = e;
        }
        try {
            // Revert the bit matrix
            parser.remask();
            // Will be attempting a mirrored reading of the version and format info.
            parser.setMirror(true);
            // Preemptively read the version.
            parser.readVersion();
            // Preemptively read the format information.
            parser.readFormatInformation();
            /*
             * Since we're here, this means we have successfully detected some kind
             * of version and format information when mirrored. This is a good sign,
             * that the QR code may be mirrored, and we should try once more with a
             * mirrored content.
             */
            // Prepare for a mirrored reading.
            parser.mirror();
            var result = this.decodeBitMatrixParser(parser, hints);
            // Success! Notify the caller that the code was mirrored.
            result.setOther(new QRCodeDecoderMetaData(true));
            return result;
        }
        catch (e /*FormatException | ChecksumException*/) {
            // Throw the exception from the original reading
            if (ex !== null) {
                throw ex;
            }
            throw e;
        }
    };
    Decoder.prototype.decodeBitMatrixParser = function (parser, hints) {
        var e_1, _a, e_2, _b;
        var version = parser.readVersion();
        var ecLevel = parser.readFormatInformation().getErrorCorrectionLevel();
        // Read codewords
        var codewords = parser.readCodewords();
        // Separate into data blocks
        var dataBlocks = DataBlock.getDataBlocks(codewords, version, ecLevel);
        // Count total number of data bytes
        var totalBytes = 0;
        try {
            for (var dataBlocks_1 = __values(dataBlocks), dataBlocks_1_1 = dataBlocks_1.next(); !dataBlocks_1_1.done; dataBlocks_1_1 = dataBlocks_1.next()) {
                var dataBlock = dataBlocks_1_1.value;
                totalBytes += dataBlock.getNumDataCodewords();
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
        var resultOffset = 0;
        try {
            // Error-correct and copy data blocks together into a stream of bytes
            for (var dataBlocks_2 = __values(dataBlocks), dataBlocks_2_1 = dataBlocks_2.next(); !dataBlocks_2_1.done; dataBlocks_2_1 = dataBlocks_2.next()) {
                var dataBlock = dataBlocks_2_1.value;
                var codewordBytes = dataBlock.getCodewords();
                var numDataCodewords = dataBlock.getNumDataCodewords();
                this.correctErrors(codewordBytes, numDataCodewords);
                for (var i = 0; i < numDataCodewords; i++) {
                    resultBytes[resultOffset++] = codewordBytes[i];
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (dataBlocks_2_1 && !dataBlocks_2_1.done && (_b = dataBlocks_2.return)) _b.call(dataBlocks_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // Decode the contents of that stream of bytes
        return DecodedBitStreamParser.decode(resultBytes, version, ecLevel, hints);
    };
    /**
     * <p>Given data and error-correction codewords received, possibly corrupted by errors, attempts to
     * correct the errors in-place using Reed-Solomon error correction.</p>
     *
     * @param codewordBytes data and error correction codewords
     * @param numDataCodewords number of codewords that are data bytes
     * @throws ChecksumException if error correction fails
     */
    Decoder.prototype.correctErrors = function (codewordBytes, numDataCodewords /*int*/) {
        // const numCodewords = codewordBytes.length;
        // First read into an array of ints
        var codewordsInts = new Int32Array(codewordBytes);
        // TYPESCRIPTPORT: not realy necessary to transform to ints? could redesign everything to work with unsigned bytes?
        // const codewordsInts = new Int32Array(numCodewords)
        // for (let i = 0; i < numCodewords; i++) {
        //   codewordsInts[i] = codewordBytes[i] & 0xFF
        // }
        try {
            this.rsDecoder.decode(codewordsInts, codewordBytes.length - numDataCodewords);
        }
        catch (ignored /*: ReedSolomonException*/) {
            throw new ChecksumException();
        }
        // Copy back into array of bytes -- only need to worry about the bytes that were data
        // We don't care about errors in the error-correction codewords
        for (var i = 0; i < numDataCodewords; i++) {
            codewordBytes[i] = /*(byte) */ codewordsInts[i];
        }
    };
    return Decoder;
}());
export default Decoder;
