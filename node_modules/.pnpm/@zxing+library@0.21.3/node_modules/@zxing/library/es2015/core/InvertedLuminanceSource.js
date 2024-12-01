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
import LuminanceSource from './LuminanceSource';
/*namespace com.google.zxing {*/
/**
 * A wrapper implementation of {@link LuminanceSource} which inverts the luminances it returns -- black becomes
 * white and vice versa, and each value becomes (255-value).
 *
 * @author Sean Owen
 */
export default class InvertedLuminanceSource extends LuminanceSource {
    constructor(delegate) {
        super(delegate.getWidth(), delegate.getHeight());
        this.delegate = delegate;
    }
    /*@Override*/
    getRow(y /*int*/, row) {
        const sourceRow = this.delegate.getRow(y, row);
        const width = this.getWidth();
        for (let i = 0; i < width; i++) {
            sourceRow[i] = /*(byte)*/ (255 - (sourceRow[i] & 0xFF));
        }
        return sourceRow;
    }
    /*@Override*/
    getMatrix() {
        const matrix = this.delegate.getMatrix();
        const length = this.getWidth() * this.getHeight();
        const invertedMatrix = new Uint8ClampedArray(length);
        for (let i = 0; i < length; i++) {
            invertedMatrix[i] = /*(byte)*/ (255 - (matrix[i] & 0xFF));
        }
        return invertedMatrix;
    }
    /*@Override*/
    isCropSupported() {
        return this.delegate.isCropSupported();
    }
    /*@Override*/
    crop(left /*int*/, top /*int*/, width /*int*/, height /*int*/) {
        return new InvertedLuminanceSource(this.delegate.crop(left, top, width, height));
    }
    /*@Override*/
    isRotateSupported() {
        return this.delegate.isRotateSupported();
    }
    /**
     * @return original delegate {@link LuminanceSource} since invert undoes itself
     */
    /*@Override*/
    invert() {
        return this.delegate;
    }
    /*@Override*/
    rotateCounterClockwise() {
        return new InvertedLuminanceSource(this.delegate.rotateCounterClockwise());
    }
    /*@Override*/
    rotateCounterClockwise45() {
        return new InvertedLuminanceSource(this.delegate.rotateCounterClockwise45());
    }
}
