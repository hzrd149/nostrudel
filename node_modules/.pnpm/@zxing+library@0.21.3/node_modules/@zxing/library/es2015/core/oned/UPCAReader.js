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
export default class UPCAReader extends UPCEANReader {
    constructor() {
        super(...arguments);
        this.ean13Reader = new EAN13Reader();
    }
    // @Override
    getBarcodeFormat() {
        return BarcodeFormat.UPC_A;
    }
    // Note that we don't try rotation without the try harder flag, even if rotation was supported.
    // @Override
    decode(image, hints) {
        return this.maybeReturnResult(this.ean13Reader.decode(image));
    }
    // @Override
    decodeRow(rowNumber, row, hints) {
        return this.maybeReturnResult(this.ean13Reader.decodeRow(rowNumber, row, hints));
    }
    // @Override
    decodeMiddle(row, startRange, resultString) {
        return this.ean13Reader.decodeMiddle(row, startRange, resultString);
    }
    maybeReturnResult(result) {
        let text = result.getText();
        if (text.charAt(0) === '0') {
            let upcaResult = new Result(text.substring(1), null, null, result.getResultPoints(), BarcodeFormat.UPC_A);
            if (result.getResultMetadata() != null) {
                upcaResult.putAllMetadata(result.getResultMetadata());
            }
            return upcaResult;
        }
        else {
            throw new NotFoundException();
        }
    }
    reset() {
        this.ean13Reader.reset();
    }
}
