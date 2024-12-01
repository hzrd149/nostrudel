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
import OneDReader from './OneDReader';
import NotFoundException from '../NotFoundException';
import FormatException from '../FormatException';
/**
 * <p>Encapsulates functionality and implementation that is common to UPC and EAN families
 * of one-dimensional barcodes.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
export default class AbstractUPCEANReader extends OneDReader {
    constructor() {
        super(...arguments);
        this.decodeRowStringBuffer = '';
    }
    // private final UPCEANExtensionSupport extensionReader;
    // private final EANManufacturerOrgSupport eanManSupport;
    /*
    protected UPCEANReader() {
        decodeRowStringBuffer = new StringBuilder(20);
        extensionReader = new UPCEANExtensionSupport();
        eanManSupport = new EANManufacturerOrgSupport();
    }
    */
    static findStartGuardPattern(row) {
        let foundStart = false;
        let startRange;
        let nextStart = 0;
        let counters = Int32Array.from([0, 0, 0]);
        while (!foundStart) {
            counters = Int32Array.from([0, 0, 0]);
            startRange = AbstractUPCEANReader.findGuardPattern(row, nextStart, false, this.START_END_PATTERN, counters);
            let start = startRange[0];
            nextStart = startRange[1];
            let quietStart = start - (nextStart - start);
            if (quietStart >= 0) {
                foundStart = row.isRange(quietStart, start, false);
            }
        }
        return startRange;
    }
    static checkChecksum(s) {
        return AbstractUPCEANReader.checkStandardUPCEANChecksum(s);
    }
    static checkStandardUPCEANChecksum(s) {
        let length = s.length;
        if (length === 0)
            return false;
        let check = parseInt(s.charAt(length - 1), 10);
        return AbstractUPCEANReader.getStandardUPCEANChecksum(s.substring(0, length - 1)) === check;
    }
    static getStandardUPCEANChecksum(s) {
        let length = s.length;
        let sum = 0;
        for (let i = length - 1; i >= 0; i -= 2) {
            let digit = s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
            if (digit < 0 || digit > 9) {
                throw new FormatException();
            }
            sum += digit;
        }
        sum *= 3;
        for (let i = length - 2; i >= 0; i -= 2) {
            let digit = s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
            if (digit < 0 || digit > 9) {
                throw new FormatException();
            }
            sum += digit;
        }
        return (1000 - sum) % 10;
    }
    static decodeEnd(row, endStart) {
        return AbstractUPCEANReader.findGuardPattern(row, endStart, false, AbstractUPCEANReader.START_END_PATTERN, new Int32Array(AbstractUPCEANReader.START_END_PATTERN.length).fill(0));
    }
    /**
     * @throws NotFoundException
     */
    static findGuardPatternWithoutCounters(row, rowOffset, whiteFirst, pattern) {
        return this.findGuardPattern(row, rowOffset, whiteFirst, pattern, new Int32Array(pattern.length));
    }
    /**
     * @param row row of black/white values to search
     * @param rowOffset position to start search
     * @param whiteFirst if true, indicates that the pattern specifies white/black/white/...
     * pixel counts, otherwise, it is interpreted as black/white/black/...
     * @param pattern pattern of counts of number of black and white pixels that are being
     * searched for as a pattern
     * @param counters array of counters, as long as pattern, to re-use
     * @return start/end horizontal offset of guard pattern, as an array of two ints
     * @throws NotFoundException if pattern is not found
     */
    static findGuardPattern(row, rowOffset, whiteFirst, pattern, counters) {
        let width = row.getSize();
        rowOffset = whiteFirst ? row.getNextUnset(rowOffset) : row.getNextSet(rowOffset);
        let counterPosition = 0;
        let patternStart = rowOffset;
        let patternLength = pattern.length;
        let isWhite = whiteFirst;
        for (let x = rowOffset; x < width; x++) {
            if (row.get(x) !== isWhite) {
                counters[counterPosition]++;
            }
            else {
                if (counterPosition === patternLength - 1) {
                    if (OneDReader.patternMatchVariance(counters, pattern, AbstractUPCEANReader.MAX_INDIVIDUAL_VARIANCE) < AbstractUPCEANReader.MAX_AVG_VARIANCE) {
                        return Int32Array.from([patternStart, x]);
                    }
                    patternStart += counters[0] + counters[1];
                    let slice = counters.slice(2, counters.length);
                    for (let i = 0; i < counterPosition - 1; i++) {
                        counters[i] = slice[i];
                    }
                    counters[counterPosition - 1] = 0;
                    counters[counterPosition] = 0;
                    counterPosition--;
                }
                else {
                    counterPosition++;
                }
                counters[counterPosition] = 1;
                isWhite = !isWhite;
            }
        }
        throw new NotFoundException();
    }
    static decodeDigit(row, counters, rowOffset, patterns) {
        this.recordPattern(row, rowOffset, counters);
        let bestVariance = this.MAX_AVG_VARIANCE;
        let bestMatch = -1;
        let max = patterns.length;
        for (let i = 0; i < max; i++) {
            let pattern = patterns[i];
            let variance = OneDReader.patternMatchVariance(counters, pattern, AbstractUPCEANReader.MAX_INDIVIDUAL_VARIANCE);
            if (variance < bestVariance) {
                bestVariance = variance;
                bestMatch = i;
            }
        }
        if (bestMatch >= 0) {
            return bestMatch;
        }
        else {
            throw new NotFoundException();
        }
    }
}
// These two values are critical for determining how permissive the decoding will be.
// We've arrived at these values through a lot of trial and error. Setting them any higher
// lets false positives creep in quickly.
AbstractUPCEANReader.MAX_AVG_VARIANCE = 0.48;
AbstractUPCEANReader.MAX_INDIVIDUAL_VARIANCE = 0.7;
/**
 * Start/end guard pattern.
 */
AbstractUPCEANReader.START_END_PATTERN = Int32Array.from([1, 1, 1]);
/**
 * Pattern marking the middle of a UPC/EAN pattern, separating the two halves.
 */
AbstractUPCEANReader.MIDDLE_PATTERN = Int32Array.from([1, 1, 1, 1, 1]);
/**
 * end guard pattern.
 */
AbstractUPCEANReader.END_PATTERN = Int32Array.from([1, 1, 1, 1, 1, 1]);
/**
 * "Odd", or "L" patterns used to encode UPC/EAN digits.
 */
AbstractUPCEANReader.L_PATTERNS = [
    Int32Array.from([3, 2, 1, 1]),
    Int32Array.from([2, 2, 2, 1]),
    Int32Array.from([2, 1, 2, 2]),
    Int32Array.from([1, 4, 1, 1]),
    Int32Array.from([1, 1, 3, 2]),
    Int32Array.from([1, 2, 3, 1]),
    Int32Array.from([1, 1, 1, 4]),
    Int32Array.from([1, 3, 1, 2]),
    Int32Array.from([1, 2, 1, 3]),
    Int32Array.from([3, 1, 1, 2]),
];
