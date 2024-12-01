/*
 * Copyright 2007 ZXing authors
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
/*namespace com.google.zxing.common {*/
/**
 * <p>This class implements a perspective transform in two dimensions. Given four source and four
 * destination points, it will compute the transformation implied between them. The code is based
 * directly upon section 3.4.2 of George Wolberg's "Digital Image Warping"; see pages 54-56.</p>
 *
 * @author Sean Owen
 */
export default class PerspectiveTransform {
    constructor(a11 /*float*/, a21 /*float*/, a31 /*float*/, a12 /*float*/, a22 /*float*/, a32 /*float*/, a13 /*float*/, a23 /*float*/, a33 /*float*/) {
        this.a11 = a11;
        this.a21 = a21;
        this.a31 = a31;
        this.a12 = a12;
        this.a22 = a22;
        this.a32 = a32;
        this.a13 = a13;
        this.a23 = a23;
        this.a33 = a33;
    }
    static quadrilateralToQuadrilateral(x0 /*float*/, y0 /*float*/, x1 /*float*/, y1 /*float*/, x2 /*float*/, y2 /*float*/, x3 /*float*/, y3 /*float*/, x0p /*float*/, y0p /*float*/, x1p /*float*/, y1p /*float*/, x2p /*float*/, y2p /*float*/, x3p /*float*/, y3p /*float*/) {
        const qToS = PerspectiveTransform.quadrilateralToSquare(x0, y0, x1, y1, x2, y2, x3, y3);
        const sToQ = PerspectiveTransform.squareToQuadrilateral(x0p, y0p, x1p, y1p, x2p, y2p, x3p, y3p);
        return sToQ.times(qToS);
    }
    transformPoints(points) {
        const max = points.length;
        const a11 = this.a11;
        const a12 = this.a12;
        const a13 = this.a13;
        const a21 = this.a21;
        const a22 = this.a22;
        const a23 = this.a23;
        const a31 = this.a31;
        const a32 = this.a32;
        const a33 = this.a33;
        for (let i = 0; i < max; i += 2) {
            const x = points[i];
            const y = points[i + 1];
            const denominator = a13 * x + a23 * y + a33;
            points[i] = (a11 * x + a21 * y + a31) / denominator;
            points[i + 1] = (a12 * x + a22 * y + a32) / denominator;
        }
    }
    transformPointsWithValues(xValues, yValues) {
        const a11 = this.a11;
        const a12 = this.a12;
        const a13 = this.a13;
        const a21 = this.a21;
        const a22 = this.a22;
        const a23 = this.a23;
        const a31 = this.a31;
        const a32 = this.a32;
        const a33 = this.a33;
        const n = xValues.length;
        for (let i = 0; i < n; i++) {
            const x = xValues[i];
            const y = yValues[i];
            const denominator = a13 * x + a23 * y + a33;
            xValues[i] = (a11 * x + a21 * y + a31) / denominator;
            yValues[i] = (a12 * x + a22 * y + a32) / denominator;
        }
    }
    static squareToQuadrilateral(x0 /*float*/, y0 /*float*/, x1 /*float*/, y1 /*float*/, x2 /*float*/, y2 /*float*/, x3 /*float*/, y3 /*float*/) {
        const dx3 = x0 - x1 + x2 - x3;
        const dy3 = y0 - y1 + y2 - y3;
        if (dx3 === 0.0 && dy3 === 0.0) {
            // Affine
            return new PerspectiveTransform(x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0.0, 0.0, 1.0);
        }
        else {
            const dx1 = x1 - x2;
            const dx2 = x3 - x2;
            const dy1 = y1 - y2;
            const dy2 = y3 - y2;
            const denominator = dx1 * dy2 - dx2 * dy1;
            const a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
            const a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
            return new PerspectiveTransform(x1 - x0 + a13 * x1, x3 - x0 + a23 * x3, x0, y1 - y0 + a13 * y1, y3 - y0 + a23 * y3, y0, a13, a23, 1.0);
        }
    }
    static quadrilateralToSquare(x0 /*float*/, y0 /*float*/, x1 /*float*/, y1 /*float*/, x2 /*float*/, y2 /*float*/, x3 /*float*/, y3 /*float*/) {
        // Here, the adjoint serves as the inverse:
        return PerspectiveTransform.squareToQuadrilateral(x0, y0, x1, y1, x2, y2, x3, y3).buildAdjoint();
    }
    buildAdjoint() {
        // Adjoint is the transpose of the cofactor matrix:
        return new PerspectiveTransform(this.a22 * this.a33 - this.a23 * this.a32, this.a23 * this.a31 - this.a21 * this.a33, this.a21 * this.a32 - this.a22 * this.a31, this.a13 * this.a32 - this.a12 * this.a33, this.a11 * this.a33 - this.a13 * this.a31, this.a12 * this.a31 - this.a11 * this.a32, this.a12 * this.a23 - this.a13 * this.a22, this.a13 * this.a21 - this.a11 * this.a23, this.a11 * this.a22 - this.a12 * this.a21);
    }
    times(other) {
        return new PerspectiveTransform(this.a11 * other.a11 + this.a21 * other.a12 + this.a31 * other.a13, this.a11 * other.a21 + this.a21 * other.a22 + this.a31 * other.a23, this.a11 * other.a31 + this.a21 * other.a32 + this.a31 * other.a33, this.a12 * other.a11 + this.a22 * other.a12 + this.a32 * other.a13, this.a12 * other.a21 + this.a22 * other.a22 + this.a32 * other.a23, this.a12 * other.a31 + this.a22 * other.a32 + this.a32 * other.a33, this.a13 * other.a11 + this.a23 * other.a12 + this.a33 * other.a13, this.a13 * other.a21 + this.a23 * other.a22 + this.a33 * other.a23, this.a13 * other.a31 + this.a23 * other.a32 + this.a33 * other.a33);
    }
}
