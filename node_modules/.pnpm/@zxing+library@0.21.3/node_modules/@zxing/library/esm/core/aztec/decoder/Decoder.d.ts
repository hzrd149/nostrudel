import AztecDetectorResult from '../AztecDetectorResult';
import DecoderResult from '../../common/DecoderResult';
/**
 * <p>The main class which implements Aztec Code decoding -- as opposed to locating and extracting
 * the Aztec Code from an image.</p>
 *
 * @author David Olivier
 */
export default class Decoder {
    private static UPPER_TABLE;
    private static LOWER_TABLE;
    private static MIXED_TABLE;
    private static PUNCT_TABLE;
    private static DIGIT_TABLE;
    private ddata;
    decode(detectorResult: AztecDetectorResult): DecoderResult;
    static highLevelDecode(correctedBits: boolean[]): string;
    /**
     * Gets the string encoded in the aztec code bits
     *
     * @return the decoded string
     */
    private static getEncodedData;
    /**
     * gets the table corresponding to the char passed
     */
    private static getTable;
    /**
     * Gets the character (or string) corresponding to the passed code in the given table
     *
     * @param table the table used
     * @param code the code of the character
     */
    private static getCharacter;
    /**
     * <p>Performs RS error correction on an array of bits.</p>
     *
     * @return the corrected array
     * @throws FormatException if the input contains too many errors
     */
    private correctBits;
    /**
     * Gets the array of bits from an Aztec Code matrix
     *
     * @return the array of bits
     */
    private extractBits;
    /**
     * Reads a code of given length and at given index in an array of bits
     */
    private static readCode;
    /**
     * Reads a code of length 8 in an array of bits, padding with zeros
     */
    private static readByte;
    /**
     * Packs a bit array into bytes, most significant bit first
     */
    static convertBoolArrayToByteArray(boolArr: boolean[]): Uint8Array;
    private totalBitsInLayer;
}
