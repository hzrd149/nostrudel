/**
 * Symbol Character Placement Program. Adapted from Annex M.1 in ISO/IEC 16022:2000(E).
 */
declare class DefaultPlacement {
    private readonly codewords;
    private readonly numcols;
    private readonly numrows;
    private bits;
    /**
     * Main constructor
     *
     * @param codewords the codewords to place
     * @param numcols   the number of columns
     * @param numrows   the number of rows
     */
    constructor(codewords: string, numcols: number, numrows: number);
    getNumrows(): number;
    getNumcols(): number;
    getBits(): Uint8Array;
    getBit(col: number, row: number): boolean;
    private setBit;
    private noBit;
    place(): void;
    private module;
    /**
     * Places the 8 bits of a utah-shaped symbol character in ECC200.
     *
     * @param row the row
     * @param col the column
     * @param pos character position
     */
    private utah;
    private corner1;
    private corner2;
    private corner3;
    private corner4;
}
export default DefaultPlacement;
