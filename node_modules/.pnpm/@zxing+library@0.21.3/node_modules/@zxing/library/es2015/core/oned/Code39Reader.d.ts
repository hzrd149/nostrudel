import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import OneDReader from './OneDReader';
import Result from '../Result';
/**
 * <p>Decodes Code 39 barcodes. Supports "Full ASCII Code 39" if USE_CODE_39_EXTENDED_MODE is set.</p>
 *
 * @author Sean Owen
 * @see Code93Reader
 */
export default class Code39Reader extends OneDReader {
    private static readonly ALPHABET_STRING;
    /**
     * These represent the encodings of characters, as patterns of wide and narrow bars.
     * The 9 least-significant bits of each int correspond to the pattern of wide and narrow,
     * with 1s representing "wide" and 0s representing narrow.
     */
    private static readonly CHARACTER_ENCODINGS;
    private static readonly ASTERISK_ENCODING;
    private usingCheckDigit;
    private extendedMode;
    private decodeRowResult;
    private counters;
    /**
     * Creates a reader that assumes all encoded data is data, and does not treat the final
     * character as a check digit. It will not decoded "extended Code 39" sequences.
     */
    /**
     * Creates a reader that can be configured to check the last character as a check digit.
     * It will not decoded "extended Code 39" sequences.
     *
     * @param usingCheckDigit if true, treat the last data character as a check digit, not
     * data, and verify that the checksum passes.
     */
    /**
     * Creates a reader that can be configured to check the last character as a check digit,
     * or optionally attempt to decode "extended Code 39" sequences that are used to encode
     * the full ASCII character set.
     *
     * @param usingCheckDigit if true, treat the last data character as a check digit, not
     * data, and verify that the checksum passes.
     * @param extendedMode if true, will attempt to decode extended Code 39 sequences in the
     * text.
     */
    constructor(usingCheckDigit?: boolean, extendedMode?: boolean);
    decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
    private static findAsteriskPattern;
    private static toNarrowWidePattern;
    private static patternToChar;
    private static decodeExtended;
}
