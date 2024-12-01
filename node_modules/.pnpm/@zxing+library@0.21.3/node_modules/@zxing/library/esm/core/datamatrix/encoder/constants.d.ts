/**
 * Lookup table which factors to use for which number of error correction codewords.
 * See FACTORS.
 */
export declare const FACTOR_SETS: number[];
/**
 * Precomputed polynomial factors for ECC 200.
 */
export declare const FACTORS: number[][];
export declare const /*final*/ MODULO_VALUE: number;
export declare const LOG: number[], ALOG: number[];
export declare const enum SymbolShapeHint {
    FORCE_NONE = 0,
    FORCE_SQUARE = 1,
    FORCE_RECTANGLE = 2
}
/**
 * Padding character
 */
export declare const PAD = 129;
/**
 * mode latch to C40 encodation mode
 */
export declare const LATCH_TO_C40 = 230;
/**
 * mode latch to Base 256 encodation mode
 */
export declare const LATCH_TO_BASE256 = 231;
/**
 * FNC1 Codeword
 */
/**
 * Structured Append Codeword
 */
/**
 * Reader Programming
 */
/**
 * Upper Shift
 */
export declare const UPPER_SHIFT = 235;
/**
 * 05 Macro
 */
export declare const MACRO_05 = 236;
/**
 * 06 Macro
 */
export declare const MACRO_06 = 237;
/**
 * mode latch to ANSI X.12 encodation mode
 */
export declare const LATCH_TO_ANSIX12 = 238;
/**
 * mode latch to Text encodation mode
 */
export declare const LATCH_TO_TEXT = 239;
/**
 * mode latch to EDIFACT encodation mode
 */
export declare const LATCH_TO_EDIFACT = 240;
/**
 * ECI character (Extended Channel Interpretation)
 */
/**
 * Unlatch from C40 encodation
 */
export declare const C40_UNLATCH = 254;
/**
 * Unlatch from X12 encodation
 */
export declare const X12_UNLATCH = 254;
/**
 * 05 Macro header
 */
export declare const MACRO_05_HEADER = "[)>\u001E05\u001D";
/**
 * 06 Macro header
 */
export declare const MACRO_06_HEADER = "[)>\u001E06\u001D";
/**
 * Macro trailer
 */
export declare const MACRO_TRAILER = "\u001E\u0004";
export declare const ASCII_ENCODATION = 0;
export declare const C40_ENCODATION = 1;
export declare const TEXT_ENCODATION = 2;
export declare const X12_ENCODATION = 3;
export declare const EDIFACT_ENCODATION = 4;
export declare const BASE256_ENCODATION = 5;
