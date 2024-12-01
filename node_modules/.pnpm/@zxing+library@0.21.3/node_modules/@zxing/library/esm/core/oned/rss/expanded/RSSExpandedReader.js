var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import BarcodeFormat from '../../../BarcodeFormat';
import MathUtils from '../../../common/detector/MathUtils';
// import FormatException from '../../../FormatException';
import NotFoundException from '../../../NotFoundException';
import Result from '../../../Result';
import System from '../../../util/System';
import AbstractRSSReader from '../../rss/AbstractRSSReader';
import DataCharacter from '../../rss/DataCharacter';
import FinderPattern from '../../rss/FinderPattern';
import RSSUtils from '../../rss/RSSUtils';
import BitArrayBuilder from './BitArrayBuilder';
import { createDecoder } from './decoders/AbstractExpandedDecoderComplement';
import ExpandedPair from './ExpandedPair';
import ExpandedRow from './ExpandedRow';
// import java.util.ArrayList;
// import java.util.Iterator;
// import java.util.List;
// import java.util.Map;
// import java.util.Collections;
/** @experimental */
var RSSExpandedReader = /** @class */ (function (_super) {
    __extends(RSSExpandedReader, _super);
    function RSSExpandedReader() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.pairs = new Array(RSSExpandedReader.MAX_PAIRS);
        _this.rows = new Array();
        _this.startEnd = [2];
        return _this;
    }
    RSSExpandedReader.prototype.decodeRow = function (rowNumber, row, hints) {
        // Rows can start with even pattern in case in prev rows there where odd number of patters.
        // So lets try twice
        // this.pairs.clear();
        this.pairs.length = 0;
        this.startFromEven = false;
        try {
            return RSSExpandedReader.constructResult(this.decodeRow2pairs(rowNumber, row));
        }
        catch (e) {
            // OK
            // console.log(e);
        }
        this.pairs.length = 0;
        this.startFromEven = true;
        return RSSExpandedReader.constructResult(this.decodeRow2pairs(rowNumber, row));
    };
    RSSExpandedReader.prototype.reset = function () {
        this.pairs.length = 0;
        this.rows.length = 0;
    };
    // Not private for testing
    RSSExpandedReader.prototype.decodeRow2pairs = function (rowNumber, row) {
        var done = false;
        while (!done) {
            try {
                this.pairs.push(this.retrieveNextPair(row, this.pairs, rowNumber));
            }
            catch (error) {
                if (error instanceof NotFoundException) {
                    if (!this.pairs.length) {
                        throw new NotFoundException();
                    }
                    // exit this loop when retrieveNextPair() fails and throws
                    done = true;
                }
            }
        }
        // TODO: verify sequence of finder patterns as in checkPairSequence()
        if (this.checkChecksum()) {
            return this.pairs;
        }
        var tryStackedDecode;
        if (this.rows.length) {
            tryStackedDecode = true;
        }
        else {
            tryStackedDecode = false;
        }
        // let tryStackedDecode = !this.rows.isEmpty();
        this.storeRow(rowNumber, false); // TODO: deal with reversed rows
        if (tryStackedDecode) {
            // When the image is 180-rotated, then rows are sorted in wrong direction.
            // Try twice with both the directions.
            var ps = this.checkRowsBoolean(false);
            if (ps != null) {
                return ps;
            }
            ps = this.checkRowsBoolean(true);
            if (ps != null) {
                return ps;
            }
        }
        throw new NotFoundException();
    };
    // Need to Verify
    RSSExpandedReader.prototype.checkRowsBoolean = function (reverse) {
        // Limit number of rows we are checking
        // We use recursive algorithm with pure complexity and don't want it to take forever
        // Stacked barcode can have up to 11 rows, so 25 seems reasonable enough
        if (this.rows.length > 25) {
            this.rows.length = 0; // We will never have a chance to get result, so clear it
            return null;
        }
        this.pairs.length = 0;
        if (reverse) {
            this.rows = this.rows.reverse();
            // Collections.reverse(this.rows);
        }
        var ps = null;
        try {
            ps = this.checkRows(new Array(), 0);
        }
        catch (e) {
            // OK
            console.log(e);
        }
        if (reverse) {
            this.rows = this.rows.reverse();
            // Collections.reverse(this.rows);
        }
        return ps;
    };
    // Try to construct a valid rows sequence
    // Recursion is used to implement backtracking
    RSSExpandedReader.prototype.checkRows = function (collectedRows, currentRow) {
        var e_1, _a;
        for (var i = currentRow; i < this.rows.length; i++) {
            var row = this.rows[i];
            this.pairs.length = 0;
            try {
                for (var collectedRows_1 = (e_1 = void 0, __values(collectedRows)), collectedRows_1_1 = collectedRows_1.next(); !collectedRows_1_1.done; collectedRows_1_1 = collectedRows_1.next()) {
                    var collectedRow = collectedRows_1_1.value;
                    this.pairs.push(collectedRow.getPairs());
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (collectedRows_1_1 && !collectedRows_1_1.done && (_a = collectedRows_1.return)) _a.call(collectedRows_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.pairs.push(row.getPairs());
            if (!RSSExpandedReader.isValidSequence(this.pairs)) {
                continue;
            }
            if (this.checkChecksum()) {
                return this.pairs;
            }
            var rs = new Array(collectedRows);
            rs.push(row);
            try {
                // Recursion: try to add more rows
                return this.checkRows(rs, i + 1);
            }
            catch (e) {
                // We failed, try the next candidate
                console.log(e);
            }
        }
        throw new NotFoundException();
    };
    // Whether the pairs form a valid find pattern sequence,
    // either complete or a prefix
    RSSExpandedReader.isValidSequence = function (pairs) {
        var e_2, _a;
        try {
            for (var _b = __values(RSSExpandedReader.FINDER_PATTERN_SEQUENCES), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sequence = _c.value;
                if (pairs.length > sequence.length) {
                    continue;
                }
                var stop_1 = true;
                for (var j = 0; j < pairs.length; j++) {
                    if (pairs[j].getFinderPattern().getValue() !== sequence[j]) {
                        stop_1 = false;
                        break;
                    }
                }
                if (stop_1) {
                    return true;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return false;
    };
    RSSExpandedReader.prototype.storeRow = function (rowNumber, wasReversed) {
        // Discard if duplicate above or below; otherwise insert in order by row number.
        var insertPos = 0;
        var prevIsSame = false;
        var nextIsSame = false;
        while (insertPos < this.rows.length) {
            var erow = this.rows[insertPos];
            if (erow.getRowNumber() > rowNumber) {
                nextIsSame = erow.isEquivalent(this.pairs);
                break;
            }
            prevIsSame = erow.isEquivalent(this.pairs);
            insertPos++;
        }
        if (nextIsSame || prevIsSame) {
            return;
        }
        // When the row was partially decoded (e.g. 2 pairs found instead of 3),
        // it will prevent us from detecting the barcode.
        // Try to merge partial rows
        // Check whether the row is part of an allready detected row
        if (RSSExpandedReader.isPartialRow(this.pairs, this.rows)) {
            return;
        }
        this.rows.push(insertPos, new ExpandedRow(this.pairs, rowNumber, wasReversed));
        this.removePartialRows(this.pairs, this.rows);
    };
    // Remove all the rows that contains only specified pairs
    RSSExpandedReader.prototype.removePartialRows = function (pairs, rows) {
        var e_3, _a, e_4, _b, e_5, _c;
        try {
            // for (Iterator<ExpandedRow> iterator = rows.iterator(); iterator.hasNext();) {
            //   ExpandedRow r = iterator.next();
            //   if (r.getPairs().size() == pairs.size()) {
            //     continue;
            //   }
            //   boolean allFound = true;
            //   for (ExpandedPair p : r.getPairs()) {
            //     boolean found = false;
            //     for (ExpandedPair pp : pairs) {
            //       if (p.equals(pp)) {
            //         found = true;
            //         break;
            //       }
            //     }
            //     if (!found) {
            //       allFound = false;
            //       break;
            //     }
            //   }
            //   if (allFound) {
            //     // 'pairs' contains all the pairs from the row 'r'
            //     iterator.remove();
            //   }
            // }
            for (var rows_1 = __values(rows), rows_1_1 = rows_1.next(); !rows_1_1.done; rows_1_1 = rows_1.next()) {
                var row = rows_1_1.value;
                if (row.getPairs().length === pairs.length) {
                    continue;
                }
                var allFound = true;
                try {
                    for (var _d = (e_4 = void 0, __values(row.getPairs())), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var p = _e.value;
                        var found = false;
                        try {
                            for (var pairs_1 = (e_5 = void 0, __values(pairs)), pairs_1_1 = pairs_1.next(); !pairs_1_1.done; pairs_1_1 = pairs_1.next()) {
                                var pp = pairs_1_1.value;
                                if (ExpandedPair.equals(p, pp)) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (pairs_1_1 && !pairs_1_1.done && (_c = pairs_1.return)) _c.call(pairs_1);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        if (!found) {
                            allFound = false;
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (rows_1_1 && !rows_1_1.done && (_a = rows_1.return)) _a.call(rows_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    // Returns true when one of the rows already contains all the pairs
    RSSExpandedReader.isPartialRow = function (pairs, rows) {
        var e_6, _a, e_7, _b, e_8, _c;
        try {
            for (var rows_2 = __values(rows), rows_2_1 = rows_2.next(); !rows_2_1.done; rows_2_1 = rows_2.next()) {
                var r = rows_2_1.value;
                var allFound = true;
                try {
                    for (var pairs_2 = (e_7 = void 0, __values(pairs)), pairs_2_1 = pairs_2.next(); !pairs_2_1.done; pairs_2_1 = pairs_2.next()) {
                        var p = pairs_2_1.value;
                        var found = false;
                        try {
                            for (var _d = (e_8 = void 0, __values(r.getPairs())), _e = _d.next(); !_e.done; _e = _d.next()) {
                                var pp = _e.value;
                                if (p.equals(pp)) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        catch (e_8_1) { e_8 = { error: e_8_1 }; }
                        finally {
                            try {
                                if (_e && !_e.done && (_c = _d.return)) _c.call(_d);
                            }
                            finally { if (e_8) throw e_8.error; }
                        }
                        if (!found) {
                            allFound = false;
                            break;
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (pairs_2_1 && !pairs_2_1.done && (_b = pairs_2.return)) _b.call(pairs_2);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
                if (allFound) {
                    // the row 'r' contain all the pairs from 'pairs'
                    return true;
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (rows_2_1 && !rows_2_1.done && (_a = rows_2.return)) _a.call(rows_2);
            }
            finally { if (e_6) throw e_6.error; }
        }
        return false;
    };
    // Only used for unit testing
    RSSExpandedReader.prototype.getRows = function () {
        return this.rows;
    };
    // Not private for unit testing
    RSSExpandedReader.constructResult = function (pairs) {
        var binary = BitArrayBuilder.buildBitArray(pairs);
        var decoder = createDecoder(binary);
        var resultingString = decoder.parseInformation();
        var firstPoints = pairs[0].getFinderPattern().getResultPoints();
        var lastPoints = pairs[pairs.length - 1]
            .getFinderPattern()
            .getResultPoints();
        var points = [firstPoints[0], firstPoints[1], lastPoints[0], lastPoints[1]];
        return new Result(resultingString, null, null, points, BarcodeFormat.RSS_EXPANDED, null);
    };
    RSSExpandedReader.prototype.checkChecksum = function () {
        var firstPair = this.pairs.get(0);
        var checkCharacter = firstPair.getLeftChar();
        var firstCharacter = firstPair.getRightChar();
        if (firstCharacter === null) {
            return false;
        }
        var checksum = firstCharacter.getChecksumPortion();
        var s = 2;
        for (var i = 1; i < this.pairs.size(); ++i) {
            var currentPair = this.pairs.get(i);
            checksum += currentPair.getLeftChar().getChecksumPortion();
            s++;
            var currentRightChar = currentPair.getRightChar();
            if (currentRightChar != null) {
                checksum += currentRightChar.getChecksumPortion();
                s++;
            }
        }
        checksum %= 211;
        var checkCharacterValue = 211 * (s - 4) + checksum;
        return checkCharacterValue === checkCharacter.getValue();
    };
    RSSExpandedReader.getNextSecondBar = function (row, initialPos) {
        var currentPos;
        if (row.get(initialPos)) {
            currentPos = row.getNextUnset(initialPos);
            currentPos = row.getNextSet(currentPos);
        }
        else {
            currentPos = row.getNextSet(initialPos);
            currentPos = row.getNextUnset(currentPos);
        }
        return currentPos;
    };
    // not private for testing
    RSSExpandedReader.prototype.retrieveNextPair = function (row, previousPairs, rowNumber) {
        var isOddPattern = previousPairs.length % 2 === 0;
        if (this.startFromEven) {
            isOddPattern = !isOddPattern;
        }
        var pattern;
        var keepFinding = true;
        var forcedOffset = -1;
        do {
            this.findNextPair(row, previousPairs, forcedOffset);
            pattern = this.parseFoundFinderPattern(row, rowNumber, isOddPattern);
            if (pattern === null) {
                forcedOffset = RSSExpandedReader.getNextSecondBar(row, this.startEnd[0]);
            }
            else {
                keepFinding = false;
            }
        } while (keepFinding);
        // When stacked symbol is split over multiple rows, there's no way to guess if this pair can be last or not.
        // boolean mayBeLast = checkPairSequence(previousPairs, pattern);
        var leftChar = this.decodeDataCharacter(row, pattern, isOddPattern, true);
        if (!this.isEmptyPair(previousPairs) &&
            previousPairs[previousPairs.length - 1].mustBeLast()) {
            throw new NotFoundException();
        }
        var rightChar;
        try {
            rightChar = this.decodeDataCharacter(row, pattern, isOddPattern, false);
        }
        catch (e) {
            rightChar = null;
            console.log(e);
        }
        return new ExpandedPair(leftChar, rightChar, pattern, true);
    };
    RSSExpandedReader.prototype.isEmptyPair = function (pairs) {
        if (pairs.length === 0) {
            return true;
        }
        return false;
    };
    RSSExpandedReader.prototype.findNextPair = function (row, previousPairs, forcedOffset) {
        var counters = this.getDecodeFinderCounters();
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        var width = row.getSize();
        var rowOffset;
        if (forcedOffset >= 0) {
            rowOffset = forcedOffset;
        }
        else if (this.isEmptyPair(previousPairs)) {
            rowOffset = 0;
        }
        else {
            var lastPair = previousPairs[previousPairs.length - 1];
            rowOffset = lastPair.getFinderPattern().getStartEnd()[1];
        }
        var searchingEvenPair = previousPairs.length % 2 !== 0;
        if (this.startFromEven) {
            searchingEvenPair = !searchingEvenPair;
        }
        var isWhite = false;
        while (rowOffset < width) {
            isWhite = !row.get(rowOffset);
            if (!isWhite) {
                break;
            }
            rowOffset++;
        }
        var counterPosition = 0;
        var patternStart = rowOffset;
        for (var x = rowOffset; x < width; x++) {
            if (row.get(x) !== isWhite) {
                counters[counterPosition]++;
            }
            else {
                if (counterPosition === 3) {
                    if (searchingEvenPair) {
                        RSSExpandedReader.reverseCounters(counters);
                    }
                    if (RSSExpandedReader.isFinderPattern(counters)) {
                        this.startEnd[0] = patternStart;
                        this.startEnd[1] = x;
                        return;
                    }
                    if (searchingEvenPair) {
                        RSSExpandedReader.reverseCounters(counters);
                    }
                    patternStart += counters[0] + counters[1];
                    counters[0] = counters[2];
                    counters[1] = counters[3];
                    counters[2] = 0;
                    counters[3] = 0;
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
    };
    RSSExpandedReader.reverseCounters = function (counters) {
        var length = counters.length;
        for (var i = 0; i < length / 2; ++i) {
            var tmp = counters[i];
            counters[i] = counters[length - i - 1];
            counters[length - i - 1] = tmp;
        }
    };
    RSSExpandedReader.prototype.parseFoundFinderPattern = function (row, rowNumber, oddPattern) {
        // Actually we found elements 2-5.
        var firstCounter;
        var start;
        var end;
        if (oddPattern) {
            // If pattern number is odd, we need to locate element 1 *before* the current block.
            var firstElementStart = this.startEnd[0] - 1;
            // Locate element 1
            while (firstElementStart >= 0 && !row.get(firstElementStart)) {
                firstElementStart--;
            }
            firstElementStart++;
            firstCounter = this.startEnd[0] - firstElementStart;
            start = firstElementStart;
            end = this.startEnd[1];
        }
        else {
            // If pattern number is even, the pattern is reversed, so we need to locate element 1 *after* the current block.
            start = this.startEnd[0];
            end = row.getNextUnset(this.startEnd[1] + 1);
            firstCounter = end - this.startEnd[1];
        }
        // Make 'counters' hold 1-4
        var counters = this.getDecodeFinderCounters();
        System.arraycopy(counters, 0, counters, 1, counters.length - 1);
        counters[0] = firstCounter;
        var value;
        try {
            value = this.parseFinderValue(counters, RSSExpandedReader.FINDER_PATTERNS);
        }
        catch (e) {
            return null;
        }
        // return new FinderPattern(value, new int[] { start, end }, start, end, rowNumber});
        return new FinderPattern(value, [start, end], start, end, rowNumber);
    };
    RSSExpandedReader.prototype.decodeDataCharacter = function (row, pattern, isOddPattern, leftChar) {
        var counters = this.getDataCharacterCounters();
        for (var x = 0; x < counters.length; x++) {
            counters[x] = 0;
        }
        if (leftChar) {
            RSSExpandedReader.recordPatternInReverse(row, pattern.getStartEnd()[0], counters);
        }
        else {
            RSSExpandedReader.recordPattern(row, pattern.getStartEnd()[1], counters);
            // reverse it
            for (var i = 0, j = counters.length - 1; i < j; i++, j--) {
                var temp = counters[i];
                counters[i] = counters[j];
                counters[j] = temp;
            }
        } // counters[] has the pixels of the module
        var numModules = 17; // left and right data characters have all the same length
        var elementWidth = MathUtils.sum(new Int32Array(counters)) / numModules;
        // Sanity check: element width for pattern and the character should match
        var expectedElementWidth = (pattern.getStartEnd()[1] - pattern.getStartEnd()[0]) / 15.0;
        if (Math.abs(elementWidth - expectedElementWidth) / expectedElementWidth >
            0.3) {
            throw new NotFoundException();
        }
        var oddCounts = this.getOddCounts();
        var evenCounts = this.getEvenCounts();
        var oddRoundingErrors = this.getOddRoundingErrors();
        var evenRoundingErrors = this.getEvenRoundingErrors();
        for (var i = 0; i < counters.length; i++) {
            var value_1 = (1.0 * counters[i]) / elementWidth;
            var count = value_1 + 0.5; // Round
            if (count < 1) {
                if (value_1 < 0.3) {
                    throw new NotFoundException();
                }
                count = 1;
            }
            else if (count > 8) {
                if (value_1 > 8.7) {
                    throw new NotFoundException();
                }
                count = 8;
            }
            var offset = i / 2;
            if ((i & 0x01) === 0) {
                oddCounts[offset] = count;
                oddRoundingErrors[offset] = value_1 - count;
            }
            else {
                evenCounts[offset] = count;
                evenRoundingErrors[offset] = value_1 - count;
            }
        }
        this.adjustOddEvenCounts(numModules);
        var weightRowNumber = 4 * pattern.getValue() + (isOddPattern ? 0 : 2) + (leftChar ? 0 : 1) - 1;
        var oddSum = 0;
        var oddChecksumPortion = 0;
        for (var i = oddCounts.length - 1; i >= 0; i--) {
            if (RSSExpandedReader.isNotA1left(pattern, isOddPattern, leftChar)) {
                var weight = RSSExpandedReader.WEIGHTS[weightRowNumber][2 * i];
                oddChecksumPortion += oddCounts[i] * weight;
            }
            oddSum += oddCounts[i];
        }
        var evenChecksumPortion = 0;
        // int evenSum = 0;
        for (var i = evenCounts.length - 1; i >= 0; i--) {
            if (RSSExpandedReader.isNotA1left(pattern, isOddPattern, leftChar)) {
                var weight = RSSExpandedReader.WEIGHTS[weightRowNumber][2 * i + 1];
                evenChecksumPortion += evenCounts[i] * weight;
            }
            // evenSum += evenCounts[i];
        }
        var checksumPortion = oddChecksumPortion + evenChecksumPortion;
        if ((oddSum & 0x01) !== 0 || oddSum > 13 || oddSum < 4) {
            throw new NotFoundException();
        }
        var group = (13 - oddSum) / 2;
        var oddWidest = RSSExpandedReader.SYMBOL_WIDEST[group];
        var evenWidest = 9 - oddWidest;
        var vOdd = RSSUtils.getRSSvalue(oddCounts, oddWidest, true);
        var vEven = RSSUtils.getRSSvalue(evenCounts, evenWidest, false);
        var tEven = RSSExpandedReader.EVEN_TOTAL_SUBSET[group];
        var gSum = RSSExpandedReader.GSUM[group];
        var value = vOdd * tEven + vEven + gSum;
        return new DataCharacter(value, checksumPortion);
    };
    RSSExpandedReader.isNotA1left = function (pattern, isOddPattern, leftChar) {
        // A1: pattern.getValue is 0 (A), and it's an oddPattern, and it is a left char
        return !(pattern.getValue() === 0 && isOddPattern && leftChar);
    };
    RSSExpandedReader.prototype.adjustOddEvenCounts = function (numModules) {
        var oddSum = MathUtils.sum(new Int32Array(this.getOddCounts()));
        var evenSum = MathUtils.sum(new Int32Array(this.getEvenCounts()));
        var incrementOdd = false;
        var decrementOdd = false;
        if (oddSum > 13) {
            decrementOdd = true;
        }
        else if (oddSum < 4) {
            incrementOdd = true;
        }
        var incrementEven = false;
        var decrementEven = false;
        if (evenSum > 13) {
            decrementEven = true;
        }
        else if (evenSum < 4) {
            incrementEven = true;
        }
        var mismatch = oddSum + evenSum - numModules;
        var oddParityBad = (oddSum & 0x01) === 1;
        var evenParityBad = (evenSum & 0x01) === 0;
        if (mismatch === 1) {
            if (oddParityBad) {
                if (evenParityBad) {
                    throw new NotFoundException();
                }
                decrementOdd = true;
            }
            else {
                if (!evenParityBad) {
                    throw new NotFoundException();
                }
                decrementEven = true;
            }
        }
        else if (mismatch === -1) {
            if (oddParityBad) {
                if (evenParityBad) {
                    throw new NotFoundException();
                }
                incrementOdd = true;
            }
            else {
                if (!evenParityBad) {
                    throw new NotFoundException();
                }
                incrementEven = true;
            }
        }
        else if (mismatch === 0) {
            if (oddParityBad) {
                if (!evenParityBad) {
                    throw new NotFoundException();
                }
                // Both bad
                if (oddSum < evenSum) {
                    incrementOdd = true;
                    decrementEven = true;
                }
                else {
                    decrementOdd = true;
                    incrementEven = true;
                }
            }
            else {
                if (evenParityBad) {
                    throw new NotFoundException();
                }
                // Nothing to do!
            }
        }
        else {
            throw new NotFoundException();
        }
        if (incrementOdd) {
            if (decrementOdd) {
                throw new NotFoundException();
            }
            RSSExpandedReader.increment(this.getOddCounts(), this.getOddRoundingErrors());
        }
        if (decrementOdd) {
            RSSExpandedReader.decrement(this.getOddCounts(), this.getOddRoundingErrors());
        }
        if (incrementEven) {
            if (decrementEven) {
                throw new NotFoundException();
            }
            RSSExpandedReader.increment(this.getEvenCounts(), this.getOddRoundingErrors());
        }
        if (decrementEven) {
            RSSExpandedReader.decrement(this.getEvenCounts(), this.getEvenRoundingErrors());
        }
    };
    RSSExpandedReader.SYMBOL_WIDEST = [7, 5, 4, 3, 1];
    RSSExpandedReader.EVEN_TOTAL_SUBSET = [4, 20, 52, 104, 204];
    RSSExpandedReader.GSUM = [0, 348, 1388, 2948, 3988];
    RSSExpandedReader.FINDER_PATTERNS = [
        Int32Array.from([1, 8, 4, 1]),
        Int32Array.from([3, 6, 4, 1]),
        Int32Array.from([3, 4, 6, 1]),
        Int32Array.from([3, 2, 8, 1]),
        Int32Array.from([2, 6, 5, 1]),
        Int32Array.from([2, 2, 9, 1]),
    ];
    RSSExpandedReader.WEIGHTS = [
        [1, 3, 9, 27, 81, 32, 96, 77],
        [20, 60, 180, 118, 143, 7, 21, 63],
        [189, 145, 13, 39, 117, 140, 209, 205],
        [193, 157, 49, 147, 19, 57, 171, 91],
        [62, 186, 136, 197, 169, 85, 44, 132],
        [185, 133, 188, 142, 4, 12, 36, 108],
        [113, 128, 173, 97, 80, 29, 87, 50],
        [150, 28, 84, 41, 123, 158, 52, 156],
        [46, 138, 203, 187, 139, 206, 196, 166],
        [76, 17, 51, 153, 37, 111, 122, 155],
        [43, 129, 176, 106, 107, 110, 119, 146],
        [16, 48, 144, 10, 30, 90, 59, 177],
        [109, 116, 137, 200, 178, 112, 125, 164],
        [70, 210, 208, 202, 184, 130, 179, 115],
        [134, 191, 151, 31, 93, 68, 204, 190],
        [148, 22, 66, 198, 172, 94, 71, 2],
        [6, 18, 54, 162, 64, 192, 154, 40],
        [120, 149, 25, 75, 14, 42, 126, 167],
        [79, 26, 78, 23, 69, 207, 199, 175],
        [103, 98, 83, 38, 114, 131, 182, 124],
        [161, 61, 183, 127, 170, 88, 53, 159],
        [55, 165, 73, 8, 24, 72, 5, 15],
        [45, 135, 194, 160, 58, 174, 100, 89],
    ];
    RSSExpandedReader.FINDER_PAT_A = 0;
    RSSExpandedReader.FINDER_PAT_B = 1;
    RSSExpandedReader.FINDER_PAT_C = 2;
    RSSExpandedReader.FINDER_PAT_D = 3;
    RSSExpandedReader.FINDER_PAT_E = 4;
    RSSExpandedReader.FINDER_PAT_F = 5;
    RSSExpandedReader.FINDER_PATTERN_SEQUENCES = [
        [RSSExpandedReader.FINDER_PAT_A, RSSExpandedReader.FINDER_PAT_A],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_D,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_C,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_F,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_F,
            RSSExpandedReader.FINDER_PAT_F,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_D,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_E,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_F,
            RSSExpandedReader.FINDER_PAT_F,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_F,
            RSSExpandedReader.FINDER_PAT_F,
        ],
    ];
    RSSExpandedReader.MAX_PAIRS = 11;
    return RSSExpandedReader;
}(AbstractRSSReader));
export default RSSExpandedReader;
