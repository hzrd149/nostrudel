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
import System from './util/System';
import LuminanceSource from './LuminanceSource';
import InvertedLuminanceSource from './InvertedLuminanceSource';
import IllegalArgumentException from './IllegalArgumentException';
/**
 * This object extends LuminanceSource around an array of YUV data returned from the camera driver,
 * with the option to crop to a rectangle within the full data. This can be used to exclude
 * superfluous pixels around the perimeter and speed up decoding.
 *
 * It works for any pixel format where the Y channel is planar and appears first, including
 * YCbCr_420_SP and YCbCr_422_SP.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
export default class PlanarYUVLuminanceSource extends LuminanceSource {
    constructor(yuvData, dataWidth /*int*/, dataHeight /*int*/, left /*int*/, top /*int*/, width /*int*/, height /*int*/, reverseHorizontal) {
        super(width, height);
        this.yuvData = yuvData;
        this.dataWidth = dataWidth;
        this.dataHeight = dataHeight;
        this.left = left;
        this.top = top;
        if (left + width > dataWidth || top + height > dataHeight) {
            throw new IllegalArgumentException('Crop rectangle does not fit within image data.');
        }
        if (reverseHorizontal) {
            this.reverseHorizontal(width, height);
        }
    }
    /*@Override*/
    getRow(y /*int*/, row) {
        if (y < 0 || y >= this.getHeight()) {
            throw new IllegalArgumentException('Requested row is outside the image: ' + y);
        }
        const width = this.getWidth();
        if (row === null || row === undefined || row.length < width) {
            row = new Uint8ClampedArray(width);
        }
        const offset = (y + this.top) * this.dataWidth + this.left;
        System.arraycopy(this.yuvData, offset, row, 0, width);
        return row;
    }
    /*@Override*/
    getMatrix() {
        const width = this.getWidth();
        const height = this.getHeight();
        // If the caller asks for the entire underlying image, save the copy and give them the
        // original data. The docs specifically warn that result.length must be ignored.
        if (width === this.dataWidth && height === this.dataHeight) {
            return this.yuvData;
        }
        const area = width * height;
        const matrix = new Uint8ClampedArray(area);
        let inputOffset = this.top * this.dataWidth + this.left;
        // If the width matches the full width of the underlying data, perform a single copy.
        if (width === this.dataWidth) {
            System.arraycopy(this.yuvData, inputOffset, matrix, 0, area);
            return matrix;
        }
        // Otherwise copy one cropped row at a time.
        for (let y = 0; y < height; y++) {
            const outputOffset = y * width;
            System.arraycopy(this.yuvData, inputOffset, matrix, outputOffset, width);
            inputOffset += this.dataWidth;
        }
        return matrix;
    }
    /*@Override*/
    isCropSupported() {
        return true;
    }
    /*@Override*/
    crop(left /*int*/, top /*int*/, width /*int*/, height /*int*/) {
        return new PlanarYUVLuminanceSource(this.yuvData, this.dataWidth, this.dataHeight, this.left + left, this.top + top, width, height, false);
    }
    renderThumbnail() {
        const width = this.getWidth() / PlanarYUVLuminanceSource.THUMBNAIL_SCALE_FACTOR;
        const height = this.getHeight() / PlanarYUVLuminanceSource.THUMBNAIL_SCALE_FACTOR;
        const pixels = new Int32Array(width * height);
        const yuv = this.yuvData;
        let inputOffset = this.top * this.dataWidth + this.left;
        for (let y = 0; y < height; y++) {
            const outputOffset = y * width;
            for (let x = 0; x < width; x++) {
                const grey = yuv[inputOffset + x * PlanarYUVLuminanceSource.THUMBNAIL_SCALE_FACTOR] & 0xff;
                pixels[outputOffset + x] = 0xFF000000 | (grey * 0x00010101);
            }
            inputOffset += this.dataWidth * PlanarYUVLuminanceSource.THUMBNAIL_SCALE_FACTOR;
        }
        return pixels;
    }
    /**
     * @return width of image from {@link #renderThumbnail()}
     */
    getThumbnailWidth() {
        return this.getWidth() / PlanarYUVLuminanceSource.THUMBNAIL_SCALE_FACTOR;
    }
    /**
     * @return height of image from {@link #renderThumbnail()}
     */
    getThumbnailHeight() {
        return this.getHeight() / PlanarYUVLuminanceSource.THUMBNAIL_SCALE_FACTOR;
    }
    reverseHorizontal(width /*int*/, height /*int*/) {
        const yuvData = this.yuvData;
        for (let y = 0, rowStart = this.top * this.dataWidth + this.left; y < height; y++, rowStart += this.dataWidth) {
            const middle = rowStart + width / 2;
            for (let x1 = rowStart, x2 = rowStart + width - 1; x1 < middle; x1++, x2--) {
                const temp = yuvData[x1];
                yuvData[x1] = yuvData[x2];
                yuvData[x2] = temp;
            }
        }
    }
    invert() {
        return new InvertedLuminanceSource(this);
    }
}
PlanarYUVLuminanceSource.THUMBNAIL_SCALE_FACTOR = 2;
