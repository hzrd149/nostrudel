import DecoderResult from '../../common/DecoderResult';
import PDF417ResultMetadata from '../PDF417ResultMetadata';
import { int } from '../../../customTypings';
/**
 * <p>This class contains the methods for decoding the PDF417 codewords.</p>
 *
 * @author SITA Lab (kevin.osullivan@sita.aero)
 * @author Guenther Grau
 */
export default class DecodedBitStreamParser {
    private static TEXT_COMPACTION_MODE_LATCH;
    private static BYTE_COMPACTION_MODE_LATCH;
    private static NUMERIC_COMPACTION_MODE_LATCH;
    private static BYTE_COMPACTION_MODE_LATCH_6;
    private static ECI_USER_DEFINED;
    private static ECI_GENERAL_PURPOSE;
    private static ECI_CHARSET;
    private static BEGIN_MACRO_PDF417_CONTROL_BLOCK;
    private static BEGIN_MACRO_PDF417_OPTIONAL_FIELD;
    private static MACRO_PDF417_TERMINATOR;
    private static MODE_SHIFT_TO_BYTE_COMPACTION_MODE;
    private static MAX_NUMERIC_CODEWORDS;
    private static MACRO_PDF417_OPTIONAL_FIELD_FILE_NAME;
    private static MACRO_PDF417_OPTIONAL_FIELD_SEGMENT_COUNT;
    private static MACRO_PDF417_OPTIONAL_FIELD_TIME_STAMP;
    private static MACRO_PDF417_OPTIONAL_FIELD_SENDER;
    private static MACRO_PDF417_OPTIONAL_FIELD_ADDRESSEE;
    private static MACRO_PDF417_OPTIONAL_FIELD_FILE_SIZE;
    private static MACRO_PDF417_OPTIONAL_FIELD_CHECKSUM;
    private static PL;
    private static LL;
    private static AS;
    private static ML;
    private static AL;
    private static PS;
    private static PAL;
    private static PUNCT_CHARS;
    private static MIXED_CHARS;
    /**
     * Table containing values for the exponent of 900.
     * This is used in the numeric compaction decode algorithm.
     */
    private static EXP900;
    private static NUMBER_OF_SEQUENCE_CODEWORDS;
    /**
     *
     * @param codewords
     * @param ecLevel
     *
     * @throws FormatException
     */
    static decode(codewords: Int32Array, ecLevel: string): DecoderResult;
    /**
     *
     * @param int
     * @param param1
     * @param codewords
     * @param int
     * @param codeIndex
     * @param PDF417ResultMetadata
     * @param resultMetadata
     *
     * @throws FormatException
     */
    static decodeMacroBlock(codewords: Int32Array, codeIndex: int, resultMetadata: PDF417ResultMetadata): int;
    /**
     * Text Compaction mode (see 5.4.1.5) permits all printable ASCII characters to be
     * encoded, i.e. values 32 - 126 inclusive in accordance with ISO/IEC 646 (IRV), as
     * well as selected control characters.
     *
     * @param codewords The array of codewords (data + error)
     * @param codeIndex The current index into the codeword array.
     * @param result    The decoded data is appended to the result.
     * @return The next index into the codeword array.
     */
    private static textCompaction;
    /**
     * The Text Compaction mode includes all the printable ASCII characters
     * (i.e. values from 32 to 126) and three ASCII control characters: HT or tab
     * (9: e), LF or line feed (10: e), and CR or carriage
     * return (13: e). The Text Compaction mode also includes various latch
     * and shift characters which are used exclusively within the mode. The Text
     * Compaction mode encodes up to 2 characters per codeword. The compaction rules
     * for converting data into PDF417 codewords are defined in 5.4.2.2. The sub-mode
     * switches are defined in 5.4.2.3.
     *
     * @param textCompactionData The text compaction data.
     * @param byteCompactionData The byte compaction data if there
     *                           was a mode shift.
     * @param length             The size of the text compaction and byte compaction data.
     * @param result             The decoded data is appended to the result.
     */
    private static decodeTextCompaction;
    /**
     * Byte Compaction mode (see 5.4.3) permits all 256 possible 8-bit byte values to be encoded.
     * This includes all ASCII characters value 0 to 127 inclusive and provides for international
     * character set support.
     *
     * @param mode      The byte compaction mode i.e. 901 or 924
     * @param codewords The array of codewords (data + error)
     * @param encoding  Currently active character encoding
     * @param codeIndex The current index into the codeword array.
     * @param result    The decoded data is appended to the result.
     * @return The next index into the codeword array.
     */
    private static byteCompaction;
    /**
     * Numeric Compaction mode (see 5.4.4) permits efficient encoding of numeric data strings.
     *
     * @param codewords The array of codewords (data + error)
     * @param codeIndex The current index into the codeword array.
     * @param result    The decoded data is appended to the result.
     * @return The next index into the codeword array.
     *
     * @throws FormatException
     */
    private static numericCompaction;
    /**
     * Convert a list of Numeric Compacted codewords from Base 900 to Base 10.
     *
     * @param codewords The array of codewords
     * @param count     The number of codewords
     * @return The decoded string representing the Numeric data.
     *
     * EXAMPLE
     * Encode the fifteen digit numeric string 000213298174000
     * Prefix the numeric string with a 1 and set the initial value of
     * t = 1 000 213 298 174 000
     * Calculate codeword 0
     * d0 = 1 000 213 298 174 000 mod 900 = 200
     *
     * t = 1 000 213 298 174 000 div 900 = 1 111 348 109 082
     * Calculate codeword 1
     * d1 = 1 111 348 109 082 mod 900 = 282
     *
     * t = 1 111 348 109 082 div 900 = 1 234 831 232
     * Calculate codeword 2
     * d2 = 1 234 831 232 mod 900 = 632
     *
     * t = 1 234 831 232 div 900 = 1 372 034
     * Calculate codeword 3
     * d3 = 1 372 034 mod 900 = 434
     *
     * t = 1 372 034 div 900 = 1 524
     * Calculate codeword 4
     * d4 = 1 524 mod 900 = 624
     *
     * t = 1 524 div 900 = 1
     * Calculate codeword 5
     * d5 = 1 mod 900 = 1
     * t = 1 div 900 = 0
     * Codeword sequence is: 1, 624, 434, 632, 282, 200
     *
     * Decode the above codewords involves
     *   1 x 900 power of 5 + 624 x 900 power of 4 + 434 x 900 power of 3 +
     * 632 x 900 power of 2 + 282 x 900 power of 1 + 200 x 900 power of 0 = 1000213298174000
     *
     * Remove leading 1 =>  Result is 000213298174000
     *
     * @throws FormatException
     */
    private static decodeBase900toBase10;
}
