"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var Result_1 = require("../Result");
var BarcodeFormat_1 = require("../BarcodeFormat");
var DecodeHintType_1 = require("../DecodeHintType");
var ResultMetadataType_1 = require("../ResultMetadataType");
var System_1 = require("../util/System");
var Decoder_1 = require("./decoder/Decoder");
var Detector_1 = require("./detector/Detector");
// import java.util.List;
// import java.util.Map;
/**
 * This implementation can detect and decode Aztec codes in an image.
 *
 * @author David Olivier
 */
var AztecReader = /** @class */ (function () {
    function AztecReader() {
    }
    /**
     * Locates and decodes a Data Matrix code in an image.
     *
     * @return a String representing the content encoded by the Data Matrix code
     * @throws NotFoundException if a Data Matrix code cannot be found
     * @throws FormatException if a Data Matrix code cannot be decoded
     */
    AztecReader.prototype.decode = function (image, hints) {
        if (hints === void 0) { hints = null; }
        var exception = null;
        var detector = new Detector_1.default(image.getBlackMatrix());
        var points = null;
        var decoderResult = null;
        try {
            var detectorResult = detector.detectMirror(false);
            points = detectorResult.getPoints();
            this.reportFoundResultPoints(hints, points);
            decoderResult = new Decoder_1.default().decode(detectorResult);
        }
        catch (e) {
            exception = e;
        }
        if (decoderResult == null) {
            try {
                var detectorResult = detector.detectMirror(true);
                points = detectorResult.getPoints();
                this.reportFoundResultPoints(hints, points);
                decoderResult = new Decoder_1.default().decode(detectorResult);
            }
            catch (e) {
                if (exception != null) {
                    throw exception;
                }
                throw e;
            }
        }
        var result = new Result_1.default(decoderResult.getText(), decoderResult.getRawBytes(), decoderResult.getNumBits(), points, BarcodeFormat_1.default.AZTEC, System_1.default.currentTimeMillis());
        var byteSegments = decoderResult.getByteSegments();
        if (byteSegments != null) {
            result.putMetadata(ResultMetadataType_1.default.BYTE_SEGMENTS, byteSegments);
        }
        var ecLevel = decoderResult.getECLevel();
        if (ecLevel != null) {
            result.putMetadata(ResultMetadataType_1.default.ERROR_CORRECTION_LEVEL, ecLevel);
        }
        return result;
    };
    AztecReader.prototype.reportFoundResultPoints = function (hints, points) {
        if (hints != null) {
            var rpcb_1 = hints.get(DecodeHintType_1.default.NEED_RESULT_POINT_CALLBACK);
            if (rpcb_1 != null) {
                points.forEach(function (point, idx, arr) {
                    rpcb_1.foundPossibleResultPoint(point);
                });
            }
        }
    };
    // @Override
    AztecReader.prototype.reset = function () {
        // do nothing
    };
    return AztecReader;
}());
exports.default = AztecReader;
