import BinaryBitmap from '../../BinaryBitmap';
import DecodeHintType from '../../DecodeHintType';
import PDF417DetectorResult from './PDF417DetectorResult';
/**
 * <p>Encapsulates logic that can detect a PDF417 Code in an image, even if the
 * PDF417 Code is rotated or skewed, or partially obscured.</p>
 *
 * @author SITA Lab (kevin.osullivan@sita.aero)
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Guenther Grau
 */
export default class Detector {
    private static INDEXES_START_PATTERN;
    private static INDEXES_STOP_PATTERN;
    private static MAX_AVG_VARIANCE;
    private static MAX_INDIVIDUAL_VARIANCE;
    private static START_PATTERN;
    private static STOP_PATTERN;
    private static MAX_PIXEL_DRIFT;
    private static MAX_PATTERN_DRIFT;
    private static SKIPPED_ROW_COUNT_MAX;
    private static ROW_STEP;
    private static BARCODE_MIN_HEIGHT;
    /**
     * <p>Detects a PDF417 Code in an image. Only checks 0 and 180 degree rotations.</p>
     *
     * @param image barcode image to decode
     * @param hints optional hints to detector
     * @param multiple if true, then the image is searched for multiple codes. If false, then at most one code will
     * be found and returned
     * @return {@link PDF417DetectorResult} encapsulating results of detecting a PDF417 code
     * @throws NotFoundException if no PDF417 Code can be found
     */
    static detectMultiple(image: BinaryBitmap, hints: Map<DecodeHintType, any>, multiple: boolean): PDF417DetectorResult;
    /**
     * Detects PDF417 codes in an image. Only checks 0 degree rotation
     * @param multiple if true, then the image is searched for multiple codes. If false, then at most one code will
     * be found and returned
     * @param bitMatrix bit matrix to detect barcodes in
     * @return List of ResultPoint arrays containing the coordinates of found barcodes
     */
    private static detect;
    /**
     * Locate the vertices and the codewords area of a black blob using the Start
     * and Stop patterns as locators.
     *
     * @param matrix the scanned barcode image.
     * @return an array containing the vertices:
     *           vertices[0] x, y top left barcode
     *           vertices[1] x, y bottom left barcode
     *           vertices[2] x, y top right barcode
     *           vertices[3] x, y bottom right barcode
     *           vertices[4] x, y top left codeword area
     *           vertices[5] x, y bottom left codeword area
     *           vertices[6] x, y top right codeword area
     *           vertices[7] x, y bottom right codeword area
     */
    private static findVertices;
    private static copyToResult;
    private static findRowsWithPattern;
    /**
     * @param matrix row of black/white values to search
     * @param column x position to start search
     * @param row y position to start search
     * @param width the number of pixels to search on this row
     * @param pattern pattern of counts of number of black and white pixels that are
     *                 being searched for as a pattern
     * @param counters array of counters, as long as pattern, to re-use
     * @return start/end horizontal offset of guard pattern, as an array of two ints.
     */
    private static findGuardPattern;
    /**
     * Determines how closely a set of observed counts of runs of black/white
     * values matches a given target pattern. This is reported as the ratio of
     * the total variance from the expected pattern proportions across all
     * pattern elements, to the length of the pattern.
     *
     * @param counters observed counters
     * @param pattern expected pattern
     * @param maxIndividualVariance The most any counter can differ before we give up
     * @return ratio of total variance between counters and pattern compared to total pattern size
     */
    private static patternMatchVariance;
}
