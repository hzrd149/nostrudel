import ResultPoint from '../../ResultPoint';
import BitMatrix from '../../common/BitMatrix';
import DecoderResult from '../../common/DecoderResult';
import ErrorCorrection from './ec/ErrorCorrection';
import BarcodeValue from './BarcodeValue';
import { int } from '../../../customTypings';
/**
 * @author Guenther Grau
 */
export default class PDF417ScanningDecoder {
    static CODEWORD_SKEW_SIZE: int;
    static MAX_ERRORS: int;
    static MAX_EC_CODEWORDS: int;
    static errorCorrection: ErrorCorrection;
    private constructor();
    /**
     * @TODO don't pass in minCodewordWidth and maxCodewordWidth, pass in barcode columns for start and stop pattern
     *
     * columns. That way width can be deducted from the pattern column.
     * This approach also allows to detect more details about the barcode, e.g. if a bar type (white or black) is wider
     * than it should be. This can happen if the scanner used a bad blackpoint.
     *
     * @param BitMatrix
     * @param image
     * @param ResultPoint
     * @param imageTopLeft
     * @param ResultPoint
     * @param imageBottomLeft
     * @param ResultPoint
     * @param imageTopRight
     * @param ResultPoint
     * @param imageBottomRight
     * @param int
     * @param minCodewordWidth
     * @param int
     * @param maxCodewordWidth
     *
     * @throws NotFoundException
     * @throws FormatException
     * @throws ChecksumException
     */
    static decode(image: BitMatrix, imageTopLeft: ResultPoint, imageBottomLeft: ResultPoint, imageTopRight: ResultPoint, imageBottomRight: ResultPoint, minCodewordWidth: int, maxCodewordWidth: int): DecoderResult;
    /**
     *
     * @param leftRowIndicatorColumn
     * @param rightRowIndicatorColumn
     *
     * @throws NotFoundException
     */
    private static merge;
    /**
     *
     * @param rowIndicatorColumn
     *
     * @throws NotFoundException
     */
    private static adjustBoundingBox;
    private static getMax;
    private static getBarcodeMetadata;
    private static getRowIndicatorColumn;
    /**
     *
     * @param detectionResult
     * @param BarcodeValue
     * @param param2
     * @param param3
     * @param barcodeMatrix
     *
     * @throws NotFoundException
     */
    private static adjustCodewordCount;
    /**
     *
     * @param detectionResult
     *
     * @throws FormatException
     * @throws ChecksumException
     * @throws NotFoundException
     */
    private static createDecoderResult;
    /**
     * This method deals with the fact, that the decoding process doesn't always yield a single most likely value. The
     * current error correction implementation doesn't deal with erasures very well, so it's better to provide a value
     * for these ambiguous codewords instead of treating it as an erasure. The problem is that we don't know which of
     * the ambiguous values to choose. We try decode using the first value, and if that fails, we use another of the
     * ambiguous values and try to decode again. This usually only happens on very hard to read and decode barcodes,
     * so decoding the normal barcodes is not affected by this.
     *
     * @param erasureArray contains the indexes of erasures
     * @param ambiguousIndexes array with the indexes that have more than one most likely value
     * @param ambiguousIndexValues two dimensional array that contains the ambiguous values. The first dimension must
     * be the same length as the ambiguousIndexes array
     *
     * @throws FormatException
     * @throws ChecksumException
     */
    private static createDecoderResultFromAmbiguousValues;
    private static createBarcodeMatrix;
    private static isValidBarcodeColumn;
    private static getStartColumn;
    private static detectCodeword;
    private static getModuleBitCount;
    private static getNumberOfECCodeWords;
    private static adjustCodewordStartColumn;
    private static checkCodewordSkew;
    /**
     * @throws FormatException,
     * @throws ChecksumException
     */
    private static decodeCodewords;
    /**
     * <p>Given data and error-correction codewords received, possibly corrupted by errors, attempts to
     * correct the errors in-place.</p>
     *
     * @param codewords   data and error correction codewords
     * @param erasures positions of any known erasures
     * @param numECCodewords number of error correction codewords that are available in codewords
     * @throws ChecksumException if error correction fails
     */
    private static correctErrors;
    /**
     * Verify that all is OK with the codeword array.
     * @throws FormatException
     */
    private static verifyCodewordCount;
    private static getBitCountForCodeword;
    private static getCodewordBucketNumber;
    private static getCodewordBucketNumber_number;
    private static getCodewordBucketNumber_Int32Array;
    static toString(barcodeMatrix: BarcodeValue[][]): String;
}
