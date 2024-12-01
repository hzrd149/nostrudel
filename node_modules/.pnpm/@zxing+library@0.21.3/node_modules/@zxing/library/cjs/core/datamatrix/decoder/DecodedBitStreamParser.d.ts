import DecoderResult from '../../common/DecoderResult';
/**
 * <p>Data Matrix Codes can encode text as bits in one of several modes, and can use multiple modes
 * in one Data Matrix Code. This class decodes the bits back into text.</p>
 *
 * <p>See ISO 16022:2006, 5.2.1 - 5.2.9.2</p>
 *
 * @author bbrown@google.com (Brian Brown)
 * @author Sean Owen
 */
export default class DecodedBitStreamParser {
    /**
     * See ISO 16022:2006, Annex C Table C.1
     * The C40 Basic Character Set (*'s used for placeholders for the shift values)
     */
    private static C40_BASIC_SET_CHARS;
    private static C40_SHIFT2_SET_CHARS;
    /**
     * See ISO 16022:2006, Annex C Table C.2
     * The Text Basic Character Set (*'s used for placeholders for the shift values)
     */
    private static TEXT_BASIC_SET_CHARS;
    private static TEXT_SHIFT2_SET_CHARS;
    private static TEXT_SHIFT3_SET_CHARS;
    static decode(bytes: Uint8Array): DecoderResult;
    /**
     * See ISO 16022:2006, 5.2.3 and Annex C, Table C.2
     */
    private static decodeAsciiSegment;
    /**
     * See ISO 16022:2006, 5.2.5 and Annex C, Table C.1
     */
    private static decodeC40Segment;
    /**
     * See ISO 16022:2006, 5.2.6 and Annex C, Table C.2
     */
    private static decodeTextSegment;
    /**
     * See ISO 16022:2006, 5.2.7
     */
    private static decodeAnsiX12Segment;
    private static parseTwoBytes;
    /**
     * See ISO 16022:2006, 5.2.8 and Annex C Table C.3
     */
    private static decodeEdifactSegment;
    /**
     * See ISO 16022:2006, 5.2.9 and Annex B, B.2
     */
    private static decodeBase256Segment;
    /**
     * See ISO 16022:2006, Annex B, B.2
     */
    private static unrandomize255State;
}
