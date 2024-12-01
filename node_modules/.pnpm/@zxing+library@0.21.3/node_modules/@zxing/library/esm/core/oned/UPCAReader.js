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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/*namespace com.google.zxing.oned {*/
import BarcodeFormat from '../BarcodeFormat';
import Result from '../Result';
import NotFoundException from '../NotFoundException';
import EAN13Reader from './EAN13Reader';
import UPCEANReader from './UPCEANReader';
/**
 * Encapsulates functionality and implementation that is common to all families
 * of one-dimensional barcodes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author sam2332 (Sam Rudloff)
 *
 * @source https://github.com/zxing/zxing/blob/3c96923276dd5785d58eb970b6ba3f80d36a9505/core/src/main/java/com/google/zxing/oned/UPCAReader.java
 *
 * @experimental
 */
var UPCAReader = /** @class */ (function (_super) {
    __extends(UPCAReader, _super);
    function UPCAReader() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ean13Reader = new EAN13Reader();
        return _this;
    }
    // @Override
    UPCAReader.prototype.getBarcodeFormat = function () {
        return BarcodeFormat.UPC_A;
    };
    // Note that we don't try rotation without the try harder flag, even if rotation was supported.
    // @Override
    UPCAReader.prototype.decode = function (image, hints) {
        return this.maybeReturnResult(this.ean13Reader.decode(image));
    };
    // @Override
    UPCAReader.prototype.decodeRow = function (rowNumber, row, hints) {
        return this.maybeReturnResult(this.ean13Reader.decodeRow(rowNumber, row, hints));
    };
    // @Override
    UPCAReader.prototype.decodeMiddle = function (row, startRange, resultString) {
        return this.ean13Reader.decodeMiddle(row, startRange, resultString);
    };
    UPCAReader.prototype.maybeReturnResult = function (result) {
        var text = result.getText();
        if (text.charAt(0) === '0') {
            var upcaResult = new Result(text.substring(1), null, null, result.getResultPoints(), BarcodeFormat.UPC_A);
            if (result.getResultMetadata() != null) {
                upcaResult.putAllMetadata(result.getResultMetadata());
            }
            return upcaResult;
        }
        else {
            throw new NotFoundException();
        }
    };
    UPCAReader.prototype.reset = function () {
        this.ean13Reader.reset();
    };
    return UPCAReader;
}(UPCEANReader));
export default UPCAReader;
