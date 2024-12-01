import BinaryBitmap from '../BinaryBitmap';
import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import Reader from '../Reader';
import Result from '../Result';
/**
 * Encapsulates functionality and implementation that is common to all families
 * of one-dimensional barcodes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 */
export default abstract class OneDReader implements Reader {
    decode(image: BinaryBitmap, hints?: Map<DecodeHintType, any>): Result;
    reset(): void;
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
    private doDecode;
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
    protected static recordPattern(row: BitArray, start: number, counters: Int32Array): void;
    protected static recordPatternInReverse(row: BitArray, start: number, counters: Int32Array): void;
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
    protected static patternMatchVariance(counters: Int32Array, pattern: Int32Array, maxIndividualVariance: number): number;
    /**
     * <p>Attempts to decode a one-dimensional barcode format given a single row of
     * an image.</p>
     *
     * @param rowNumber row number from top of the row
     * @param row the black/white pixel data of the row
     * @param hints decode hints
     * @return {@link Result} containing encoded string and start/end of barcode
     * @throws NotFoundException if no potential barcode is found
     * @throws ChecksumException if a potential barcode is found but does not pass its checksum
     * @throws FormatException if a potential barcode is found but format is invalid
     */
    abstract decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
}
