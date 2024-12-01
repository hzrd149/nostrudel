"use strict";
/*
 * Copyright 2009 ZXing authors
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
Object.defineProperty(exports, "__esModule", { value: true });
// package com.google.zxing.pdf417.decoder;
// import com.google.zxing.FormatException;
var FormatException_1 = require("../../FormatException");
// import com.google.zxing.common.CharacterSetECI;
var CharacterSetECI_1 = require("../../common/CharacterSetECI");
// import com.google.zxing.common.DecoderResult;
var DecoderResult_1 = require("../../common/DecoderResult");
// import com.google.zxing.pdf417.PDF417ResultMetadata;
var PDF417ResultMetadata_1 = require("../PDF417ResultMetadata");
// import java.io.ByteArrayOutputStream;
// import java.math.BigInteger;
// import java.nio.charset.Charset;
// import java.nio.charset.StandardCharsets;
// import java.util.Arrays;
var Arrays_1 = require("../../util/Arrays");
var StringBuilder_1 = require("../../util/StringBuilder");
var Integer_1 = require("../../util/Integer");
var Long_1 = require("../../util/Long");
var ByteArrayOutputStream_1 = require("../../util/ByteArrayOutputStream");
var StringEncoding_1 = require("../../util/StringEncoding");
/*private*/ var Mode;
(function (Mode) {
    Mode[Mode["ALPHA"] = 0] = "ALPHA";
    Mode[Mode["LOWER"] = 1] = "LOWER";
    Mode[Mode["MIXED"] = 2] = "MIXED";
    Mode[Mode["PUNCT"] = 3] = "PUNCT";
    Mode[Mode["ALPHA_SHIFT"] = 4] = "ALPHA_SHIFT";
    Mode[Mode["PUNCT_SHIFT"] = 5] = "PUNCT_SHIFT";
})(Mode || (Mode = {}));
/**
 * Indirectly access the global BigInt constructor, it
 * allows browsers that doesn't support BigInt to run
 * the library without breaking due to "undefined BigInt"
 * errors.
 */
function getBigIntConstructor() {
    if (typeof window !== 'undefined') {
        return window['BigInt'] || null;
    }
    if (typeof global !== 'undefined') {
        return global['BigInt'] || null;
    }
    if (typeof self !== 'undefined') {
        return self['BigInt'] || null;
    }
    throw new Error('Can\'t search globals for BigInt!');
}
/**
 * Used to store the BigInt constructor.
 */
var BigInteger;
/**
 * This function creates a bigint value. It allows browsers
 * that doesn't support BigInt to run the rest of the library
 * by not directly accessing the BigInt constructor.
 */
function createBigInt(num) {
    if (typeof BigInteger === 'undefined') {
        BigInteger = getBigIntConstructor();
    }
    if (BigInteger === null) {
        throw new Error('BigInt is not supported!');
    }
    return BigInteger(num);
}
function getEXP900() {
    // in Java - array with length = 16
    var EXP900 = [];
    EXP900[0] = createBigInt(1);
    var nineHundred = createBigInt(900);
    EXP900[1] = nineHundred;
    // in Java - array with length = 16
    for (var i /*int*/ = 2; i < 16; i++) {
        EXP900[i] = EXP900[i - 1] * nineHundred;
    }
    return EXP900;
}
/**
 * <p>This class contains the methods for decoding the PDF417 codewords.</p>
 *
 * @author SITA Lab (kevin.osullivan@sita.aero)
 * @author Guenther Grau
 */
var DecodedBitStreamParser = /** @class */ (function () {
    function DecodedBitStreamParser() {
    }
    //   private DecodedBitStreamParser() {
    // }
    /**
     *
     * @param codewords
     * @param ecLevel
     *
     * @throws FormatException
     */
    DecodedBitStreamParser.decode = function (codewords, ecLevel) {
        // pass encoding to result (will be used for decode symbols in byte mode)
        var result = new StringBuilder_1.default('');
        // let encoding: Charset = StandardCharsets.ISO_8859_1;
        var encoding = CharacterSetECI_1.default.ISO8859_1;
        /**
         * @note the next command is specific from this TypeScript library
         * because TS can't properly cast some values to char and
         * convert it to string later correctly due to encoding
         * differences from Java version. As reported here:
         * https://github.com/zxing-js/library/pull/264/files#r382831593
         */
        result.enableDecoding(encoding);
        // Get compaction mode
        var codeIndex = 1;
        var code = codewords[codeIndex++];
        var resultMetadata = new PDF417ResultMetadata_1.default();
        while (codeIndex < codewords[0]) {
            switch (code) {
                case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                    codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex, result);
                    break;
                case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
                case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
                    codeIndex = DecodedBitStreamParser.byteCompaction(code, codewords, encoding, codeIndex, result);
                    break;
                case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                    result.append(/*(char)*/ codewords[codeIndex++]);
                    break;
                case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH:
                    codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex, result);
                    break;
                case DecodedBitStreamParser.ECI_CHARSET:
                    var charsetECI = CharacterSetECI_1.default.getCharacterSetECIByValue(codewords[codeIndex++]);
                    // encoding = Charset.forName(charsetECI.getName());
                    break;
                case DecodedBitStreamParser.ECI_GENERAL_PURPOSE:
                    // Can't do anything with generic ECI; skip its 2 characters
                    codeIndex += 2;
                    break;
                case DecodedBitStreamParser.ECI_USER_DEFINED:
                    // Can't do anything with user ECI; skip its 1 character
                    codeIndex++;
                    break;
                case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
                    codeIndex = DecodedBitStreamParser.decodeMacroBlock(codewords, codeIndex, resultMetadata);
                    break;
                case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
                case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
                    // Should not see these outside a macro block
                    throw new FormatException_1.default();
                default:
                    // Default to text compaction. During testing numerous barcodes
                    // appeared to be missing the starting mode. In these cases defaulting
                    // to text compaction seems to work.
                    codeIndex--;
                    codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex, result);
                    break;
            }
            if (codeIndex < codewords.length) {
                code = codewords[codeIndex++];
            }
            else {
                throw FormatException_1.default.getFormatInstance();
            }
        }
        if (result.length() === 0) {
            throw FormatException_1.default.getFormatInstance();
        }
        var decoderResult = new DecoderResult_1.default(null, result.toString(), null, ecLevel);
        decoderResult.setOther(resultMetadata);
        return decoderResult;
    };
    /**
     *
     * @param int
     * @param param1
     * @param codewords
     * @param int
     * @param codeIndex
     * @param PDF417ResultMetadata
     * @param resultMetadata
     *
     * @throws FormatException
     */
    // @SuppressWarnings("deprecation")
    DecodedBitStreamParser.decodeMacroBlock = function (codewords, codeIndex, resultMetadata) {
        if (codeIndex + DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS > codewords[0]) {
            // we must have at least two bytes left for the segment index
            throw FormatException_1.default.getFormatInstance();
        }
        var segmentIndexArray = new Int32Array(DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS);
        for (var i /*int*/ = 0; i < DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS; i++, codeIndex++) {
            segmentIndexArray[i] = codewords[codeIndex];
        }
        resultMetadata.setSegmentIndex(Integer_1.default.parseInt(DecodedBitStreamParser.decodeBase900toBase10(segmentIndexArray, DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS)));
        var fileId = new StringBuilder_1.default();
        codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex, fileId);
        resultMetadata.setFileId(fileId.toString());
        var optionalFieldsStart = -1;
        if (codewords[codeIndex] === DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD) {
            optionalFieldsStart = codeIndex + 1;
        }
        while (codeIndex < codewords[0]) {
            switch (codewords[codeIndex]) {
                case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
                    codeIndex++;
                    switch (codewords[codeIndex]) {
                        case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_FILE_NAME:
                            var fileName = new StringBuilder_1.default();
                            codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex + 1, fileName);
                            resultMetadata.setFileName(fileName.toString());
                            break;
                        case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_SENDER:
                            var sender = new StringBuilder_1.default();
                            codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex + 1, sender);
                            resultMetadata.setSender(sender.toString());
                            break;
                        case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_ADDRESSEE:
                            var addressee = new StringBuilder_1.default();
                            codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex + 1, addressee);
                            resultMetadata.setAddressee(addressee.toString());
                            break;
                        case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_SEGMENT_COUNT:
                            var segmentCount = new StringBuilder_1.default();
                            codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex + 1, segmentCount);
                            resultMetadata.setSegmentCount(Integer_1.default.parseInt(segmentCount.toString()));
                            break;
                        case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_TIME_STAMP:
                            var timestamp = new StringBuilder_1.default();
                            codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex + 1, timestamp);
                            resultMetadata.setTimestamp(Long_1.default.parseLong(timestamp.toString()));
                            break;
                        case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_CHECKSUM:
                            var checksum = new StringBuilder_1.default();
                            codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex + 1, checksum);
                            resultMetadata.setChecksum(Integer_1.default.parseInt(checksum.toString()));
                            break;
                        case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_FILE_SIZE:
                            var fileSize = new StringBuilder_1.default();
                            codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex + 1, fileSize);
                            resultMetadata.setFileSize(Long_1.default.parseLong(fileSize.toString()));
                            break;
                        default:
                            throw FormatException_1.default.getFormatInstance();
                    }
                    break;
                case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
                    codeIndex++;
                    resultMetadata.setLastSegment(true);
                    break;
                default:
                    throw FormatException_1.default.getFormatInstance();
            }
        }
        // copy optional fields to additional options
        if (optionalFieldsStart !== -1) {
            var optionalFieldsLength = codeIndex - optionalFieldsStart;
            if (resultMetadata.isLastSegment()) {
                // do not include terminator
                optionalFieldsLength--;
            }
            resultMetadata.setOptionalData(Arrays_1.default.copyOfRange(codewords, optionalFieldsStart, optionalFieldsStart + optionalFieldsLength));
        }
        return codeIndex;
    };
    /**
     * Text Compaction mode (see 5.4.1.5) permits all printable ASCII characters to be
     * encoded, i.e. values 32 - 126 inclusive in accordance with ISO/IEC 646 (IRV), as
     * well as selected control characters.
     *
     * @param codewords The array of codewords (data + error)
     * @param codeIndex The current index into the codeword array.
     * @param result    The decoded data is appended to the result.
     * @return The next index into the codeword array.
     */
    DecodedBitStreamParser.textCompaction = function (codewords, codeIndex, result) {
        // 2 character per codeword
        var textCompactionData = new Int32Array((codewords[0] - codeIndex) * 2);
        // Used to hold the byte compaction value if there is a mode shift
        var byteCompactionData = new Int32Array((codewords[0] - codeIndex) * 2);
        var index = 0;
        var end = false;
        while ((codeIndex < codewords[0]) && !end) {
            var code = codewords[codeIndex++];
            if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
                textCompactionData[index] = code / 30;
                textCompactionData[index + 1] = code % 30;
                index += 2;
            }
            else {
                switch (code) {
                    case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                        // reinitialize text compaction mode to alpha sub mode
                        textCompactionData[index++] = DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH;
                        break;
                    case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
                    case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
                    case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH:
                    case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
                    case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
                    case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
                        codeIndex--;
                        end = true;
                        break;
                    case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                        // The Mode Shift codeword 913 shall cause a temporary
                        // switch from Text Compaction mode to Byte Compaction mode.
                        // This switch shall be in effect for only the next codeword,
                        // after which the mode shall revert to the prevailing sub-mode
                        // of the Text Compaction mode. Codeword 913 is only available
                        // in Text Compaction mode; its use is described in 5.4.2.4.
                        textCompactionData[index] = DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE;
                        code = codewords[codeIndex++];
                        byteCompactionData[index] = code;
                        index++;
                        break;
                }
            }
        }
        DecodedBitStreamParser.decodeTextCompaction(textCompactionData, byteCompactionData, index, result);
        return codeIndex;
    };
    /**
     * The Text Compaction mode includes all the printable ASCII characters
     * (i.e. values from 32 to 126) and three ASCII control characters: HT or tab
     * (9: e), LF or line feed (10: e), and CR or carriage
     * return (13: e). The Text Compaction mode also includes various latch
     * and shift characters which are used exclusively within the mode. The Text
     * Compaction mode encodes up to 2 characters per codeword. The compaction rules
     * for converting data into PDF417 codewords are defined in 5.4.2.2. The sub-mode
     * switches are defined in 5.4.2.3.
     *
     * @param textCompactionData The text compaction data.
     * @param byteCompactionData The byte compaction data if there
     *                           was a mode shift.
     * @param length             The size of the text compaction and byte compaction data.
     * @param result             The decoded data is appended to the result.
     */
    DecodedBitStreamParser.decodeTextCompaction = function (textCompactionData, byteCompactionData, length, result) {
        // Beginning from an initial state of the Alpha sub-mode
        // The default compaction mode for PDF417 in effect at the start of each symbol shall always be Text
        // Compaction mode Alpha sub-mode (alphabetic: uppercase). A latch codeword from another mode to the Text
        // Compaction mode shall always switch to the Text Compaction Alpha sub-mode.
        var subMode = Mode.ALPHA;
        var priorToShiftMode = Mode.ALPHA;
        var i = 0;
        while (i < length) {
            var subModeCh = textCompactionData[i];
            var ch = /*char*/ '';
            switch (subMode) {
                case Mode.ALPHA:
                    // Alpha (alphabetic: uppercase)
                    if (subModeCh < 26) {
                        // Upper case Alpha Character
                        // Note: 65 = 'A' ASCII -> there is byte code of symbol
                        ch = /*(char)('A' + subModeCh) */ String.fromCharCode(65 + subModeCh);
                    }
                    else {
                        switch (subModeCh) {
                            case 26:
                                ch = ' ';
                                break;
                            case DecodedBitStreamParser.LL:
                                subMode = Mode.LOWER;
                                break;
                            case DecodedBitStreamParser.ML:
                                subMode = Mode.MIXED;
                                break;
                            case DecodedBitStreamParser.PS:
                                // Shift to punctuation
                                priorToShiftMode = subMode;
                                subMode = Mode.PUNCT_SHIFT;
                                break;
                            case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                                result.append(/*(char)*/ byteCompactionData[i]);
                                break;
                            case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                                subMode = Mode.ALPHA;
                                break;
                        }
                    }
                    break;
                case Mode.LOWER:
                    // Lower (alphabetic: lowercase)
                    if (subModeCh < 26) {
                        ch = /*(char)('a' + subModeCh)*/ String.fromCharCode(97 + subModeCh);
                    }
                    else {
                        switch (subModeCh) {
                            case 26:
                                ch = ' ';
                                break;
                            case DecodedBitStreamParser.AS:
                                // Shift to alpha
                                priorToShiftMode = subMode;
                                subMode = Mode.ALPHA_SHIFT;
                                break;
                            case DecodedBitStreamParser.ML:
                                subMode = Mode.MIXED;
                                break;
                            case DecodedBitStreamParser.PS:
                                // Shift to punctuation
                                priorToShiftMode = subMode;
                                subMode = Mode.PUNCT_SHIFT;
                                break;
                            case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                                // TODO Does this need to use the current character encoding? See other occurrences below
                                result.append(/*(char)*/ byteCompactionData[i]);
                                break;
                            case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                                subMode = Mode.ALPHA;
                                break;
                        }
                    }
                    break;
                case Mode.MIXED:
                    // Mixed (punctuation: e)
                    if (subModeCh < DecodedBitStreamParser.PL) {
                        ch = DecodedBitStreamParser.MIXED_CHARS[subModeCh];
                    }
                    else {
                        switch (subModeCh) {
                            case DecodedBitStreamParser.PL:
                                subMode = Mode.PUNCT;
                                break;
                            case 26:
                                ch = ' ';
                                break;
                            case DecodedBitStreamParser.LL:
                                subMode = Mode.LOWER;
                                break;
                            case DecodedBitStreamParser.AL:
                                subMode = Mode.ALPHA;
                                break;
                            case DecodedBitStreamParser.PS:
                                // Shift to punctuation
                                priorToShiftMode = subMode;
                                subMode = Mode.PUNCT_SHIFT;
                                break;
                            case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                                result.append(/*(char)*/ byteCompactionData[i]);
                                break;
                            case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                                subMode = Mode.ALPHA;
                                break;
                        }
                    }
                    break;
                case Mode.PUNCT:
                    // Punctuation
                    if (subModeCh < DecodedBitStreamParser.PAL) {
                        ch = DecodedBitStreamParser.PUNCT_CHARS[subModeCh];
                    }
                    else {
                        switch (subModeCh) {
                            case DecodedBitStreamParser.PAL:
                                subMode = Mode.ALPHA;
                                break;
                            case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                                result.append(/*(char)*/ byteCompactionData[i]);
                                break;
                            case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                                subMode = Mode.ALPHA;
                                break;
                        }
                    }
                    break;
                case Mode.ALPHA_SHIFT:
                    // Restore sub-mode
                    subMode = priorToShiftMode;
                    if (subModeCh < 26) {
                        ch = /*(char)('A' + subModeCh)*/ String.fromCharCode(65 + subModeCh);
                    }
                    else {
                        switch (subModeCh) {
                            case 26:
                                ch = ' ';
                                break;
                            case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                                subMode = Mode.ALPHA;
                                break;
                        }
                    }
                    break;
                case Mode.PUNCT_SHIFT:
                    // Restore sub-mode
                    subMode = priorToShiftMode;
                    if (subModeCh < DecodedBitStreamParser.PAL) {
                        ch = DecodedBitStreamParser.PUNCT_CHARS[subModeCh];
                    }
                    else {
                        switch (subModeCh) {
                            case DecodedBitStreamParser.PAL:
                                subMode = Mode.ALPHA;
                                break;
                            case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                                // PS before Shift-to-Byte is used as a padding character,
                                // see 5.4.2.4 of the specification
                                result.append(/*(char)*/ byteCompactionData[i]);
                                break;
                            case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                                subMode = Mode.ALPHA;
                                break;
                        }
                    }
                    break;
            }
            // if (ch !== 0) {
            if (ch !== '') {
                // Append decoded character to result
                result.append(ch);
            }
            i++;
        }
    };
    /**
     * Byte Compaction mode (see 5.4.3) permits all 256 possible 8-bit byte values to be encoded.
     * This includes all ASCII characters value 0 to 127 inclusive and provides for international
     * character set support.
     *
     * @param mode      The byte compaction mode i.e. 901 or 924
     * @param codewords The array of codewords (data + error)
     * @param encoding  Currently active character encoding
     * @param codeIndex The current index into the codeword array.
     * @param result    The decoded data is appended to the result.
     * @return The next index into the codeword array.
     */
    DecodedBitStreamParser.byteCompaction = function (mode, codewords, encoding, codeIndex, result) {
        var decodedBytes = new ByteArrayOutputStream_1.default();
        var count = 0;
        var value = /*long*/ 0;
        var end = false;
        switch (mode) {
            case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
                // Total number of Byte Compaction characters to be encoded
                // is not a multiple of 6
                var byteCompactedCodewords = new Int32Array(6);
                var nextCode = codewords[codeIndex++];
                while ((codeIndex < codewords[0]) && !end) {
                    byteCompactedCodewords[count++] = nextCode;
                    // Base 900
                    value = 900 * value + nextCode;
                    nextCode = codewords[codeIndex++];
                    // perhaps it should be ok to check only nextCode >= TEXT_COMPACTION_MODE_LATCH
                    switch (nextCode) {
                        case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                        case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
                        case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH:
                        case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
                        case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
                        case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
                        case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
                            codeIndex--;
                            end = true;
                            break;
                        default:
                            if ((count % 5 === 0) && (count > 0)) {
                                // Decode every 5 codewords
                                // Convert to Base 256
                                for (var j /*int*/ = 0; j < 6; ++j) {
                                    /* @note
                                     * JavaScript stores numbers as 64 bits floating point numbers, but all bitwise operations are performed on 32 bits binary numbers.
                                     * So the next bitwise operation could not be done with simple numbers
                                     */
                                    decodedBytes.write(/*(byte)*/ Number(createBigInt(value) >> createBigInt(8 * (5 - j))));
                                }
                                value = 0;
                                count = 0;
                            }
                            break;
                    }
                }
                // if the end of all codewords is reached the last codeword needs to be added
                if (codeIndex === codewords[0] && nextCode < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
                    byteCompactedCodewords[count++] = nextCode;
                }
                // If Byte Compaction mode is invoked with codeword 901,
                // the last group of codewords is interpreted directly
                // as one byte per codeword, without compaction.
                for (var i /*int*/ = 0; i < count; i++) {
                    decodedBytes.write(/*(byte)*/ byteCompactedCodewords[i]);
                }
                break;
            case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
                // Total number of Byte Compaction characters to be encoded
                // is an integer multiple of 6
                while (codeIndex < codewords[0] && !end) {
                    var code = codewords[codeIndex++];
                    if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
                        count++;
                        // Base 900
                        value = 900 * value + code;
                    }
                    else {
                        switch (code) {
                            case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                            case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
                            case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH:
                            case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
                            case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
                            case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
                            case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
                                codeIndex--;
                                end = true;
                                break;
                        }
                    }
                    if ((count % 5 === 0) && (count > 0)) {
                        // Decode every 5 codewords
                        // Convert to Base 256
                        /* @note
                         * JavaScript stores numbers as 64 bits floating point numbers, but all bitwise operations are performed on 32 bits binary numbers.
                         * So the next bitwise operation could not be done with simple numbers
                        */
                        for (var j /*int*/ = 0; j < 6; ++j) {
                            decodedBytes.write(/*(byte)*/ Number(createBigInt(value) >> createBigInt(8 * (5 - j))));
                        }
                        value = 0;
                        count = 0;
                    }
                }
                break;
        }
        result.append(StringEncoding_1.default.decode(decodedBytes.toByteArray(), encoding));
        return codeIndex;
    };
    /**
     * Numeric Compaction mode (see 5.4.4) permits efficient encoding of numeric data strings.
     *
     * @param codewords The array of codewords (data + error)
     * @param codeIndex The current index into the codeword array.
     * @param result    The decoded data is appended to the result.
     * @return The next index into the codeword array.
     *
     * @throws FormatException
     */
    DecodedBitStreamParser.numericCompaction = function (codewords, codeIndex /*int*/, result) {
        var count = 0;
        var end = false;
        var numericCodewords = new Int32Array(DecodedBitStreamParser.MAX_NUMERIC_CODEWORDS);
        while (codeIndex < codewords[0] && !end) {
            var code = codewords[codeIndex++];
            if (codeIndex === codewords[0]) {
                end = true;
            }
            if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
                numericCodewords[count] = code;
                count++;
            }
            else {
                switch (code) {
                    case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                    case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
                    case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
                    case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
                    case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
                    case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
                        codeIndex--;
                        end = true;
                        break;
                }
            }
            if ((count % DecodedBitStreamParser.MAX_NUMERIC_CODEWORDS === 0 || code === DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH || end) && count > 0) {
                // Re-invoking Numeric Compaction mode (by using codeword 902
                // while in Numeric Compaction mode) serves  to terminate the
                // current Numeric Compaction mode grouping as described in 5.4.4.2,
                // and then to start a new one grouping.
                result.append(DecodedBitStreamParser.decodeBase900toBase10(numericCodewords, count));
                count = 0;
            }
        }
        return codeIndex;
    };
    /**
     * Convert a list of Numeric Compacted codewords from Base 900 to Base 10.
     *
     * @param codewords The array of codewords
     * @param count     The number of codewords
     * @return The decoded string representing the Numeric data.
     *
     * EXAMPLE
     * Encode the fifteen digit numeric string 000213298174000
     * Prefix the numeric string with a 1 and set the initial value of
     * t = 1 000 213 298 174 000
     * Calculate codeword 0
     * d0 = 1 000 213 298 174 000 mod 900 = 200
     *
     * t = 1 000 213 298 174 000 div 900 = 1 111 348 109 082
     * Calculate codeword 1
     * d1 = 1 111 348 109 082 mod 900 = 282
     *
     * t = 1 111 348 109 082 div 900 = 1 234 831 232
     * Calculate codeword 2
     * d2 = 1 234 831 232 mod 900 = 632
     *
     * t = 1 234 831 232 div 900 = 1 372 034
     * Calculate codeword 3
     * d3 = 1 372 034 mod 900 = 434
     *
     * t = 1 372 034 div 900 = 1 524
     * Calculate codeword 4
     * d4 = 1 524 mod 900 = 624
     *
     * t = 1 524 div 900 = 1
     * Calculate codeword 5
     * d5 = 1 mod 900 = 1
     * t = 1 div 900 = 0
     * Codeword sequence is: 1, 624, 434, 632, 282, 200
     *
     * Decode the above codewords involves
     *   1 x 900 power of 5 + 624 x 900 power of 4 + 434 x 900 power of 3 +
     * 632 x 900 power of 2 + 282 x 900 power of 1 + 200 x 900 power of 0 = 1000213298174000
     *
     * Remove leading 1 =>  Result is 000213298174000
     *
     * @throws FormatException
     */
    DecodedBitStreamParser.decodeBase900toBase10 = function (codewords, count) {
        var result = createBigInt(0);
        for (var i /*int*/ = 0; i < count; i++) {
            result += DecodedBitStreamParser.EXP900[count - i - 1] * createBigInt(codewords[i]);
        }
        var resultString = result.toString();
        if (resultString.charAt(0) !== '1') {
            throw new FormatException_1.default();
        }
        return resultString.substring(1);
    };
    DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH = 900;
    DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH = 901;
    DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH = 902;
    DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6 = 924;
    DecodedBitStreamParser.ECI_USER_DEFINED = 925;
    DecodedBitStreamParser.ECI_GENERAL_PURPOSE = 926;
    DecodedBitStreamParser.ECI_CHARSET = 927;
    DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK = 928;
    DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD = 923;
    DecodedBitStreamParser.MACRO_PDF417_TERMINATOR = 922;
    DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE = 913;
    DecodedBitStreamParser.MAX_NUMERIC_CODEWORDS = 15;
    DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_FILE_NAME = 0;
    DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_SEGMENT_COUNT = 1;
    DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_TIME_STAMP = 2;
    DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_SENDER = 3;
    DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_ADDRESSEE = 4;
    DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_FILE_SIZE = 5;
    DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_CHECKSUM = 6;
    DecodedBitStreamParser.PL = 25;
    DecodedBitStreamParser.LL = 27;
    DecodedBitStreamParser.AS = 27;
    DecodedBitStreamParser.ML = 28;
    DecodedBitStreamParser.AL = 28;
    DecodedBitStreamParser.PS = 29;
    DecodedBitStreamParser.PAL = 29;
    DecodedBitStreamParser.PUNCT_CHARS = ';<>@[\\]_`~!\r\t,:\n-.$/"|*()?{}\'';
    DecodedBitStreamParser.MIXED_CHARS = '0123456789&\r\t,:#-.$/+%*=^';
    /**
     * Table containing values for the exponent of 900.
     * This is used in the numeric compaction decode algorithm.
     */
    DecodedBitStreamParser.EXP900 = getBigIntConstructor() ? getEXP900() : [];
    DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS = 2;
    return DecodedBitStreamParser;
}());
exports.default = DecodedBitStreamParser;
