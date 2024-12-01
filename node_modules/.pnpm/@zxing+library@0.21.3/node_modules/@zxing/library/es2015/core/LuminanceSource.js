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
import StringBuilder from './util/StringBuilder';
import UnsupportedOperationException from './UnsupportedOperationException';
/*namespace com.google.zxing {*/
/**
 * The purpose of this class hierarchy is to abstract different bitmap implementations across
 * platforms into a standard interface for requesting greyscale luminance values. The interface
 * only provides immutable methods; therefore crop and rotation create copies. This is to ensure
 * that one Reader does not modify the original luminance source and leave it in an unknown state
 * for other Readers in the chain.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
class LuminanceSource {
    constructor(width /*int*/, height /*int*/) {
        this.width = width;
        this.height = height;
    }
    /**
     * @return The width of the bitmap.
     */
    getWidth() {
        return this.width;
    }
    /**
     * @return The height of the bitmap.
     */
    getHeight() {
        return this.height;
    }
    /**
     * @return Whether this subclass supports cropping.
     */
    isCropSupported() {
        return false;
    }
    /**
     * Returns a new object with cropped image data. Implementations may keep a reference to the
     * original data rather than a copy. Only callable if isCropSupported() is true.
     *
     * @param left The left coordinate, which must be in [0,getWidth())
     * @param top The top coordinate, which must be in [0,getHeight())
     * @param width The width of the rectangle to crop.
     * @param height The height of the rectangle to crop.
     * @return A cropped version of this object.
     */
    crop(left /*int*/, top /*int*/, width /*int*/, height /*int*/) {
        throw new UnsupportedOperationException('This luminance source does not support cropping.');
    }
    /**
     * @return Whether this subclass supports counter-clockwise rotation.
     */
    isRotateSupported() {
        return false;
    }
    /**
     * Returns a new object with rotated image data by 90 degrees counterclockwise.
     * Only callable if {@link #isRotateSupported()} is true.
     *
     * @return A rotated version of this object.
     */
    rotateCounterClockwise() {
        throw new UnsupportedOperationException('This luminance source does not support rotation by 90 degrees.');
    }
    /**
     * Returns a new object with rotated image data by 45 degrees counterclockwise.
     * Only callable if {@link #isRotateSupported()} is true.
     *
     * @return A rotated version of this object.
     */
    rotateCounterClockwise45() {
        throw new UnsupportedOperationException('This luminance source does not support rotation by 45 degrees.');
    }
    /*@Override*/
    toString() {
        const row = new Uint8ClampedArray(this.width);
        let result = new StringBuilder();
        for (let y = 0; y < this.height; y++) {
            const sourceRow = this.getRow(y, row);
            for (let x = 0; x < this.width; x++) {
                const luminance = sourceRow[x] & 0xFF;
                let c;
                if (luminance < 0x40) {
                    c = '#';
                }
                else if (luminance < 0x80) {
                    c = '+';
                }
                else if (luminance < 0xC0) {
                    c = '.';
                }
                else {
                    c = ' ';
                }
                result.append(c);
            }
            result.append('\n');
        }
        return result.toString();
    }
}
export default LuminanceSource;
