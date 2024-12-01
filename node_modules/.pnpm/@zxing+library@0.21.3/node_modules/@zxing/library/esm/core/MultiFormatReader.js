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
import DecodeHintType from './DecodeHintType';
import BarcodeFormat from './BarcodeFormat';
import QRCodeReader from './qrcode/QRCodeReader';
import AztecReader from './aztec/AztecReader';
import MultiFormatOneDReader from './oned/MultiFormatOneDReader';
import DataMatrixReader from './datamatrix/DataMatrixReader';
import NotFoundException from './NotFoundException';
import PDF417Reader from './pdf417/PDF417Reader';
import ReaderException from './ReaderException';
/*namespace com.google.zxing {*/
/**
 * MultiFormatReader is a convenience class and the main entry point into the library for most uses.
 * By default it attempts to decode all barcode formats that the library supports. Optionally, you
 * can provide a hints object to request different behavior, for example only decoding QR codes.
 *
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */
var MultiFormatReader = /** @class */ (function () {
    function MultiFormatReader() {
    }
    /**
     * This version of decode honors the intent of Reader.decode(BinaryBitmap) in that it
     * passes null as a hint to the decoders. However, that makes it inefficient to call repeatedly.
     * Use setHints() followed by decodeWithState() for continuous scan applications.
     *
     * @param image The pixel data to decode
     * @return The contents of the image
     *
     * @throws NotFoundException Any errors which occurred
     */
    /*@Override*/
    // public decode(image: BinaryBitmap): Result {
    //   setHints(null)
    //   return decodeInternal(image)
    // }
    /**
     * Decode an image using the hints provided. Does not honor existing state.
     *
     * @param image The pixel data to decode
     * @param hints The hints to use, clearing the previous state.
     * @return The contents of the image
     *
     * @throws NotFoundException Any errors which occurred
     */
    /*@Override*/
    MultiFormatReader.prototype.decode = function (image, hints) {
        this.setHints(hints);
        return this.decodeInternal(image);
    };
    /**
     * Decode an image using the state set up by calling setHints() previously. Continuous scan
     * clients will get a <b>large</b> speed increase by using this instead of decode().
     *
     * @param image The pixel data to decode
     * @return The contents of the image
     *
     * @throws NotFoundException Any errors which occurred
     */
    MultiFormatReader.prototype.decodeWithState = function (image) {
        // Make sure to set up the default state so we don't crash
        if (this.readers === null || this.readers === undefined) {
            this.setHints(null);
        }
        return this.decodeInternal(image);
    };
    /**
     * This method adds state to the MultiFormatReader. By setting the hints once, subsequent calls
     * to decodeWithState(image) can reuse the same set of readers without reallocating memory. This
     * is important for performance in continuous scan clients.
     *
     * @param hints The set of hints to use for subsequent calls to decode(image)
     */
    MultiFormatReader.prototype.setHints = function (hints) {
        this.hints = hints;
        var tryHarder = hints !== null && hints !== undefined && undefined !== hints.get(DecodeHintType.TRY_HARDER);
        /*@SuppressWarnings("unchecked")*/
        var formats = hints === null || hints === undefined ? null : hints.get(DecodeHintType.POSSIBLE_FORMATS);
        var readers = new Array();
        if (formats !== null && formats !== undefined) {
            var addOneDReader = formats.some(function (f) {
                return f === BarcodeFormat.UPC_A ||
                    f === BarcodeFormat.UPC_E ||
                    f === BarcodeFormat.EAN_13 ||
                    f === BarcodeFormat.EAN_8 ||
                    f === BarcodeFormat.CODABAR ||
                    f === BarcodeFormat.CODE_39 ||
                    f === BarcodeFormat.CODE_93 ||
                    f === BarcodeFormat.CODE_128 ||
                    f === BarcodeFormat.ITF ||
                    f === BarcodeFormat.RSS_14 ||
                    f === BarcodeFormat.RSS_EXPANDED;
            });
            // Put 1D readers upfront in "normal" mode
            // TYPESCRIPTPORT: TODO: uncomment below as they are ported
            if (addOneDReader && !tryHarder) {
                readers.push(new MultiFormatOneDReader(hints));
            }
            if (formats.includes(BarcodeFormat.QR_CODE)) {
                readers.push(new QRCodeReader());
            }
            if (formats.includes(BarcodeFormat.DATA_MATRIX)) {
                readers.push(new DataMatrixReader());
            }
            if (formats.includes(BarcodeFormat.AZTEC)) {
                readers.push(new AztecReader());
            }
            if (formats.includes(BarcodeFormat.PDF_417)) {
                readers.push(new PDF417Reader());
            }
            // if (formats.includes(BarcodeFormat.MAXICODE)) {
            //    readers.push(new MaxiCodeReader())
            // }
            // At end in "try harder" mode
            if (addOneDReader && tryHarder) {
                readers.push(new MultiFormatOneDReader(hints));
            }
        }
        if (readers.length === 0) {
            if (!tryHarder) {
                readers.push(new MultiFormatOneDReader(hints));
            }
            readers.push(new QRCodeReader());
            readers.push(new DataMatrixReader());
            readers.push(new AztecReader());
            readers.push(new PDF417Reader());
            // readers.push(new MaxiCodeReader())
            if (tryHarder) {
                readers.push(new MultiFormatOneDReader(hints));
            }
        }
        this.readers = readers; // .toArray(new Reader[readers.size()])
    };
    /*@Override*/
    MultiFormatReader.prototype.reset = function () {
        var e_1, _a;
        if (this.readers !== null) {
            try {
                for (var _b = __values(this.readers), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var reader = _c.value;
                    reader.reset();
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    /**
     * @throws NotFoundException
     */
    MultiFormatReader.prototype.decodeInternal = function (image) {
        var e_2, _a;
        if (this.readers === null) {
            throw new ReaderException('No readers where selected, nothing can be read.');
        }
        try {
            for (var _b = __values(this.readers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var reader = _c.value;
                // Trying to decode with ${reader} reader.
                try {
                    return reader.decode(image, this.hints);
                }
                catch (ex) {
                    if (ex instanceof ReaderException) {
                        continue;
                    }
                    // Bad Exception.
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        throw new NotFoundException('No MultiFormat Readers were able to detect the code.');
    };
    return MultiFormatReader;
}());
export default MultiFormatReader;
