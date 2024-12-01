"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
// package com.google.zxing.aztec;
// import com.google.zxing.BarcodeFormat;
var BarcodeFormat_1 = require("../BarcodeFormat");
// import com.google.zxing.EncodeHintType;
var EncodeHintType_1 = require("../EncodeHintType");
// import com.google.zxing.aztec.encoder.Encoder;
var Encoder_1 = require("./encoder/Encoder");
// import com.google.zxing.common.BitMatrix;
var BitMatrix_1 = require("../common/BitMatrix");
// import java.nio.charset.Charset;
var Charset_1 = require("../util/Charset");
// import java.nio.charset.StandardCharsets;
var StandardCharsets_1 = require("../util/StandardCharsets");
// import java.util.Map;
var Integer_1 = require("../util/Integer");
var IllegalStateException_1 = require("../IllegalStateException");
var IllegalArgumentException_1 = require("../IllegalArgumentException");
var StringUtils_1 = require("../common/StringUtils");
/**
 * Renders an Aztec code as a {@link BitMatrix}.
 */
var AztecWriter = /** @class */ (function () {
    function AztecWriter() {
    }
    // @Override
    AztecWriter.prototype.encode = function (contents, format, width, height) {
        return this.encodeWithHints(contents, format, width, height, null);
    };
    // @Override
    AztecWriter.prototype.encodeWithHints = function (contents, format, width, height, hints) {
        var charset = StandardCharsets_1.default.ISO_8859_1;
        var eccPercent = Encoder_1.default.DEFAULT_EC_PERCENT;
        var layers = Encoder_1.default.DEFAULT_AZTEC_LAYERS;
        if (hints != null) {
            if (hints.has(EncodeHintType_1.default.CHARACTER_SET)) {
                charset = Charset_1.default.forName(hints.get(EncodeHintType_1.default.CHARACTER_SET).toString());
            }
            if (hints.has(EncodeHintType_1.default.ERROR_CORRECTION)) {
                eccPercent = Integer_1.default.parseInt(hints.get(EncodeHintType_1.default.ERROR_CORRECTION).toString());
            }
            if (hints.has(EncodeHintType_1.default.AZTEC_LAYERS)) {
                layers = Integer_1.default.parseInt(hints.get(EncodeHintType_1.default.AZTEC_LAYERS).toString());
            }
        }
        return AztecWriter.encodeLayers(contents, format, width, height, charset, eccPercent, layers);
    };
    AztecWriter.encodeLayers = function (contents, format, width, height, charset, eccPercent, layers) {
        if (format !== BarcodeFormat_1.default.AZTEC) {
            throw new IllegalArgumentException_1.default('Can only encode AZTEC, but got ' + format);
        }
        var aztec = Encoder_1.default.encode(StringUtils_1.default.getBytes(contents, charset), eccPercent, layers);
        return AztecWriter.renderResult(aztec, width, height);
    };
    AztecWriter.renderResult = function (code, width, height) {
        var input = code.getMatrix();
        if (input == null) {
            throw new IllegalStateException_1.default();
        }
        var inputWidth = input.getWidth();
        var inputHeight = input.getHeight();
        var outputWidth = Math.max(width, inputWidth);
        var outputHeight = Math.max(height, inputHeight);
        var multiple = Math.min(outputWidth / inputWidth, outputHeight / inputHeight);
        var leftPadding = (outputWidth - (inputWidth * multiple)) / 2;
        var topPadding = (outputHeight - (inputHeight * multiple)) / 2;
        var output = new BitMatrix_1.default(outputWidth, outputHeight);
        for (var inputY /*int*/ = 0, outputY = topPadding; inputY < inputHeight; inputY++, outputY += multiple) {
            // Write the contents of this row of the barcode
            for (var inputX /*int*/ = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
                if (input.get(inputX, inputY)) {
                    output.setRegion(outputX, outputY, multiple, multiple);
                }
            }
        }
        return output;
    };
    return AztecWriter;
}());
exports.default = AztecWriter;
