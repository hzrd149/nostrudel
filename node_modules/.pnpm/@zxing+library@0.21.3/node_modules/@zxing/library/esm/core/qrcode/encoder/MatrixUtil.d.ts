import BitArray from '../../common/BitArray';
import ErrorCorrectionLevel from '../decoder/ErrorCorrectionLevel';
import Version from '../decoder/Version';
import ByteMatrix from './ByteMatrix';
/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author dswitkin@google.com (Daniel Switkin) - ported from C++
 */
export default class MatrixUtil {
    private constructor();
    private static POSITION_DETECTION_PATTERN;
    private static POSITION_ADJUSTMENT_PATTERN;
    private static POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE;
    private static TYPE_INFO_COORDINATES;
    private static VERSION_INFO_POLY;
    private static TYPE_INFO_POLY;
    private static TYPE_INFO_MASK_PATTERN;
    static clearMatrix(matrix: ByteMatrix): void;
    static buildMatrix(dataBits: BitArray, ecLevel: ErrorCorrectionLevel, version: Version, maskPattern: number, matrix: ByteMatrix): void;
    static embedBasicPatterns(version: Version, matrix: ByteMatrix): void;
    static embedTypeInfo(ecLevel: ErrorCorrectionLevel, maskPattern: number, matrix: ByteMatrix): void;
    static maybeEmbedVersionInfo(version: Version, matrix: ByteMatrix): void;
    static embedDataBits(dataBits: BitArray, maskPattern: number, matrix: ByteMatrix): void;
    static findMSBSet(value: number): number;
    static calculateBCHCode(value: number, poly: number): number;
    static makeTypeInfoBits(ecLevel: ErrorCorrectionLevel, maskPattern: number, bits: BitArray): void;
    static makeVersionInfoBits(version: Version, bits: BitArray): void;
    private static isEmpty;
    private static embedTimingPatterns;
    private static embedDarkDotAtLeftBottomCorner;
    private static embedHorizontalSeparationPattern;
    private static embedVerticalSeparationPattern;
    private static embedPositionAdjustmentPattern;
    private static embedPositionDetectionPattern;
    private static embedPositionDetectionPatternsAndSeparators;
    private static maybeEmbedPositionAdjustmentPatterns;
}
