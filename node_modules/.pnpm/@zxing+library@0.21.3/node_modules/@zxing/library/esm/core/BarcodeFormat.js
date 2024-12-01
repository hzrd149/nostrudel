/*
 * Direct port to TypeScript of ZXing by Adrian Toșcă
 */
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
/*namespace com.google.zxing {*/
/**
 * Enumerates barcode formats known to this package. Please keep alphabetized.
 *
 * @author Sean Owen
 */
var BarcodeFormat;
(function (BarcodeFormat) {
    /** Aztec 2D barcode format. */
    BarcodeFormat[BarcodeFormat["AZTEC"] = 0] = "AZTEC";
    /** CODABAR 1D format. */
    BarcodeFormat[BarcodeFormat["CODABAR"] = 1] = "CODABAR";
    /** Code 39 1D format. */
    BarcodeFormat[BarcodeFormat["CODE_39"] = 2] = "CODE_39";
    /** Code 93 1D format. */
    BarcodeFormat[BarcodeFormat["CODE_93"] = 3] = "CODE_93";
    /** Code 128 1D format. */
    BarcodeFormat[BarcodeFormat["CODE_128"] = 4] = "CODE_128";
    /** Data Matrix 2D barcode format. */
    BarcodeFormat[BarcodeFormat["DATA_MATRIX"] = 5] = "DATA_MATRIX";
    /** EAN-8 1D format. */
    BarcodeFormat[BarcodeFormat["EAN_8"] = 6] = "EAN_8";
    /** EAN-13 1D format. */
    BarcodeFormat[BarcodeFormat["EAN_13"] = 7] = "EAN_13";
    /** ITF (Interleaved Two of Five) 1D format. */
    BarcodeFormat[BarcodeFormat["ITF"] = 8] = "ITF";
    /** MaxiCode 2D barcode format. */
    BarcodeFormat[BarcodeFormat["MAXICODE"] = 9] = "MAXICODE";
    /** PDF417 format. */
    BarcodeFormat[BarcodeFormat["PDF_417"] = 10] = "PDF_417";
    /** QR Code 2D barcode format. */
    BarcodeFormat[BarcodeFormat["QR_CODE"] = 11] = "QR_CODE";
    /** RSS 14 */
    BarcodeFormat[BarcodeFormat["RSS_14"] = 12] = "RSS_14";
    /** RSS EXPANDED */
    BarcodeFormat[BarcodeFormat["RSS_EXPANDED"] = 13] = "RSS_EXPANDED";
    /** UPC-A 1D format. */
    BarcodeFormat[BarcodeFormat["UPC_A"] = 14] = "UPC_A";
    /** UPC-E 1D format. */
    BarcodeFormat[BarcodeFormat["UPC_E"] = 15] = "UPC_E";
    /** UPC/EAN extension format. Not a stand-alone format. */
    BarcodeFormat[BarcodeFormat["UPC_EAN_EXTENSION"] = 16] = "UPC_EAN_EXTENSION";
})(BarcodeFormat || (BarcodeFormat = {}));
export default BarcodeFormat;
