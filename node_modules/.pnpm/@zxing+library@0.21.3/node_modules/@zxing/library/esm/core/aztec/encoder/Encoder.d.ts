import BitArray from '../../common/BitArray';
import AztecCode from './AztecCode';
import { int } from '../../../customTypings';
/**
 * Generates Aztec 2D barcodes.
 *
 * @author Rustam Abdullaev
 */
export default class Encoder {
    static DEFAULT_EC_PERCENT: int;
    static DEFAULT_AZTEC_LAYERS: int;
    private static MAX_NB_BITS;
    private static MAX_NB_BITS_COMPACT;
    private static WORD_SIZE;
    private constructor();
    /**
     * Encodes the given binary content as an Aztec symbol
     *
     * @param data input data string
     * @return Aztec symbol matrix with metadata
     */
    static encodeBytes(data: Uint8Array): AztecCode;
    /**
     * Encodes the given binary content as an Aztec symbol
     *
     * @param data input data string
     * @param minECCPercent minimal percentage of error check words (According to ISO/IEC 24778:2008,
     *                      a minimum of 23% + 3 words is recommended)
     * @param userSpecifiedLayers if non-zero, a user-specified value for the number of layers
     * @return Aztec symbol matrix with metadata
     */
    static encode(data: Uint8Array, minECCPercent: int, userSpecifiedLayers: int): AztecCode;
    private static drawBullsEye;
    static generateModeMessage(compact: boolean, layers: int, messageSizeInWords: int): BitArray;
    private static drawModeMessage;
    private static generateCheckWords;
    private static bitsToWords;
    private static getGF;
    static stuffBits(bits: BitArray, wordSize: int): BitArray;
    private static totalBitsInLayer;
}
