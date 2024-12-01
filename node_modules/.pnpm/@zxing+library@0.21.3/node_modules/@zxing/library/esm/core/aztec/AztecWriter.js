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
// package com.google.zxing.aztec;
// import com.google.zxing.BarcodeFormat;
import BarcodeFormat from '../BarcodeFormat';
// import com.google.zxing.EncodeHintType;
import EncodeHintType from '../EncodeHintType';
// import com.google.zxing.aztec.encoder.Encoder;
import Encoder from './encoder/Encoder';
// import com.google.zxing.common.BitMatrix;
import BitMatrix from '../common/BitMatrix';
// import java.nio.charset.Charset;
import Charset from '../util/Charset';
// import java.nio.charset.StandardCharsets;
import StandardCharsets from '../util/StandardCharsets';
// import java.util.Map;
import Integer from '../util/Integer';
import IllegalStateException from '../IllegalStateException';
import IllegalArgumentException from '../IllegalArgumentException';
import StringUtils from '../common/StringUtils';
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
        var charset = StandardCharsets.ISO_8859_1;
        var eccPercent = Encoder.DEFAULT_EC_PERCENT;
        var layers = Encoder.DEFAULT_AZTEC_LAYERS;
        if (hints != null) {
            if (hints.has(EncodeHintType.CHARACTER_SET)) {
                charset = Charset.forName(hints.get(EncodeHintType.CHARACTER_SET).toString());
            }
            if (hints.has(EncodeHintType.ERROR_CORRECTION)) {
                eccPercent = Integer.parseInt(hints.get(EncodeHintType.ERROR_CORRECTION).toString());
            }
            if (hints.has(EncodeHintType.AZTEC_LAYERS)) {
                layers = Integer.parseInt(hints.get(EncodeHintType.AZTEC_LAYERS).toString());
            }
        }
        return AztecWriter.encodeLayers(contents, format, width, height, charset, eccPercent, layers);
    };
    AztecWriter.encodeLayers = function (contents, format, width, height, charset, eccPercent, layers) {
        if (format !== BarcodeFormat.AZTEC) {
            throw new IllegalArgumentException('Can only encode AZTEC, but got ' + format);
        }
        var aztec = Encoder.encode(StringUtils.getBytes(contents, charset), eccPercent, layers);
        return AztecWriter.renderResult(aztec, width, height);
    };
    AztecWriter.renderResult = function (code, width, height) {
        var input = code.getMatrix();
        if (input == null) {
            throw new IllegalStateException();
        }
        var inputWidth = input.getWidth();
        var inputHeight = input.getHeight();
        var outputWidth = Math.max(width, inputWidth);
        var outputHeight = Math.max(height, inputHeight);
        var multiple = Math.min(outputWidth / inputWidth, outputHeight / inputHeight);
        var leftPadding = (outputWidth - (inputWidth * multiple)) / 2;
        var topPadding = (outputHeight - (inputHeight * multiple)) / 2;
        var output = new BitMatrix(outputWidth, outputHeight);
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
export default AztecWriter;
