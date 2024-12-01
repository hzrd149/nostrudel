"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var BitArray_1 = require("../common/BitArray");
var DecodeHintType_1 = require("../DecodeHintType");
var ResultMetadataType_1 = require("../ResultMetadataType");
var ResultPoint_1 = require("../ResultPoint");
var NotFoundException_1 = require("../NotFoundException");
/**
 * Encapsulates functionality and implementation that is common to all families
 * of one-dimensional barcodes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 */
var OneDReader = /** @class */ (function () {
    function OneDReader() {
    }
    /*
    @Override
    public Result decode(BinaryBitmap image) throws NotFoundException, FormatException {
      return decode(image, null);
    }
    */
    // Note that we don't try rotation without the try harder flag, even if rotation was supported.
    // @Override
    OneDReader.prototype.decode = function (image, hints) {
        try {
            return this.doDecode(image, hints);
        }
        catch (nfe) {
            var tryHarder = hints && (hints.get(DecodeHintType_1.default.TRY_HARDER) === true);
            if (tryHarder && image.isRotateSupported()) {
                var rotatedImage = image.rotateCounterClockwise();
                var result = this.doDecode(rotatedImage, hints);
                // Record that we found it rotated 90 degrees CCW / 270 degrees CW
                var metadata = result.getResultMetadata();
                var orientation_1 = 270;
                if (metadata !== null && (metadata.get(ResultMetadataType_1.default.ORIENTATION) === true)) {
                    // But if we found it reversed in doDecode(), add in that result here:
                    orientation_1 = (orientation_1 + metadata.get(ResultMetadataType_1.default.ORIENTATION) % 360);
                }
                result.putMetadata(ResultMetadataType_1.default.ORIENTATION, orientation_1);
                // Update result points
                var points = result.getResultPoints();
                if (points !== null) {
                    var height = rotatedImage.getHeight();
                    for (var i = 0; i < points.length; i++) {
                        points[i] = new ResultPoint_1.default(height - points[i].getY() - 1, points[i].getX());
                    }
                }
                return result;
            }
            else {
                throw new NotFoundException_1.default();
            }
        }
    };
    // @Override
    OneDReader.prototype.reset = function () {
        // do nothing
    };
    /**
     * We're going to examine rows from the middle outward, searching alternately above and below the
     * middle, and farther out each time. rowStep is the number of rows between each successive
     * attempt above and below the middle. So we'd scan row middle, then middle - rowStep, then
     * middle + rowStep, then middle - (2 * rowStep), etc.
     * rowStep is bigger as the image is taller, but is always at least 1. We've somewhat arbitrarily
     * decided that moving up and down by about 1/16 of the image is pretty good; we try more of the
     * image if "trying harder".
     *
     * @param image The image to decode
     * @param hints Any hints that were requested
     * @return The contents of the decoded barcode
     * @throws NotFoundException Any spontaneous errors which occur
     */
    OneDReader.prototype.doDecode = function (image, hints) {
        var width = image.getWidth();
        var height = image.getHeight();
        var row = new BitArray_1.default(width);
        var tryHarder = hints && (hints.get(DecodeHintType_1.default.TRY_HARDER) === true);
        var rowStep = Math.max(1, height >> (tryHarder ? 8 : 5));
        var maxLines;
        if (tryHarder) {
            maxLines = height; // Look at the whole image, not just the center
        }
        else {
            maxLines = 15; // 15 rows spaced 1/32 apart is roughly the middle half of the image
        }
        var middle = Math.trunc(height / 2);
        for (var x = 0; x < maxLines; x++) {
            // Scanning from the middle out. Determine which row we're looking at next:
            var rowStepsAboveOrBelow = Math.trunc((x + 1) / 2);
            var isAbove = (x & 0x01) === 0; // i.e. is x even?
            var rowNumber = middle + rowStep * (isAbove ? rowStepsAboveOrBelow : -rowStepsAboveOrBelow);
            if (rowNumber < 0 || rowNumber >= height) {
                // Oops, if we run off the top or bottom, stop
                break;
            }
            // Estimate black point for this row and load it:
            try {
                row = image.getBlackRow(rowNumber, row);
            }
            catch (ignored) {
                continue;
            }
            var _loop_1 = function (attempt) {
                if (attempt === 1) { // trying again?
                    row.reverse(); // reverse the row and continue
                    // This means we will only ever draw result points *once* in the life of this method
                    // since we want to avoid drawing the wrong points after flipping the row, and,
                    // don't want to clutter with noise from every single row scan -- just the scans
                    // that start on the center line.
                    if (hints && (hints.get(DecodeHintType_1.default.NEED_RESULT_POINT_CALLBACK) === true)) {
                        var newHints_1 = new Map();
                        hints.forEach(function (hint, key) { return newHints_1.set(key, hint); });
                        newHints_1.delete(DecodeHintType_1.default.NEED_RESULT_POINT_CALLBACK);
                        hints = newHints_1;
                    }
                }
                try {
                    // Look for a barcode
                    var result = this_1.decodeRow(rowNumber, row, hints);
                    // We found our barcode
                    if (attempt === 1) {
                        // But it was upside down, so note that
                        result.putMetadata(ResultMetadataType_1.default.ORIENTATION, 180);
                        // And remember to flip the result points horizontally.
                        var points = result.getResultPoints();
                        if (points !== null) {
                            points[0] = new ResultPoint_1.default(width - points[0].getX() - 1, points[0].getY());
                            points[1] = new ResultPoint_1.default(width - points[1].getX() - 1, points[1].getY());
                        }
                    }
                    return { value: result };
                }
                catch (re) {
                    // continue -- just couldn't decode this row
                }
            };
            var this_1 = this;
            // While we have the image data in a BitArray, it's fairly cheap to reverse it in place to
            // handle decoding upside down barcodes.
            for (var attempt = 0; attempt < 2; attempt++) {
                var state_1 = _loop_1(attempt);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        }
        throw new NotFoundException_1.default();
    };
    /**
     * Records the size of successive runs of white and black pixels in a row, starting at a given point.
     * The values are recorded in the given array, and the number of runs recorded is equal to the size
     * of the array. If the row starts on a white pixel at the given start point, then the first count
     * recorded is the run of white pixels starting from that point; likewise it is the count of a run
     * of black pixels if the row begin on a black pixels at that point.
     *
     * @param row row to count from
     * @param start offset into row to start at
     * @param counters array into which to record counts
     * @throws NotFoundException if counters cannot be filled entirely from row before running out
     *  of pixels
     */
    OneDReader.recordPattern = function (row, start, counters) {
        var numCounters = counters.length;
        for (var index = 0; index < numCounters; index++)
            counters[index] = 0;
        var end = row.getSize();
        if (start >= end) {
            throw new NotFoundException_1.default();
        }
        var isWhite = !row.get(start);
        var counterPosition = 0;
        var i = start;
        while (i < end) {
            if (row.get(i) !== isWhite) {
                counters[counterPosition]++;
            }
            else {
                if (++counterPosition === numCounters) {
                    break;
                }
                else {
                    counters[counterPosition] = 1;
                    isWhite = !isWhite;
                }
            }
            i++;
        }
        // If we read fully the last section of pixels and filled up our counters -- or filled
        // the last counter but ran off the side of the image, OK. Otherwise, a problem.
        if (!(counterPosition === numCounters || (counterPosition === numCounters - 1 && i === end))) {
            throw new NotFoundException_1.default();
        }
    };
    OneDReader.recordPatternInReverse = function (row, start, counters) {
        // This could be more efficient I guess
        var numTransitionsLeft = counters.length;
        var last = row.get(start);
        while (start > 0 && numTransitionsLeft >= 0) {
            if (row.get(--start) !== last) {
                numTransitionsLeft--;
                last = !last;
            }
        }
        if (numTransitionsLeft >= 0) {
            throw new NotFoundException_1.default();
        }
        OneDReader.recordPattern(row, start + 1, counters);
    };
    /**
     * Determines how closely a set of observed counts of runs of black/white values matches a given
     * target pattern. This is reported as the ratio of the total variance from the expected pattern
     * proportions across all pattern elements, to the length of the pattern.
     *
     * @param counters observed counters
     * @param pattern expected pattern
     * @param maxIndividualVariance The most any counter can differ before we give up
     * @return ratio of total variance between counters and pattern compared to total pattern size
     */
    OneDReader.patternMatchVariance = function (counters, pattern, maxIndividualVariance) {
        var numCounters = counters.length;
        var total = 0;
        var patternLength = 0;
        for (var i = 0; i < numCounters; i++) {
            total += counters[i];
            patternLength += pattern[i];
        }
        if (total < patternLength) {
            // If we don't even have one pixel per unit of bar width, assume this is too small
            // to reliably match, so fail:
            return Number.POSITIVE_INFINITY;
        }
        var unitBarWidth = total / patternLength;
        maxIndividualVariance *= unitBarWidth;
        var totalVariance = 0.0;
        for (var x = 0; x < numCounters; x++) {
            var counter = counters[x];
            var scaledPattern = pattern[x] * unitBarWidth;
            var variance = counter > scaledPattern ? counter - scaledPattern : scaledPattern - counter;
            if (variance > maxIndividualVariance) {
                return Number.POSITIVE_INFINITY;
            }
            totalVariance += variance;
        }
        return totalVariance / total;
    };
    return OneDReader;
}());
exports.default = OneDReader;
