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
// package com.google.zxing.pdf417;
// import com.google.zxing.BarcodeFormat;
import BarcodeFormat from '../BarcodeFormat';
// import com.google.zxing.ChecksumException;
import ChecksumException from '../ChecksumException';
// import com.google.zxing.FormatException;
import FormatException from '../FormatException';
// import com.google.zxing.NotFoundException;
import NotFoundException from '../NotFoundException';
// import com.google.zxing.Result;
import Result from '../Result';
// import com.google.zxing.common.DecoderResult;
// import com.google.zxing.multi.MultipleBarcodeReader;
// import com.google.zxing.pdf417.decoder.PDF417ScanningDecoder;
// import com.google.zxing.pdf417.detector.Detector;
// import com.google.zxing.pdf417.detector.PDF417DetectorResult;
import PDF417Common from './PDF417Common';
import Integer from '../util/Integer';
import ResultMetadataType from '../ResultMetadataType';
import Detector from './detector/Detector';
import PDF417ScanningDecoder from './decoder/PDF417ScanningDecoder';
// import java.util.ArrayList;
// import java.util.List;
// import java.util.Map;
/**
 * This implementation can detect and decode PDF417 codes in an image.
 *
 * @author Guenther Grau
 */
export default /*public final*/ class PDF417Reader {
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
    decode(image, hints = null) {
        let result = PDF417Reader.decode(image, hints, false);
        if (result == null || result.length === 0 || result[0] == null) {
            throw NotFoundException.getNotFoundInstance();
        }
        return result[0];
    }
    /**
     *
     * @param BinaryBitmap
     * @param image
     * @throws NotFoundException
     */
    //   @Override
    decodeMultiple(image, hints = null) {
        try {
            return PDF417Reader.decode(image, hints, true);
        }
        catch (ignored) {
            if (ignored instanceof FormatException || ignored instanceof ChecksumException) {
                throw NotFoundException.getNotFoundInstance();
            }
            throw ignored;
        }
    }
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
    static decode(image, hints, multiple) {
        const results = new Array();
        const detectorResult = Detector.detectMultiple(image, hints, multiple);
        for (const points of detectorResult.getPoints()) {
            const decoderResult = PDF417ScanningDecoder.decode(detectorResult.getBits(), points[4], points[5], points[6], points[7], PDF417Reader.getMinCodewordWidth(points), PDF417Reader.getMaxCodewordWidth(points));
            const result = new Result(decoderResult.getText(), decoderResult.getRawBytes(), undefined, points, BarcodeFormat.PDF_417);
            result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, decoderResult.getECLevel());
            const pdf417ResultMetadata = decoderResult.getOther();
            if (pdf417ResultMetadata != null) {
                result.putMetadata(ResultMetadataType.PDF417_EXTRA_METADATA, pdf417ResultMetadata);
            }
            results.push(result);
        }
        return results.map(x => x);
    }
    static getMaxWidth(p1, p2) {
        if (p1 == null || p2 == null) {
            return 0;
        }
        return Math.trunc(Math.abs(p1.getX() - p2.getX()));
    }
    static getMinWidth(p1, p2) {
        if (p1 == null || p2 == null) {
            return Integer.MAX_VALUE;
        }
        return Math.trunc(Math.abs(p1.getX() - p2.getX()));
    }
    static getMaxCodewordWidth(p) {
        return Math.floor(Math.max(Math.max(PDF417Reader.getMaxWidth(p[0], p[4]), PDF417Reader.getMaxWidth(p[6], p[2]) * PDF417Common.MODULES_IN_CODEWORD /
            PDF417Common.MODULES_IN_STOP_PATTERN), Math.max(PDF417Reader.getMaxWidth(p[1], p[5]), PDF417Reader.getMaxWidth(p[7], p[3]) * PDF417Common.MODULES_IN_CODEWORD /
            PDF417Common.MODULES_IN_STOP_PATTERN)));
    }
    static getMinCodewordWidth(p) {
        return Math.floor(Math.min(Math.min(PDF417Reader.getMinWidth(p[0], p[4]), PDF417Reader.getMinWidth(p[6], p[2]) * PDF417Common.MODULES_IN_CODEWORD /
            PDF417Common.MODULES_IN_STOP_PATTERN), Math.min(PDF417Reader.getMinWidth(p[1], p[5]), PDF417Reader.getMinWidth(p[7], p[3]) * PDF417Common.MODULES_IN_CODEWORD /
            PDF417Common.MODULES_IN_STOP_PATTERN)));
    }
    // @Override
    reset() {
        // nothing needs to be reset
    }
}
