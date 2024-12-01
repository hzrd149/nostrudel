/**
 * <p>Encapsulates a set of error-correction blocks in one symbol version. Most versions will
 * use blocks of differing sizes within one version, so, this encapsulates the parameters for
 * each set of blocks. It also holds the number of error-correction codewords per block since it
 * will be the same across all blocks within one version.</p>
 */
export declare class ECBlocks {
    private ecCodewords;
    private ecBlocks;
    constructor(ecCodewords: number, ecBlocks1: ECB, ecBlocks2?: ECB);
    getECCodewords(): number;
    getECBlocks(): ECB[];
}
/**
 * <p>Encapsulates the parameters for one error-correction block in one symbol version.
 * This includes the number of data codewords, and the number of times a block with these
 * parameters is used consecutively in the Data Matrix code version's format.</p>
 */
export declare class ECB {
    private count;
    private dataCodewords;
    constructor(count: number, dataCodewords: number);
    getCount(): number;
    getDataCodewords(): number;
}
/**
 * The Version object encapsulates attributes about a particular
 * size Data Matrix Code.
 *
 * @author bbrown@google.com (Brian Brown)
 */
export default class Version {
    private static VERSIONS;
    private versionNumber;
    private symbolSizeRows;
    private symbolSizeColumns;
    private dataRegionSizeRows;
    private dataRegionSizeColumns;
    private ecBlocks;
    private totalCodewords;
    constructor(versionNumber: any, symbolSizeRows: any, symbolSizeColumns: any, dataRegionSizeRows: any, dataRegionSizeColumns: any, ecBlocks: ECBlocks);
    getVersionNumber(): number;
    getSymbolSizeRows(): number;
    getSymbolSizeColumns(): number;
    getDataRegionSizeRows(): number;
    getDataRegionSizeColumns(): number;
    getTotalCodewords(): number;
    getECBlocks(): ECBlocks;
    /**
     * <p>Deduces version information from Data Matrix dimensions.</p>
     *
     * @param numRows Number of rows in modules
     * @param numColumns Number of columns in modules
     * @return Version for a Data Matrix Code of those dimensions
     * @throws FormatException if dimensions do correspond to a valid Data Matrix size
     */
    static getVersionForDimensions(numRows: number, numColumns: number): Version;
    toString(): string;
    /**
     * See ISO 16022:2006 5.5.1 Table 7
     */
    private static buildVersions;
}
