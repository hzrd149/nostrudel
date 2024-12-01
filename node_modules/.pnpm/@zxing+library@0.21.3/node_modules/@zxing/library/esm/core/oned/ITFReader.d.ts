import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import Result from '../Result';
import OneDReader from './OneDReader';
/**
 * <p>Decodes ITF barcodes.</p>
 *
 * @author Tjieco
 */
export default class ITFReader extends OneDReader {
    private static PATTERNS;
    private static MAX_AVG_VARIANCE;
    private static MAX_INDIVIDUAL_VARIANCE;
    private static DEFAULT_ALLOWED_LENGTHS;
    private narrowLineWidth;
    private static START_PATTERN;
    private static END_PATTERN_REVERSED;
    decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
    private static decodeMiddle;
    private decodeStart;
    private validateQuietZone;
    private static skipWhiteSpace;
    private decodeEnd;
    private static findGuardPattern;
    private static decodeDigit;
}
