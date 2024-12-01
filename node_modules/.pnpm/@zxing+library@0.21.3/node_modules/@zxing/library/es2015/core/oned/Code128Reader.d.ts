import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import Result from '../Result';
import OneDReader from './OneDReader';
/**
 * <p>Decodes Code 128 barcodes.</p>
 *
 * @author Sean Owen
 */
export default class Code128Reader extends OneDReader {
    private static CODE_PATTERNS;
    private static MAX_AVG_VARIANCE;
    private static MAX_INDIVIDUAL_VARIANCE;
    private static CODE_SHIFT;
    private static CODE_CODE_C;
    private static CODE_CODE_B;
    private static CODE_CODE_A;
    private static CODE_FNC_1;
    private static CODE_FNC_2;
    private static CODE_FNC_3;
    private static CODE_FNC_4_A;
    private static CODE_FNC_4_B;
    private static CODE_START_A;
    private static CODE_START_B;
    private static CODE_START_C;
    private static CODE_STOP;
    private static findStartPattern;
    private static decodeCode;
    decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
}
