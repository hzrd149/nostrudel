"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Point = void 0;
var ResultPoint_1 = require("../../ResultPoint");
var AztecDetectorResult_1 = require("../AztecDetectorResult");
var MathUtils_1 = require("../../common/detector/MathUtils");
var WhiteRectangleDetector_1 = require("../../common/detector/WhiteRectangleDetector");
var GenericGF_1 = require("../../common/reedsolomon/GenericGF");
var ReedSolomonDecoder_1 = require("../../common/reedsolomon/ReedSolomonDecoder");
var NotFoundException_1 = require("../../NotFoundException");
var GridSamplerInstance_1 = require("../../common/GridSamplerInstance");
var Integer_1 = require("../../util/Integer");
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.toResultPoint = function () {
        return new ResultPoint_1.default(this.getX(), this.getY());
    };
    Point.prototype.getX = function () {
        return this.x;
    };
    Point.prototype.getY = function () {
        return this.y;
    };
    return Point;
}());
exports.Point = Point;
/**
 * Encapsulates logic that can detect an Aztec Code in an image, even if the Aztec Code
 * is rotated or skewed, or partially obscured.
 *
 * @author David Olivier
 * @author Frank Yellin
 */
var Detector = /** @class */ (function () {
    function Detector(image) {
        this.EXPECTED_CORNER_BITS = new Int32Array([
            0xee0,
            0x1dc,
            0x83b,
            0x707,
        ]);
        this.image = image;
    }
    Detector.prototype.detect = function () {
        return this.detectMirror(false);
    };
    /**
     * Detects an Aztec Code in an image.
     *
     * @param isMirror if true, image is a mirror-image of original
     * @return {@link AztecDetectorResult} encapsulating results of detecting an Aztec Code
     * @throws NotFoundException if no Aztec Code can be found
     */
    Detector.prototype.detectMirror = function (isMirror) {
        // 1. Get the center of the aztec matrix
        var pCenter = this.getMatrixCenter();
        // 2. Get the center points of the four diagonal points just outside the bull's eye
        //  [topRight, bottomRight, bottomLeft, topLeft]
        var bullsEyeCorners = this.getBullsEyeCorners(pCenter);
        if (isMirror) {
            var temp = bullsEyeCorners[0];
            bullsEyeCorners[0] = bullsEyeCorners[2];
            bullsEyeCorners[2] = temp;
        }
        // 3. Get the size of the matrix and other parameters from the bull's eye
        this.extractParameters(bullsEyeCorners);
        // 4. Sample the grid
        var bits = this.sampleGrid(this.image, bullsEyeCorners[this.shift % 4], bullsEyeCorners[(this.shift + 1) % 4], bullsEyeCorners[(this.shift + 2) % 4], bullsEyeCorners[(this.shift + 3) % 4]);
        // 5. Get the corners of the matrix.
        var corners = this.getMatrixCornerPoints(bullsEyeCorners);
        return new AztecDetectorResult_1.default(bits, corners, this.compact, this.nbDataBlocks, this.nbLayers);
    };
    /**
     * Extracts the number of data layers and data blocks from the layer around the bull's eye.
     *
     * @param bullsEyeCorners the array of bull's eye corners
     * @throws NotFoundException in case of too many errors or invalid parameters
     */
    Detector.prototype.extractParameters = function (bullsEyeCorners) {
        if (!this.isValidPoint(bullsEyeCorners[0]) || !this.isValidPoint(bullsEyeCorners[1]) ||
            !this.isValidPoint(bullsEyeCorners[2]) || !this.isValidPoint(bullsEyeCorners[3])) {
            throw new NotFoundException_1.default();
        }
        var length = 2 * this.nbCenterLayers;
        // Get the bits around the bull's eye
        var sides = new Int32Array([
            this.sampleLine(bullsEyeCorners[0], bullsEyeCorners[1], length),
            this.sampleLine(bullsEyeCorners[1], bullsEyeCorners[2], length),
            this.sampleLine(bullsEyeCorners[2], bullsEyeCorners[3], length),
            this.sampleLine(bullsEyeCorners[3], bullsEyeCorners[0], length) // Top
        ]);
        // bullsEyeCorners[shift] is the corner of the bulls'eye that has three
        // orientation marks.
        // sides[shift] is the row/column that goes from the corner with three
        // orientation marks to the corner with two.
        this.shift = this.getRotation(sides, length);
        // Flatten the parameter bits into a single 28- or 40-bit long
        var parameterData = 0;
        for (var i = 0; i < 4; i++) {
            var side = sides[(this.shift + i) % 4];
            if (this.compact) {
                // Each side of the form ..XXXXXXX. where Xs are parameter data
                parameterData <<= 7;
                parameterData += (side >> 1) & 0x7F;
            }
            else {
                // Each side of the form ..XXXXX.XXXXX. where Xs are parameter data
                parameterData <<= 10;
                parameterData += ((side >> 2) & (0x1f << 5)) + ((side >> 1) & 0x1F);
            }
        }
        // Corrects parameter data using RS.  Returns just the data portion
        // without the error correction.
        var correctedData = this.getCorrectedParameterData(parameterData, this.compact);
        if (this.compact) {
            // 8 bits:  2 bits layers and 6 bits data blocks
            this.nbLayers = (correctedData >> 6) + 1;
            this.nbDataBlocks = (correctedData & 0x3F) + 1;
        }
        else {
            // 16 bits:  5 bits layers and 11 bits data blocks
            this.nbLayers = (correctedData >> 11) + 1;
            this.nbDataBlocks = (correctedData & 0x7FF) + 1;
        }
    };
    Detector.prototype.getRotation = function (sides, length) {
        // In a normal pattern, we expect to See
        //   **    .*             D       A
        //   *      *
        //
        //   .      *
        //   ..    ..             C       B
        //
        // Grab the 3 bits from each of the sides the form the locator pattern and concatenate
        // into a 12-bit integer.  Start with the bit at A
        var cornerBits = 0;
        sides.forEach(function (side, idx, arr) {
            // XX......X where X's are orientation marks
            var t = ((side >> (length - 2)) << 1) + (side & 1);
            cornerBits = (cornerBits << 3) + t;
        });
        // for (var side in sides) {
        //     // XX......X where X's are orientation marks
        //     var t = ((side >> (length - 2)) << 1) + (side & 1);
        //     cornerBits = (cornerBits << 3) + t;
        // }
        // Mov the bottom bit to the top, so that the three bits of the locator pattern at A are
        // together.  cornerBits is now:
        //  3 orientation bits at A || 3 orientation bits at B || ... || 3 orientation bits at D
        cornerBits = ((cornerBits & 1) << 11) + (cornerBits >> 1);
        // The result shift indicates which element of BullsEyeCorners[] goes into the top-left
        // corner. Since the four rotation values have a Hamming distance of 8, we
        // can easily tolerate two errors.
        for (var shift = 0; shift < 4; shift++) {
            if (Integer_1.default.bitCount(cornerBits ^ this.EXPECTED_CORNER_BITS[shift]) <= 2) {
                return shift;
            }
        }
        throw new NotFoundException_1.default();
    };
    /**
     * Corrects the parameter bits using Reed-Solomon algorithm.
     *
     * @param parameterData parameter bits
     * @param compact true if this is a compact Aztec code
     * @throws NotFoundException if the array contains too many errors
     */
    Detector.prototype.getCorrectedParameterData = function (parameterData, compact) {
        var numCodewords;
        var numDataCodewords;
        if (compact) {
            numCodewords = 7;
            numDataCodewords = 2;
        }
        else {
            numCodewords = 10;
            numDataCodewords = 4;
        }
        var numECCodewords = numCodewords - numDataCodewords;
        var parameterWords = new Int32Array(numCodewords);
        for (var i = numCodewords - 1; i >= 0; --i) {
            parameterWords[i] = parameterData & 0xF;
            parameterData >>= 4;
        }
        try {
            var rsDecoder = new ReedSolomonDecoder_1.default(GenericGF_1.default.AZTEC_PARAM);
            rsDecoder.decode(parameterWords, numECCodewords);
        }
        catch (ignored) {
            throw new NotFoundException_1.default();
        }
        // Toss the error correction.  Just return the data as an integer
        var result = 0;
        for (var i = 0; i < numDataCodewords; i++) {
            result = (result << 4) + parameterWords[i];
        }
        return result;
    };
    /**
     * Finds the corners of a bull-eye centered on the passed point.
     * This returns the centers of the diagonal points just outside the bull's eye
     * Returns [topRight, bottomRight, bottomLeft, topLeft]
     *
     * @param pCenter Center point
     * @return The corners of the bull-eye
     * @throws NotFoundException If no valid bull-eye can be found
     */
    Detector.prototype.getBullsEyeCorners = function (pCenter) {
        var pina = pCenter;
        var pinb = pCenter;
        var pinc = pCenter;
        var pind = pCenter;
        var color = true;
        for (this.nbCenterLayers = 1; this.nbCenterLayers < 9; this.nbCenterLayers++) {
            var pouta = this.getFirstDifferent(pina, color, 1, -1);
            var poutb = this.getFirstDifferent(pinb, color, 1, 1);
            var poutc = this.getFirstDifferent(pinc, color, -1, 1);
            var poutd = this.getFirstDifferent(pind, color, -1, -1);
            // d      a
            //
            // c      b
            if (this.nbCenterLayers > 2) {
                var q = (this.distancePoint(poutd, pouta) * this.nbCenterLayers) / (this.distancePoint(pind, pina) * (this.nbCenterLayers + 2));
                if (q < 0.75 || q > 1.25 || !this.isWhiteOrBlackRectangle(pouta, poutb, poutc, poutd)) {
                    break;
                }
            }
            pina = pouta;
            pinb = poutb;
            pinc = poutc;
            pind = poutd;
            color = !color;
        }
        if (this.nbCenterLayers !== 5 && this.nbCenterLayers !== 7) {
            throw new NotFoundException_1.default();
        }
        this.compact = this.nbCenterLayers === 5;
        // Expand the square by .5 pixel in each direction so that we're on the border
        // between the white square and the black square
        var pinax = new ResultPoint_1.default(pina.getX() + 0.5, pina.getY() - 0.5);
        var pinbx = new ResultPoint_1.default(pinb.getX() + 0.5, pinb.getY() + 0.5);
        var pincx = new ResultPoint_1.default(pinc.getX() - 0.5, pinc.getY() + 0.5);
        var pindx = new ResultPoint_1.default(pind.getX() - 0.5, pind.getY() - 0.5);
        // Expand the square so that its corners are the centers of the points
        // just outside the bull's eye.
        return this.expandSquare([pinax, pinbx, pincx, pindx], 2 * this.nbCenterLayers - 3, 2 * this.nbCenterLayers);
    };
    /**
     * Finds a candidate center point of an Aztec code from an image
     *
     * @return the center point
     */
    Detector.prototype.getMatrixCenter = function () {
        var pointA;
        var pointB;
        var pointC;
        var pointD;
        // Get a white rectangle that can be the border of the matrix in center bull's eye or
        try {
            var cornerPoints = new WhiteRectangleDetector_1.default(this.image).detect();
            pointA = cornerPoints[0];
            pointB = cornerPoints[1];
            pointC = cornerPoints[2];
            pointD = cornerPoints[3];
        }
        catch (e) {
            // This exception can be in case the initial rectangle is white
            // In that case, surely in the bull's eye, we try to expand the rectangle.
            var cx_1 = this.image.getWidth() / 2;
            var cy_1 = this.image.getHeight() / 2;
            pointA = this.getFirstDifferent(new Point(cx_1 + 7, cy_1 - 7), false, 1, -1).toResultPoint();
            pointB = this.getFirstDifferent(new Point(cx_1 + 7, cy_1 + 7), false, 1, 1).toResultPoint();
            pointC = this.getFirstDifferent(new Point(cx_1 - 7, cy_1 + 7), false, -1, 1).toResultPoint();
            pointD = this.getFirstDifferent(new Point(cx_1 - 7, cy_1 - 7), false, -1, -1).toResultPoint();
        }
        // Compute the center of the rectangle
        var cx = MathUtils_1.default.round((pointA.getX() + pointD.getX() + pointB.getX() + pointC.getX()) / 4.0);
        var cy = MathUtils_1.default.round((pointA.getY() + pointD.getY() + pointB.getY() + pointC.getY()) / 4.0);
        // Redetermine the white rectangle starting from previously computed center.
        // This will ensure that we end up with a white rectangle in center bull's eye
        // in order to compute a more accurate center.
        try {
            var cornerPoints = new WhiteRectangleDetector_1.default(this.image, 15, cx, cy).detect();
            pointA = cornerPoints[0];
            pointB = cornerPoints[1];
            pointC = cornerPoints[2];
            pointD = cornerPoints[3];
        }
        catch (e) {
            // This exception can be in case the initial rectangle is white
            // In that case we try to expand the rectangle.
            pointA = this.getFirstDifferent(new Point(cx + 7, cy - 7), false, 1, -1).toResultPoint();
            pointB = this.getFirstDifferent(new Point(cx + 7, cy + 7), false, 1, 1).toResultPoint();
            pointC = this.getFirstDifferent(new Point(cx - 7, cy + 7), false, -1, 1).toResultPoint();
            pointD = this.getFirstDifferent(new Point(cx - 7, cy - 7), false, -1, -1).toResultPoint();
        }
        // Recompute the center of the rectangle
        cx = MathUtils_1.default.round((pointA.getX() + pointD.getX() + pointB.getX() + pointC.getX()) / 4.0);
        cy = MathUtils_1.default.round((pointA.getY() + pointD.getY() + pointB.getY() + pointC.getY()) / 4.0);
        return new Point(cx, cy);
    };
    /**
     * Gets the Aztec code corners from the bull's eye corners and the parameters.
     *
     * @param bullsEyeCorners the array of bull's eye corners
     * @return the array of aztec code corners
     */
    Detector.prototype.getMatrixCornerPoints = function (bullsEyeCorners) {
        return this.expandSquare(bullsEyeCorners, 2 * this.nbCenterLayers, this.getDimension());
    };
    /**
     * Creates a BitMatrix by sampling the provided image.
     * topLeft, topRight, bottomRight, and bottomLeft are the centers of the squares on the
     * diagonal just outside the bull's eye.
     */
    Detector.prototype.sampleGrid = function (image, topLeft, topRight, bottomRight, bottomLeft) {
        var sampler = GridSamplerInstance_1.default.getInstance();
        var dimension = this.getDimension();
        var low = dimension / 2 - this.nbCenterLayers;
        var high = dimension / 2 + this.nbCenterLayers;
        return sampler.sampleGrid(image, dimension, dimension, low, low, // topleft
        high, low, // topright
        high, high, // bottomright
        low, high, // bottomleft
        topLeft.getX(), topLeft.getY(), topRight.getX(), topRight.getY(), bottomRight.getX(), bottomRight.getY(), bottomLeft.getX(), bottomLeft.getY());
    };
    /**
     * Samples a line.
     *
     * @param p1   start point (inclusive)
     * @param p2   end point (exclusive)
     * @param size number of bits
     * @return the array of bits as an int (first bit is high-order bit of result)
     */
    Detector.prototype.sampleLine = function (p1, p2, size) {
        var result = 0;
        var d = this.distanceResultPoint(p1, p2);
        var moduleSize = d / size;
        var px = p1.getX();
        var py = p1.getY();
        var dx = moduleSize * (p2.getX() - p1.getX()) / d;
        var dy = moduleSize * (p2.getY() - p1.getY()) / d;
        for (var i = 0; i < size; i++) {
            if (this.image.get(MathUtils_1.default.round(px + i * dx), MathUtils_1.default.round(py + i * dy))) {
                result |= 1 << (size - i - 1);
            }
        }
        return result;
    };
    /**
     * @return true if the border of the rectangle passed in parameter is compound of white points only
     *         or black points only
     */
    Detector.prototype.isWhiteOrBlackRectangle = function (p1, p2, p3, p4) {
        var corr = 3;
        p1 = new Point(p1.getX() - corr, p1.getY() + corr);
        p2 = new Point(p2.getX() - corr, p2.getY() - corr);
        p3 = new Point(p3.getX() + corr, p3.getY() - corr);
        p4 = new Point(p4.getX() + corr, p4.getY() + corr);
        var cInit = this.getColor(p4, p1);
        if (cInit === 0) {
            return false;
        }
        var c = this.getColor(p1, p2);
        if (c !== cInit) {
            return false;
        }
        c = this.getColor(p2, p3);
        if (c !== cInit) {
            return false;
        }
        c = this.getColor(p3, p4);
        return c === cInit;
    };
    /**
     * Gets the color of a segment
     *
     * @return 1 if segment more than 90% black, -1 if segment is more than 90% white, 0 else
     */
    Detector.prototype.getColor = function (p1, p2) {
        var d = this.distancePoint(p1, p2);
        var dx = (p2.getX() - p1.getX()) / d;
        var dy = (p2.getY() - p1.getY()) / d;
        var error = 0;
        var px = p1.getX();
        var py = p1.getY();
        var colorModel = this.image.get(p1.getX(), p1.getY());
        var iMax = Math.ceil(d);
        for (var i = 0; i < iMax; i++) {
            px += dx;
            py += dy;
            if (this.image.get(MathUtils_1.default.round(px), MathUtils_1.default.round(py)) !== colorModel) {
                error++;
            }
        }
        var errRatio = error / d;
        if (errRatio > 0.1 && errRatio < 0.9) {
            return 0;
        }
        return (errRatio <= 0.1) === colorModel ? 1 : -1;
    };
    /**
     * Gets the coordinate of the first point with a different color in the given direction
     */
    Detector.prototype.getFirstDifferent = function (init, color, dx, dy) {
        var x = init.getX() + dx;
        var y = init.getY() + dy;
        while (this.isValid(x, y) && this.image.get(x, y) === color) {
            x += dx;
            y += dy;
        }
        x -= dx;
        y -= dy;
        while (this.isValid(x, y) && this.image.get(x, y) === color) {
            x += dx;
        }
        x -= dx;
        while (this.isValid(x, y) && this.image.get(x, y) === color) {
            y += dy;
        }
        y -= dy;
        return new Point(x, y);
    };
    /**
     * Expand the square represented by the corner points by pushing out equally in all directions
     *
     * @param cornerPoints the corners of the square, which has the bull's eye at its center
     * @param oldSide the original length of the side of the square in the target bit matrix
     * @param newSide the new length of the size of the square in the target bit matrix
     * @return the corners of the expanded square
     */
    Detector.prototype.expandSquare = function (cornerPoints, oldSide, newSide) {
        var ratio = newSide / (2.0 * oldSide);
        var dx = cornerPoints[0].getX() - cornerPoints[2].getX();
        var dy = cornerPoints[0].getY() - cornerPoints[2].getY();
        var centerx = (cornerPoints[0].getX() + cornerPoints[2].getX()) / 2.0;
        var centery = (cornerPoints[0].getY() + cornerPoints[2].getY()) / 2.0;
        var result0 = new ResultPoint_1.default(centerx + ratio * dx, centery + ratio * dy);
        var result2 = new ResultPoint_1.default(centerx - ratio * dx, centery - ratio * dy);
        dx = cornerPoints[1].getX() - cornerPoints[3].getX();
        dy = cornerPoints[1].getY() - cornerPoints[3].getY();
        centerx = (cornerPoints[1].getX() + cornerPoints[3].getX()) / 2.0;
        centery = (cornerPoints[1].getY() + cornerPoints[3].getY()) / 2.0;
        var result1 = new ResultPoint_1.default(centerx + ratio * dx, centery + ratio * dy);
        var result3 = new ResultPoint_1.default(centerx - ratio * dx, centery - ratio * dy);
        var results = [result0, result1, result2, result3];
        return results;
    };
    Detector.prototype.isValid = function (x, y) {
        return x >= 0 && x < this.image.getWidth() && y > 0 && y < this.image.getHeight();
    };
    Detector.prototype.isValidPoint = function (point) {
        var x = MathUtils_1.default.round(point.getX());
        var y = MathUtils_1.default.round(point.getY());
        return this.isValid(x, y);
    };
    Detector.prototype.distancePoint = function (a, b) {
        return MathUtils_1.default.distance(a.getX(), a.getY(), b.getX(), b.getY());
    };
    Detector.prototype.distanceResultPoint = function (a, b) {
        return MathUtils_1.default.distance(a.getX(), a.getY(), b.getX(), b.getY());
    };
    Detector.prototype.getDimension = function () {
        if (this.compact) {
            return 4 * this.nbLayers + 11;
        }
        if (this.nbLayers <= 4) {
            return 4 * this.nbLayers + 15;
        }
        return 4 * this.nbLayers + 2 * (Integer_1.default.truncDivision((this.nbLayers - 4), 8) + 1) + 15;
    };
    return Detector;
}());
exports.default = Detector;
