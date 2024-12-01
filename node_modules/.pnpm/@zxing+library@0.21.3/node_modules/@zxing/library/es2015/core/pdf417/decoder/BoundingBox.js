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
// import com.google.zxing.NotFoundException;
import NotFoundException from '../../NotFoundException';
// import com.google.zxing.ResultPoint;
import ResultPoint from '../../ResultPoint';
/**
 * @author Guenther Grau
 */
export default /*final*/ class BoundingBox {
    constructor(image, topLeft, bottomLeft, topRight, bottomRight) {
        if (image instanceof BoundingBox) {
            this.constructor_2(image);
        }
        else {
            this.constructor_1(image, topLeft, bottomLeft, topRight, bottomRight);
        }
    }
    /**
     *
     * @param image
     * @param topLeft
     * @param bottomLeft
     * @param topRight
     * @param bottomRight
     *
     * @throws NotFoundException
     */
    constructor_1(image, topLeft, bottomLeft, topRight, bottomRight) {
        const leftUnspecified = topLeft == null || bottomLeft == null;
        const rightUnspecified = topRight == null || bottomRight == null;
        if (leftUnspecified && rightUnspecified) {
            throw new NotFoundException();
        }
        if (leftUnspecified) {
            topLeft = new ResultPoint(0, topRight.getY());
            bottomLeft = new ResultPoint(0, bottomRight.getY());
        }
        else if (rightUnspecified) {
            topRight = new ResultPoint(image.getWidth() - 1, topLeft.getY());
            bottomRight = new ResultPoint(image.getWidth() - 1, bottomLeft.getY());
        }
        this.image = image;
        this.topLeft = topLeft;
        this.bottomLeft = bottomLeft;
        this.topRight = topRight;
        this.bottomRight = bottomRight;
        this.minX = Math.trunc(Math.min(topLeft.getX(), bottomLeft.getX()));
        this.maxX = Math.trunc(Math.max(topRight.getX(), bottomRight.getX()));
        this.minY = Math.trunc(Math.min(topLeft.getY(), topRight.getY()));
        this.maxY = Math.trunc(Math.max(bottomLeft.getY(), bottomRight.getY()));
    }
    constructor_2(boundingBox) {
        this.image = boundingBox.image;
        this.topLeft = boundingBox.getTopLeft();
        this.bottomLeft = boundingBox.getBottomLeft();
        this.topRight = boundingBox.getTopRight();
        this.bottomRight = boundingBox.getBottomRight();
        this.minX = boundingBox.getMinX();
        this.maxX = boundingBox.getMaxX();
        this.minY = boundingBox.getMinY();
        this.maxY = boundingBox.getMaxY();
    }
    /**
     * @throws NotFoundException
     */
    static merge(leftBox, rightBox) {
        if (leftBox == null) {
            return rightBox;
        }
        if (rightBox == null) {
            return leftBox;
        }
        return new BoundingBox(leftBox.image, leftBox.topLeft, leftBox.bottomLeft, rightBox.topRight, rightBox.bottomRight);
    }
    /**
     * @throws NotFoundException
     */
    addMissingRows(missingStartRows, missingEndRows, isLeft) {
        let newTopLeft = this.topLeft;
        let newBottomLeft = this.bottomLeft;
        let newTopRight = this.topRight;
        let newBottomRight = this.bottomRight;
        if (missingStartRows > 0) {
            let top = isLeft ? this.topLeft : this.topRight;
            let newMinY = Math.trunc(top.getY() - missingStartRows);
            if (newMinY < 0) {
                newMinY = 0;
            }
            let newTop = new ResultPoint(top.getX(), newMinY);
            if (isLeft) {
                newTopLeft = newTop;
            }
            else {
                newTopRight = newTop;
            }
        }
        if (missingEndRows > 0) {
            let bottom = isLeft ? this.bottomLeft : this.bottomRight;
            let newMaxY = Math.trunc(bottom.getY() + missingEndRows);
            if (newMaxY >= this.image.getHeight()) {
                newMaxY = this.image.getHeight() - 1;
            }
            let newBottom = new ResultPoint(bottom.getX(), newMaxY);
            if (isLeft) {
                newBottomLeft = newBottom;
            }
            else {
                newBottomRight = newBottom;
            }
        }
        return new BoundingBox(this.image, newTopLeft, newBottomLeft, newTopRight, newBottomRight);
    }
    getMinX() {
        return this.minX;
    }
    getMaxX() {
        return this.maxX;
    }
    getMinY() {
        return this.minY;
    }
    getMaxY() {
        return this.maxY;
    }
    getTopLeft() {
        return this.topLeft;
    }
    getTopRight() {
        return this.topRight;
    }
    getBottomLeft() {
        return this.bottomLeft;
    }
    getBottomRight() {
        return this.bottomRight;
    }
}
