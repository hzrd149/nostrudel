/*
 * Copyright 2010 ZXing authors
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
import DecoderResult from '../../common/DecoderResult';
import GenericGF from '../../common/reedsolomon/GenericGF';
import ReedSolomonDecoder from '../../common/reedsolomon/ReedSolomonDecoder';
import IllegalStateException from '../../IllegalStateException';
import FormatException from '../../FormatException';
import StringUtils from '../../common/StringUtils';
import Integer from '../../util/Integer';
// import java.util.Arrays;
var Table;
(function (Table) {
    Table[Table["UPPER"] = 0] = "UPPER";
    Table[Table["LOWER"] = 1] = "LOWER";
    Table[Table["MIXED"] = 2] = "MIXED";
    Table[Table["DIGIT"] = 3] = "DIGIT";
    Table[Table["PUNCT"] = 4] = "PUNCT";
    Table[Table["BINARY"] = 5] = "BINARY";
})(Table || (Table = {}));
/**
 * <p>The main class which implements Aztec Code decoding -- as opposed to locating and extracting
 * the Aztec Code from an image.</p>
 *
 * @author David Olivier
 */
var Decoder = /** @class */ (function () {
    function Decoder() {
    }
    Decoder.prototype.decode = function (detectorResult) {
        this.ddata = detectorResult;
        var matrix = detectorResult.getBits();
        var rawbits = this.extractBits(matrix);
        var correctedBits = this.correctBits(rawbits);
        var rawBytes = Decoder.convertBoolArrayToByteArray(correctedBits);
        var result = Decoder.getEncodedData(correctedBits);
        var decoderResult = new DecoderResult(rawBytes, result, null, null);
        decoderResult.setNumBits(correctedBits.length);
        return decoderResult;
    };
    // This method is used for testing the high-level encoder
    Decoder.highLevelDecode = function (correctedBits) {
        return this.getEncodedData(correctedBits);
    };
    /**
     * Gets the string encoded in the aztec code bits
     *
     * @return the decoded string
     */
    Decoder.getEncodedData = function (correctedBits) {
        var endIndex = correctedBits.length;
        var latchTable = Table.UPPER; // table most recently latched to
        var shiftTable = Table.UPPER; // table to use for the next read
        var result = '';
        var index = 0;
        while (index < endIndex) {
            if (shiftTable === Table.BINARY) {
                if (endIndex - index < 5) {
                    break;
                }
                var length_1 = Decoder.readCode(correctedBits, index, 5);
                index += 5;
                if (length_1 === 0) {
                    if (endIndex - index < 11) {
                        break;
                    }
                    length_1 = Decoder.readCode(correctedBits, index, 11) + 31;
                    index += 11;
                }
                for (var charCount = 0; charCount < length_1; charCount++) {
                    if (endIndex - index < 8) {
                        index = endIndex; // Force outer loop to exit
                        break;
                    }
                    var code = Decoder.readCode(correctedBits, index, 8);
                    result += /*(char)*/ StringUtils.castAsNonUtf8Char(code);
                    index += 8;
                }
                // Go back to whatever mode we had been in
                shiftTable = latchTable;
            }
            else {
                var size = shiftTable === Table.DIGIT ? 4 : 5;
                if (endIndex - index < size) {
                    break;
                }
                var code = Decoder.readCode(correctedBits, index, size);
                index += size;
                var str = Decoder.getCharacter(shiftTable, code);
                if (str.startsWith('CTRL_')) {
                    // Table changes
                    // ISO/IEC 24778:2008 prescribes ending a shift sequence in the mode from which it was invoked.
                    // That's including when that mode is a shift.
                    // Our test case dlusbs.png for issue #642 exercises that.
                    latchTable = shiftTable; // Latch the current mode, so as to return to Upper after U/S B/S
                    shiftTable = Decoder.getTable(str.charAt(5));
                    if (str.charAt(6) === 'L') {
                        latchTable = shiftTable;
                    }
                }
                else {
                    result += str;
                    // Go back to whatever mode we had been in
                    shiftTable = latchTable;
                }
            }
        }
        return result;
    };
    /**
     * gets the table corresponding to the char passed
     */
    Decoder.getTable = function (t) {
        switch (t) {
            case 'L':
                return Table.LOWER;
            case 'P':
                return Table.PUNCT;
            case 'M':
                return Table.MIXED;
            case 'D':
                return Table.DIGIT;
            case 'B':
                return Table.BINARY;
            case 'U':
            default:
                return Table.UPPER;
        }
    };
    /**
     * Gets the character (or string) corresponding to the passed code in the given table
     *
     * @param table the table used
     * @param code the code of the character
     */
    Decoder.getCharacter = function (table, code) {
        switch (table) {
            case Table.UPPER:
                return Decoder.UPPER_TABLE[code];
            case Table.LOWER:
                return Decoder.LOWER_TABLE[code];
            case Table.MIXED:
                return Decoder.MIXED_TABLE[code];
            case Table.PUNCT:
                return Decoder.PUNCT_TABLE[code];
            case Table.DIGIT:
                return Decoder.DIGIT_TABLE[code];
            default:
                // Should not reach here.
                throw new IllegalStateException('Bad table');
        }
    };
    /**
     * <p>Performs RS error correction on an array of bits.</p>
     *
     * @return the corrected array
     * @throws FormatException if the input contains too many errors
     */
    Decoder.prototype.correctBits = function (rawbits) {
        var gf;
        var codewordSize;
        if (this.ddata.getNbLayers() <= 2) {
            codewordSize = 6;
            gf = GenericGF.AZTEC_DATA_6;
        }
        else if (this.ddata.getNbLayers() <= 8) {
            codewordSize = 8;
            gf = GenericGF.AZTEC_DATA_8;
        }
        else if (this.ddata.getNbLayers() <= 22) {
            codewordSize = 10;
            gf = GenericGF.AZTEC_DATA_10;
        }
        else {
            codewordSize = 12;
            gf = GenericGF.AZTEC_DATA_12;
        }
        var numDataCodewords = this.ddata.getNbDatablocks();
        var numCodewords = rawbits.length / codewordSize;
        if (numCodewords < numDataCodewords) {
            throw new FormatException();
        }
        var offset = rawbits.length % codewordSize;
        var dataWords = new Int32Array(numCodewords);
        for (var i = 0; i < numCodewords; i++, offset += codewordSize) {
            dataWords[i] = Decoder.readCode(rawbits, offset, codewordSize);
        }
        try {
            var rsDecoder = new ReedSolomonDecoder(gf);
            rsDecoder.decode(dataWords, numCodewords - numDataCodewords);
        }
        catch (ex) {
            throw new FormatException(ex);
        }
        // Now perform the unstuffing operation.
        // First, count how many bits are going to be thrown out as stuffing
        var mask = (1 << codewordSize) - 1;
        var stuffedBits = 0;
        for (var i = 0; i < numDataCodewords; i++) {
            var dataWord = dataWords[i];
            if (dataWord === 0 || dataWord === mask) {
                throw new FormatException();
            }
            else if (dataWord === 1 || dataWord === mask - 1) {
                stuffedBits++;
            }
        }
        // Now, actually unpack the bits and remove the stuffing
        var correctedBits = new Array(numDataCodewords * codewordSize - stuffedBits);
        var index = 0;
        for (var i = 0; i < numDataCodewords; i++) {
            var dataWord = dataWords[i];
            if (dataWord === 1 || dataWord === mask - 1) {
                // next codewordSize-1 bits are all zeros or all ones
                correctedBits.fill(dataWord > 1, index, index + codewordSize - 1);
                // Arrays.fill(correctedBits, index, index + codewordSize - 1, dataWord > 1);
                index += codewordSize - 1;
            }
            else {
                for (var bit = codewordSize - 1; bit >= 0; --bit) {
                    correctedBits[index++] = (dataWord & (1 << bit)) !== 0;
                }
            }
        }
        return correctedBits;
    };
    /**
     * Gets the array of bits from an Aztec Code matrix
     *
     * @return the array of bits
     */
    Decoder.prototype.extractBits = function (matrix) {
        var compact = this.ddata.isCompact();
        var layers = this.ddata.getNbLayers();
        var baseMatrixSize = (compact ? 11 : 14) + layers * 4; // not including alignment lines
        var alignmentMap = new Int32Array(baseMatrixSize);
        var rawbits = new Array(this.totalBitsInLayer(layers, compact));
        if (compact) {
            for (var i = 0; i < alignmentMap.length; i++) {
                alignmentMap[i] = i;
            }
        }
        else {
            var matrixSize = baseMatrixSize + 1 + 2 * Integer.truncDivision((Integer.truncDivision(baseMatrixSize, 2) - 1), 15);
            var origCenter = baseMatrixSize / 2;
            var center = Integer.truncDivision(matrixSize, 2);
            for (var i = 0; i < origCenter; i++) {
                var newOffset = i + Integer.truncDivision(i, 15);
                alignmentMap[origCenter - i - 1] = center - newOffset - 1;
                alignmentMap[origCenter + i] = center + newOffset + 1;
            }
        }
        for (var i = 0, rowOffset = 0; i < layers; i++) {
            var rowSize = (layers - i) * 4 + (compact ? 9 : 12);
            // The top-left most point of this layer is <low, low> (not including alignment lines)
            var low = i * 2;
            // The bottom-right most point of this layer is <high, high> (not including alignment lines)
            var high = baseMatrixSize - 1 - low;
            // We pull bits from the two 2 x rowSize columns and two rowSize x 2 rows
            for (var j = 0; j < rowSize; j++) {
                var columnOffset = j * 2;
                for (var k = 0; k < 2; k++) {
                    // left column
                    rawbits[rowOffset + columnOffset + k] =
                        matrix.get(alignmentMap[low + k], alignmentMap[low + j]);
                    // bottom row
                    rawbits[rowOffset + 2 * rowSize + columnOffset + k] =
                        matrix.get(alignmentMap[low + j], alignmentMap[high - k]);
                    // right column
                    rawbits[rowOffset + 4 * rowSize + columnOffset + k] =
                        matrix.get(alignmentMap[high - k], alignmentMap[high - j]);
                    // top row
                    rawbits[rowOffset + 6 * rowSize + columnOffset + k] =
                        matrix.get(alignmentMap[high - j], alignmentMap[low + k]);
                }
            }
            rowOffset += rowSize * 8;
        }
        return rawbits;
    };
    /**
     * Reads a code of given length and at given index in an array of bits
     */
    Decoder.readCode = function (rawbits, startIndex, length) {
        var res = 0;
        for (var i = startIndex; i < startIndex + length; i++) {
            res <<= 1;
            if (rawbits[i]) {
                res |= 0x01;
            }
        }
        return res;
    };
    /**
     * Reads a code of length 8 in an array of bits, padding with zeros
     */
    Decoder.readByte = function (rawbits, startIndex) {
        var n = rawbits.length - startIndex;
        if (n >= 8) {
            return Decoder.readCode(rawbits, startIndex, 8);
        }
        return Decoder.readCode(rawbits, startIndex, n) << (8 - n);
    };
    /**
     * Packs a bit array into bytes, most significant bit first
     */
    Decoder.convertBoolArrayToByteArray = function (boolArr) {
        var byteArr = new Uint8Array((boolArr.length + 7) / 8);
        for (var i = 0; i < byteArr.length; i++) {
            byteArr[i] = Decoder.readByte(boolArr, 8 * i);
        }
        return byteArr;
    };
    Decoder.prototype.totalBitsInLayer = function (layers, compact) {
        return ((compact ? 88 : 112) + 16 * layers) * layers;
    };
    Decoder.UPPER_TABLE = [
        'CTRL_PS', ' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'CTRL_LL', 'CTRL_ML', 'CTRL_DL', 'CTRL_BS'
    ];
    Decoder.LOWER_TABLE = [
        'CTRL_PS', ' ', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
        'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'CTRL_US', 'CTRL_ML', 'CTRL_DL', 'CTRL_BS'
    ];
    Decoder.MIXED_TABLE = [
        'CTRL_PS', ' ', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\b', '\t', '\n',
        '\x0b', '\f', '\r', '\x1b', '\x1c', '\x1d', '\x1e', '\x1f', '@', '\\', '^', '_',
        '`', '|', '~', '\x7f', 'CTRL_LL', 'CTRL_UL', 'CTRL_PL', 'CTRL_BS'
    ];
    Decoder.PUNCT_TABLE = [
        '', '\r', '\r\n', '. ', ', ', ': ', '!', '"', '#', '$', '%', '&', '\'', '(', ')',
        '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '[', ']', '{', '}', 'CTRL_UL'
    ];
    Decoder.DIGIT_TABLE = [
        'CTRL_PS', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '.', 'CTRL_UL', 'CTRL_US'
    ];
    return Decoder;
}());
export default Decoder;
