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
/*namespace com.google.zxing.qrcode {*/
import BarcodeFormat from '../BarcodeFormat';
import EncodeHintType from '../EncodeHintType';
import BitMatrix from '../common/BitMatrix';
import ErrorCorrectionLevel from './decoder/ErrorCorrectionLevel';
import Encoder from './encoder/Encoder';
import IllegalArgumentException from '../IllegalArgumentException';
import IllegalStateException from '../IllegalStateException';
/*import java.util.Map;*/
/**
 * This object renders a QR Code as a BitMatrix 2D array of greyscale values.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
var QRCodeWriter = /** @class */ (function () {
    function QRCodeWriter() {
    }
    /*@Override*/
    // public encode(contents: string, format: BarcodeFormat, width: number /*int*/, height: number /*int*/): BitMatrix
    //     /*throws WriterException */ {
    //   return encode(contents, format, width, height, null)
    // }
    /*@Override*/
    QRCodeWriter.prototype.encode = function (contents, format, width /*int*/, height /*int*/, hints) {
        if (contents.length === 0) {
            throw new IllegalArgumentException('Found empty contents');
        }
        if (format !== BarcodeFormat.QR_CODE) {
            throw new IllegalArgumentException('Can only encode QR_CODE, but got ' + format);
        }
        if (width < 0 || height < 0) {
            throw new IllegalArgumentException("Requested dimensions are too small: " + width + "x" + height);
        }
        var errorCorrectionLevel = ErrorCorrectionLevel.L;
        var quietZone = QRCodeWriter.QUIET_ZONE_SIZE;
        if (hints !== null) {
            if (undefined !== hints.get(EncodeHintType.ERROR_CORRECTION)) {
                errorCorrectionLevel = ErrorCorrectionLevel.fromString(hints.get(EncodeHintType.ERROR_CORRECTION).toString());
            }
            if (undefined !== hints.get(EncodeHintType.MARGIN)) {
                quietZone = Number.parseInt(hints.get(EncodeHintType.MARGIN).toString(), 10);
            }
        }
        var code = Encoder.encode(contents, errorCorrectionLevel, hints);
        return QRCodeWriter.renderResult(code, width, height, quietZone);
    };
    // Note that the input matrix uses 0 == white, 1 == black, while the output matrix uses
    // 0 == black, 255 == white (i.e. an 8 bit greyscale bitmap).
    QRCodeWriter.renderResult = function (code, width /*int*/, height /*int*/, quietZone /*int*/) {
        var input = code.getMatrix();
        if (input === null) {
            throw new IllegalStateException();
        }
        var inputWidth = input.getWidth();
        var inputHeight = input.getHeight();
        var qrWidth = inputWidth + (quietZone * 2);
        var qrHeight = inputHeight + (quietZone * 2);
        var outputWidth = Math.max(width, qrWidth);
        var outputHeight = Math.max(height, qrHeight);
        var multiple = Math.min(Math.floor(outputWidth / qrWidth), Math.floor(outputHeight / qrHeight));
        // Padding includes both the quiet zone and the extra white pixels to accommodate the requested
        // dimensions. For example, if input is 25x25 the QR will be 33x33 including the quiet zone.
        // If the requested size is 200x160, the multiple will be 4, for a QR of 132x132. These will
        // handle all the padding from 100x100 (the actual QR) up to 200x160.
        var leftPadding = Math.floor((outputWidth - (inputWidth * multiple)) / 2);
        var topPadding = Math.floor((outputHeight - (inputHeight * multiple)) / 2);
        var output = new BitMatrix(outputWidth, outputHeight);
        for (var inputY = 0, outputY = topPadding; inputY < inputHeight; inputY++, outputY += multiple) {
            // Write the contents of this row of the barcode
            for (var inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
                if (input.get(inputX, inputY) === 1) {
                    output.setRegion(outputX, outputY, multiple, multiple);
                }
            }
        }
        return output;
    };
    QRCodeWriter.QUIET_ZONE_SIZE = 4;
    return QRCodeWriter;
}());
export default QRCodeWriter;
