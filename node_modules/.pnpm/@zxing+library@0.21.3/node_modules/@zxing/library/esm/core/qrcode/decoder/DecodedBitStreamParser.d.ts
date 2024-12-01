import DecoderResult from '../../common/DecoderResult';
import DecodeHintType from '../../DecodeHintType';
import ErrorCorrectionLevel from './ErrorCorrectionLevel';
import Version from './Version';
/**
 * <p>QR Codes can encode text as bits in one of several modes, and can use multiple modes
 * in one QR Code. This class decodes the bits back into text.</p>
 *
 * <p>See ISO 18004:2006, 6.4.3 - 6.4.7</p>
 *
 * @author Sean Owen
 */
export default class DecodedBitStreamParser {
    /**
     * See ISO 18004:2006, 6.4.4 Table 5
     */
    private static ALPHANUMERIC_CHARS;
    private static GB2312_SUBSET;
    static decode(bytes: Uint8Array, version: Version, ecLevel: ErrorCorrectionLevel, hints: Map<DecodeHintType, any>): DecoderResult;
    /**
     * See specification GBT 18284-2000
     */
    private static decodeHanziSegment;
    private static decodeKanjiSegment;
    private static decodeByteSegment;
    private static toAlphaNumericChar;
    private static decodeAlphanumericSegment;
    private static decodeNumericSegment;
    private static parseECIValue;
}
