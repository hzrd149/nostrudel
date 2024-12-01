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
// package com.google.zxing.pdf417;
// import com.google.zxing.BarcodeFormat;
var BarcodeFormat_1 = require("../BarcodeFormat");
// import com.google.zxing.ChecksumException;
var ChecksumException_1 = require("../ChecksumException");
// import com.google.zxing.FormatException;
var FormatException_1 = require("../FormatException");
// import com.google.zxing.NotFoundException;
var NotFoundException_1 = require("../NotFoundException");
// import com.google.zxing.Result;
var Result_1 = require("../Result");
// import com.google.zxing.common.DecoderResult;
// import com.google.zxing.multi.MultipleBarcodeReader;
// import com.google.zxing.pdf417.decoder.PDF417ScanningDecoder;
// import com.google.zxing.pdf417.detector.Detector;
// import com.google.zxing.pdf417.detector.PDF417DetectorResult;
var PDF417Common_1 = require("./PDF417Common");
var Integer_1 = require("../util/Integer");
var ResultMetadataType_1 = require("../ResultMetadataType");
var Detector_1 = require("./detector/Detector");
var PDF417ScanningDecoder_1 = require("./decoder/PDF417ScanningDecoder");
// import java.util.ArrayList;
// import java.util.List;
// import java.util.Map;
/**
 * This implementation can detect and decode PDF417 codes in an image.
 *
 * @author Guenther Grau
 */
var PDF417Reader = /** @class */ (function () {
    function PDF417Reader() {
    }
    // private static /*final Result[]*/ EMPTY_RESULT_ARRAY: Result[] = new Result([0]);
    /**
     * Locates and decodes a PDF417 code in an image.
     *
     * @return a String representing the content encoded by the PDF417 code
     * @throws NotFoundException if a PDF417 code cannot be found,
     * @throws FormatException if a PDF417 cannot be decoded
     * @throws ChecksumException
     */
    // @Override
    PDF417Reader.prototype.decode = function (image, hints) {
        if (hints === void 0) { hints = null; }
        var result = PDF417Reader.decode(image, hints, false);
        if (result == null || result.length === 0 || result[0] == null) {
            throw NotFoundException_1.default.getNotFoundInstance();
        }
        return result[0];
    };
    /**
     *
     * @param BinaryBitmap
     * @param image
     * @throws NotFoundException
     */
    //   @Override
    PDF417Reader.prototype.decodeMultiple = function (image, hints) {
        if (hints === void 0) { hints = null; }
        try {
            return PDF417Reader.decode(image, hints, true);
        }
        catch (ignored) {
            if (ignored instanceof FormatException_1.default || ignored instanceof ChecksumException_1.default) {
                throw NotFoundException_1.default.getNotFoundInstance();
            }
            throw ignored;
        }
    };
    /**
     *
     * @param image
     * @param hints
     * @param multiple
     *
     * @throws NotFoundException
     * @throws FormatExceptionß
     * @throws ChecksumException
     */
    PDF417Reader.decode = function (image, hints, multiple) {
        var e_1, _a;
        var results = new Array();
        var detectorResult = Detector_1.default.detectMultiple(image, hints, multiple);
        try {
            for (var _b = __values(detectorResult.getPoints()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var points = _c.value;
                var decoderResult = PDF417ScanningDecoder_1.default.decode(detectorResult.getBits(), points[4], points[5], points[6], points[7], PDF417Reader.getMinCodewordWidth(points), PDF417Reader.getMaxCodewordWidth(points));
                var result = new Result_1.default(decoderResult.getText(), decoderResult.getRawBytes(), undefined, points, BarcodeFormat_1.default.PDF_417);
                result.putMetadata(ResultMetadataType_1.default.ERROR_CORRECTION_LEVEL, decoderResult.getECLevel());
                var pdf417ResultMetadata = decoderResult.getOther();
                if (pdf417ResultMetadata != null) {
                    result.putMetadata(ResultMetadataType_1.default.PDF417_EXTRA_METADATA, pdf417ResultMetadata);
                }
                results.push(result);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return results.map(function (x) { return x; });
    };
    PDF417Reader.getMaxWidth = function (p1, p2) {
        if (p1 == null || p2 == null) {
            return 0;
        }
        return Math.trunc(Math.abs(p1.getX() - p2.getX()));
    };
    PDF417Reader.getMinWidth = function (p1, p2) {
        if (p1 == null || p2 == null) {
            return Integer_1.default.MAX_VALUE;
        }
        return Math.trunc(Math.abs(p1.getX() - p2.getX()));
    };
    PDF417Reader.getMaxCodewordWidth = function (p) {
        return Math.floor(Math.max(Math.max(PDF417Reader.getMaxWidth(p[0], p[4]), PDF417Reader.getMaxWidth(p[6], p[2]) * PDF417Common_1.default.MODULES_IN_CODEWORD /
            PDF417Common_1.default.MODULES_IN_STOP_PATTERN), Math.max(PDF417Reader.getMaxWidth(p[1], p[5]), PDF417Reader.getMaxWidth(p[7], p[3]) * PDF417Common_1.default.MODULES_IN_CODEWORD /
            PDF417Common_1.default.MODULES_IN_STOP_PATTERN)));
    };
    PDF417Reader.getMinCodewordWidth = function (p) {
        return Math.floor(Math.min(Math.min(PDF417Reader.getMinWidth(p[0], p[4]), PDF417Reader.getMinWidth(p[6], p[2]) * PDF417Common_1.default.MODULES_IN_CODEWORD /
            PDF417Common_1.default.MODULES_IN_STOP_PATTERN), Math.min(PDF417Reader.getMinWidth(p[1], p[5]), PDF417Reader.getMinWidth(p[7], p[3]) * PDF417Common_1.default.MODULES_IN_CODEWORD /
            PDF417Common_1.default.MODULES_IN_STOP_PATTERN)));
    };
    // @Override
    PDF417Reader.prototype.reset = function () {
        // nothing needs to be reset
    };
    return PDF417Reader;
}());
exports.default = PDF417Reader;
