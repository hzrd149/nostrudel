import { int } from '../../customTypings';
/**
 * @author SITA Lab (kevin.osullivan@sita.aero)
 * @author Guenther Grau
 */
export default class PDF417Common {
    static NUMBER_OF_CODEWORDS: number;
    static MAX_CODEWORDS_IN_BARCODE: number;
    static MIN_ROWS_IN_BARCODE: number;
    static MAX_ROWS_IN_BARCODE: number;
    static MODULES_IN_CODEWORD: number;
    static MODULES_IN_STOP_PATTERN: number;
    static BARS_IN_MODULE: number;
    private static EMPTY_INT_ARRAY;
    private PDF417Common;
    /**
     * @param moduleBitCount values to sum
     * @return sum of values
     * @deprecated call {@link MathUtils#sum(int[])}
     */
    static getBitCountSum(moduleBitCount: Int32Array): int;
    static toIntArray(list: int[]): Int32Array;
    /**
     * @param symbol encoded symbol to translate to a codeword
     * @return the codeword corresponding to the symbol.
     */
    static getCodeword(symbol: number): number;
    /**
     * The sorted table of all possible symbols. Extracted from the PDF417
     * specification. The index of a symbol in this table corresponds to the
     * index into the codeword table.
     */
    static SYMBOL_TABLE: Int32Array;
    /**
     * This table contains to codewords for all symbols.
     */
    private static CODEWORD_TABLE;
}
