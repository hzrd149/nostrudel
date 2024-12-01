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
// package com.google.zxing.pdf417.decoder;
/**
 * @author Guenther Grau
 */
export default /*final*/ class Codeword {
    constructor(startX, endX, bucket, value) {
        this.rowNumber = Codeword.BARCODE_ROW_UNKNOWN;
        this.startX = Math.trunc(startX);
        this.endX = Math.trunc(endX);
        this.bucket = Math.trunc(bucket);
        this.value = Math.trunc(value);
    }
    hasValidRowNumber() {
        return this.isValidRowNumber(this.rowNumber);
    }
    isValidRowNumber(rowNumber) {
        return rowNumber !== Codeword.BARCODE_ROW_UNKNOWN && this.bucket === (rowNumber % 3) * 3;
    }
    setRowNumberAsRowIndicatorColumn() {
        this.rowNumber = Math.trunc((Math.trunc(this.value / 30)) * 3 + Math.trunc(this.bucket / 3));
    }
    getWidth() {
        return this.endX - this.startX;
    }
    getStartX() {
        return this.startX;
    }
    getEndX() {
        return this.endX;
    }
    getBucket() {
        return this.bucket;
    }
    getValue() {
        return this.value;
    }
    getRowNumber() {
        return this.rowNumber;
    }
    setRowNumber(rowNumber) {
        this.rowNumber = rowNumber;
    }
    //   @Override
    toString() {
        return this.rowNumber + '|' + this.value;
    }
}
Codeword.BARCODE_ROW_UNKNOWN = -1;
