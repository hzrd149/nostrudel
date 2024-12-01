import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import Result from '../Result';
import OneDReader from './OneDReader';
import { int } from '../../customTypings';
/**
 * <p>Encapsulates functionality and implementation that is common to UPC and EAN families
 * of one-dimensional barcodes.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
export default abstract class AbstractUPCEANReader extends OneDReader {
    private static MAX_AVG_VARIANCE;
    private static MAX_INDIVIDUAL_VARIANCE;
    /**
     * Start/end guard pattern.
     */
    static START_END_PATTERN: Int32Array;
    /**
     * Pattern marking the middle of a UPC/EAN pattern, separating the two halves.
     */
    static MIDDLE_PATTERN: Int32Array;
    /**
     * end guard pattern.
     */
    static END_PATTERN: Int32Array;
    /**
     * "Odd", or "L" patterns used to encode UPC/EAN digits.
     */
    static L_PATTERNS: Int32Array[];
    /**
     * As above but also including the "even", or "G" patterns used to encode UPC/EAN digits.
     */
    static L_AND_G_PATTERNS: Int32Array[];
    protected decodeRowStringBuffer: string;
    static findStartGuardPattern(row: BitArray): Int32Array;
    abstract decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
    static checkChecksum(s: string): boolean;
    static checkStandardUPCEANChecksum(s: string): boolean;
    static getStandardUPCEANChecksum(s: string): number;
    static decodeEnd(row: BitArray, endStart: number): Int32Array;
    /**
     * @throws NotFoundException
     */
    static findGuardPatternWithoutCounters(row: BitArray, rowOffset: int, whiteFirst: boolean, pattern: Int32Array): Int32Array;
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
    static findGuardPattern(row: BitArray, rowOffset: number, whiteFirst: boolean, pattern: Int32Array, counters: Int32Array): Int32Array;
    static decodeDigit(row: BitArray, counters: Int32Array, rowOffset: int, patterns: Int32Array[]): number;
    /**
     * Get the format of this decoder.
     *
     * @return The 1D format.
     */
    abstract getBarcodeFormat(): any;
    /**
     * Subclasses override this to decode the portion of a barcode between the start
     * and end guard patterns.
     *
     * @param row row of black/white values to search
     * @param startRange start/end offset of start guard pattern
     * @param resultString {@link StringBuilder} to append decoded chars to
     * @return horizontal offset of first pixel after the "middle" that was decoded
     * @throws NotFoundException if decoding could not complete successfully
     */
    abstract decodeMiddle(row: BitArray, startRange: Int32Array, resultString: string): any;
}
