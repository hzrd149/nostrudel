/*
 * Copyright 2010 ZXing authors
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
/*namespace com.google.zxing.common.detector {*/
import ResultPoint from '../../ResultPoint';
import MathUtils from './MathUtils';
import NotFoundException from '../../NotFoundException';
/**
 * <p>
 * Detects a candidate barcode-like rectangular region within an image. It
 * starts around the center of the image, increases the size of the candidate
 * region until it finds a white rectangular region. By keeping track of the
 * last black points it encountered, it determines the corners of the barcode.
 * </p>
 *
 * @author David Olivier
 */
export default class WhiteRectangleDetector {
    // public constructor(private image: BitMatrix) /*throws NotFoundException*/ {
    //   this(image, INIT_SIZE, image.getWidth() / 2, image.getHeight() / 2)
    // }
    /**
     * @param image barcode image to find a rectangle in
     * @param initSize initial size of search area around center
     * @param x x position of search center
     * @param y y position of search center
     * @throws NotFoundException if image is too small to accommodate {@code initSize}
     */
    constructor(image, initSize /*int*/, x /*int*/, y /*int*/) {
        this.image = image;
        this.height = image.getHeight();
        this.width = image.getWidth();
        if (undefined === initSize || null === initSize) {
            initSize = WhiteRectangleDetector.INIT_SIZE;
        }
        if (undefined === x || null === x) {
            x = image.getWidth() / 2 | 0;
        }
        if (undefined === y || null === y) {
            y = image.getHeight() / 2 | 0;
        }
        const halfsize = initSize / 2 | 0;
        this.leftInit = x - halfsize;
        this.rightInit = x + halfsize;
        this.upInit = y - halfsize;
        this.downInit = y + halfsize;
        if (this.upInit < 0 || this.leftInit < 0 || this.downInit >= this.height || this.rightInit >= this.width) {
            throw new NotFoundException();
        }
    }
    /**
     * <p>
     * Detects a candidate barcode-like rectangular region within an image. It
     * starts around the center of the image, increases the size of the candidate
     * region until it finds a white rectangular region.
     * </p>
     *
     * @return {@link ResultPoint}[] describing the corners of the rectangular
     *         region. The first and last points are opposed on the diagonal, as
     *         are the second and third. The first point will be the topmost
     *         point and the last, the bottommost. The second point will be
     *         leftmost and the third, the rightmost
     * @throws NotFoundException if no Data Matrix Code can be found
     */
    detect() {
        let left = this.leftInit;
        let right = this.rightInit;
        let up = this.upInit;
        let down = this.downInit;
        let sizeExceeded = false;
        let aBlackPointFoundOnBorder = true;
        let atLeastOneBlackPointFoundOnBorder = false;
        let atLeastOneBlackPointFoundOnRight = false;
        let atLeastOneBlackPointFoundOnBottom = false;
        let atLeastOneBlackPointFoundOnLeft = false;
        let atLeastOneBlackPointFoundOnTop = false;
        const width = this.width;
        const height = this.height;
        while (aBlackPointFoundOnBorder) {
            aBlackPointFoundOnBorder = false;
            // .....
            // .   |
            // .....
            let rightBorderNotWhite = true;
            while ((rightBorderNotWhite || !atLeastOneBlackPointFoundOnRight) && right < width) {
                rightBorderNotWhite = this.containsBlackPoint(up, down, right, false);
                if (rightBorderNotWhite) {
                    right++;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnRight = true;
                }
                else if (!atLeastOneBlackPointFoundOnRight) {
                    right++;
                }
            }
            if (right >= width) {
                sizeExceeded = true;
                break;
            }
            // .....
            // .   .
            // .___.
            let bottomBorderNotWhite = true;
            while ((bottomBorderNotWhite || !atLeastOneBlackPointFoundOnBottom) && down < height) {
                bottomBorderNotWhite = this.containsBlackPoint(left, right, down, true);
                if (bottomBorderNotWhite) {
                    down++;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnBottom = true;
                }
                else if (!atLeastOneBlackPointFoundOnBottom) {
                    down++;
                }
            }
            if (down >= height) {
                sizeExceeded = true;
                break;
            }
            // .....
            // |   .
            // .....
            let leftBorderNotWhite = true;
            while ((leftBorderNotWhite || !atLeastOneBlackPointFoundOnLeft) && left >= 0) {
                leftBorderNotWhite = this.containsBlackPoint(up, down, left, false);
                if (leftBorderNotWhite) {
                    left--;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnLeft = true;
                }
                else if (!atLeastOneBlackPointFoundOnLeft) {
                    left--;
                }
            }
            if (left < 0) {
                sizeExceeded = true;
                break;
            }
            // .___.
            // .   .
            // .....
            let topBorderNotWhite = true;
            while ((topBorderNotWhite || !atLeastOneBlackPointFoundOnTop) && up >= 0) {
                topBorderNotWhite = this.containsBlackPoint(left, right, up, true);
                if (topBorderNotWhite) {
                    up--;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnTop = true;
                }
                else if (!atLeastOneBlackPointFoundOnTop) {
                    up--;
                }
            }
            if (up < 0) {
                sizeExceeded = true;
                break;
            }
            if (aBlackPointFoundOnBorder) {
                atLeastOneBlackPointFoundOnBorder = true;
            }
        }
        if (!sizeExceeded && atLeastOneBlackPointFoundOnBorder) {
            const maxSize = right - left;
            let z = null;
            for (let i = 1; z === null && i < maxSize; i++) {
                z = this.getBlackPointOnSegment(left, down - i, left + i, down);
            }
            if (z == null) {
                throw new NotFoundException();
            }
            let t = null;
            // go down right
            for (let i = 1; t === null && i < maxSize; i++) {
                t = this.getBlackPointOnSegment(left, up + i, left + i, up);
            }
            if (t == null) {
                throw new NotFoundException();
            }
            let x = null;
            // go down left
            for (let i = 1; x === null && i < maxSize; i++) {
                x = this.getBlackPointOnSegment(right, up + i, right - i, up);
            }
            if (x == null) {
                throw new NotFoundException();
            }
            let y = null;
            // go up left
            for (let i = 1; y === null && i < maxSize; i++) {
                y = this.getBlackPointOnSegment(right, down - i, right - i, down);
            }
            if (y == null) {
                throw new NotFoundException();
            }
            return this.centerEdges(y, z, x, t);
        }
        else {
            throw new NotFoundException();
        }
    }
    getBlackPointOnSegment(aX /*float*/, aY /*float*/, bX /*float*/, bY /*float*/) {
        const dist = MathUtils.round(MathUtils.distance(aX, aY, bX, bY));
        const xStep = (bX - aX) / dist;
        const yStep = (bY - aY) / dist;
        const image = this.image;
        for (let i = 0; i < dist; i++) {
            const x = MathUtils.round(aX + i * xStep);
            const y = MathUtils.round(aY + i * yStep);
            if (image.get(x, y)) {
                return new ResultPoint(x, y);
            }
        }
        return null;
    }
    /**
     * recenters the points of a constant distance towards the center
     *
     * @param y bottom most point
     * @param z left most point
     * @param x right most point
     * @param t top most point
     * @return {@link ResultPoint}[] describing the corners of the rectangular
     *         region. The first and last points are opposed on the diagonal, as
     *         are the second and third. The first point will be the topmost
     *         point and the last, the bottommost. The second point will be
     *         leftmost and the third, the rightmost
     */
    centerEdges(y, z, x, t) {
        //
        //       t            t
        //  z                      x
        //        x    OR    z
        //   y                    y
        //
        const yi = y.getX();
        const yj = y.getY();
        const zi = z.getX();
        const zj = z.getY();
        const xi = x.getX();
        const xj = x.getY();
        const ti = t.getX();
        const tj = t.getY();
        const CORR = WhiteRectangleDetector.CORR;
        if (yi < this.width / 2.0) {
            return [
                new ResultPoint(ti - CORR, tj + CORR),
                new ResultPoint(zi + CORR, zj + CORR),
                new ResultPoint(xi - CORR, xj - CORR),
                new ResultPoint(yi + CORR, yj - CORR)
            ];
        }
        else {
            return [
                new ResultPoint(ti + CORR, tj + CORR),
                new ResultPoint(zi + CORR, zj - CORR),
                new ResultPoint(xi - CORR, xj + CORR),
                new ResultPoint(yi - CORR, yj - CORR)
            ];
        }
    }
    /**
     * Determines whether a segment contains a black point
     *
     * @param a          min value of the scanned coordinate
     * @param b          max value of the scanned coordinate
     * @param fixed      value of fixed coordinate
     * @param horizontal set to true if scan must be horizontal, false if vertical
     * @return true if a black point has been found, else false.
     */
    containsBlackPoint(a /*int*/, b /*int*/, fixed /*int*/, horizontal) {
        const image = this.image;
        if (horizontal) {
            for (let x = a; x <= b; x++) {
                if (image.get(x, fixed)) {
                    return true;
                }
            }
        }
        else {
            for (let y = a; y <= b; y++) {
                if (image.get(fixed, y)) {
                    return true;
                }
            }
        }
        return false;
    }
}
WhiteRectangleDetector.INIT_SIZE = 10;
WhiteRectangleDetector.CORR = 1;
