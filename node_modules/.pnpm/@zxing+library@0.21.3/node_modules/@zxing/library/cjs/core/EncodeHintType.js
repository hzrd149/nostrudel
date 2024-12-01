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
/*namespace com.google.zxing {*/
/**
 * These are a set of hints that you may pass to Writers to specify their behavior.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
var EncodeHintType;
(function (EncodeHintType) {
    /**
     * Specifies what degree of error correction to use, for example in QR Codes.
     * Type depends on the encoder. For example for QR codes it's type
     * {@link com.google.zxing.qrcode.decoder.ErrorCorrectionLevel ErrorCorrectionLevel}.
     * For Aztec it is of type {@link Integer}, representing the minimal percentage of error correction words.
     * For PDF417 it is of type {@link Integer}, valid values being 0 to 8.
     * In all cases, it can also be a {@link String} representation of the desired value as well.
     * Note: an Aztec symbol should have a minimum of 25% EC words.
     */
    EncodeHintType[EncodeHintType["ERROR_CORRECTION"] = 0] = "ERROR_CORRECTION";
    /**
     * Specifies what character encoding to use where applicable (type {@link String})
     */
    EncodeHintType[EncodeHintType["CHARACTER_SET"] = 1] = "CHARACTER_SET";
    /**
     * Specifies the matrix shape for Data Matrix (type {@link com.google.zxing.datamatrix.encoder.SymbolShapeHint})
     */
    EncodeHintType[EncodeHintType["DATA_MATRIX_SHAPE"] = 2] = "DATA_MATRIX_SHAPE";
    /**
     * Specifies whether to use compact mode for Data Matrix (type {@link Boolean}, or "true" or "false"
     * {@link String } value).
     * The compact encoding mode also supports the encoding of characters that are not in the ISO-8859-1
     * character set via ECIs.
     * Please note that in that case, the most compact character encoding is chosen for characters in
     * the input that are not in the ISO-8859-1 character set. Based on experience, some scanners do not
     * support encodings like cp-1256 (Arabic). In such cases the encoding can be forced to UTF-8 by
     * means of the {@link #CHARACTER_SET} encoding hint.
     * Compact encoding also provides GS1-FNC1 support when {@link #GS1_FORMAT} is selected. In this case
     * group-separator character (ASCII 29 decimal) can be used to encode the positions of FNC1 codewords
     * for the purpose of delimiting AIs.
     * This option and {@link #FORCE_C40} are mutually exclusive.
     */
    EncodeHintType[EncodeHintType["DATA_MATRIX_COMPACT"] = 3] = "DATA_MATRIX_COMPACT";
    /**
     * Specifies a minimum barcode size (type {@link Dimension}). Only applicable to Data Matrix now.
     *
     * @deprecated use width/height params in
     * {@link com.google.zxing.datamatrix.DataMatrixWriter#encode(String, BarcodeFormat, int, int)}
     */
    /*@Deprecated*/
    EncodeHintType[EncodeHintType["MIN_SIZE"] = 4] = "MIN_SIZE";
    /**
     * Specifies a maximum barcode size (type {@link Dimension}). Only applicable to Data Matrix now.
     *
     * @deprecated without replacement
     */
    /*@Deprecated*/
    EncodeHintType[EncodeHintType["MAX_SIZE"] = 5] = "MAX_SIZE";
    /**
     * Specifies margin, in pixels, to use when generating the barcode. The meaning can vary
     * by format; for example it controls margin before and after the barcode horizontally for
     * most 1D formats. (Type {@link Integer}, or {@link String} representation of the integer value).
     */
    EncodeHintType[EncodeHintType["MARGIN"] = 6] = "MARGIN";
    /**
     * Specifies whether to use compact mode for PDF417 (type {@link Boolean}, or "true" or "false"
     * {@link String} value).
     */
    EncodeHintType[EncodeHintType["PDF417_COMPACT"] = 7] = "PDF417_COMPACT";
    /**
     * Specifies what compaction mode to use for PDF417 (type
     * {@link com.google.zxing.pdf417.encoder.Compaction Compaction} or {@link String} value of one of its
     * enum values).
     */
    EncodeHintType[EncodeHintType["PDF417_COMPACTION"] = 8] = "PDF417_COMPACTION";
    /**
     * Specifies the minimum and maximum number of rows and columns for PDF417 (type
     * {@link com.google.zxing.pdf417.encoder.Dimensions Dimensions}).
     */
    EncodeHintType[EncodeHintType["PDF417_DIMENSIONS"] = 9] = "PDF417_DIMENSIONS";
    /**
     * Specifies the required number of layers for an Aztec code.
     * A negative number (-1, -2, -3, -4) specifies a compact Aztec code.
     * 0 indicates to use the minimum number of layers (the default).
     * A positive number (1, 2, .. 32) specifies a normal (non-compact) Aztec code.
     * (Type {@link Integer}, or {@link String} representation of the integer value).
     */
    EncodeHintType[EncodeHintType["AZTEC_LAYERS"] = 10] = "AZTEC_LAYERS";
    /**
     * Specifies the exact version of QR code to be encoded.
     * (Type {@link Integer}, or {@link String} representation of the integer value).
     */
    EncodeHintType[EncodeHintType["QR_VERSION"] = 11] = "QR_VERSION";
    /**
     * Specifies whether the data should be encoded to the GS1 standard (type {@link Boolean}, or "true" or "false"
     * {@link String } value).
     */
    EncodeHintType[EncodeHintType["GS1_FORMAT"] = 12] = "GS1_FORMAT";
    /**
     * Forces C40 encoding for data-matrix (type {@link Boolean}, or "true" or "false") {@link String } value). This
     * option and {@link #DATA_MATRIX_COMPACT} are mutually exclusive.
     */
    EncodeHintType[EncodeHintType["FORCE_C40"] = 13] = "FORCE_C40";
})(EncodeHintType || (EncodeHintType = {}));
exports.default = EncodeHintType;
