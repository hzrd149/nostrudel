import BitMatrix from '../../common/BitMatrix';
import Version from './Version';
/**
 * @author bbrown@google.com (Brian Brown)
 */
export default class BitMatrixParser {
    private mappingBitMatrix;
    private readMappingMatrix;
    private version;
    /**
     * @param bitMatrix {@link BitMatrix} to parse
     * @throws FormatException if dimension is < 8 or > 144 or not 0 mod 2
     */
    constructor(bitMatrix: BitMatrix);
    getVersion(): Version;
    /**
     * <p>Creates the version object based on the dimension of the original bit matrix from
     * the datamatrix code.</p>
     *
     * <p>See ISO 16022:2006 Table 7 - ECC 200 symbol attributes</p>
     *
     * @param bitMatrix Original {@link BitMatrix} including alignment patterns
     * @return {@link Version} encapsulating the Data Matrix Code's "version"
     * @throws FormatException if the dimensions of the mapping matrix are not valid
     * Data Matrix dimensions.
     */
    static readVersion(bitMatrix: BitMatrix): Version;
    /**
     * <p>Reads the bits in the {@link BitMatrix} representing the mapping matrix (No alignment patterns)
     * in the correct order in order to reconstitute the codewords bytes contained within the
     * Data Matrix Code.</p>
     *
     * @return bytes encoded within the Data Matrix Code
     * @throws FormatException if the exact number of bytes expected is not read
     */
    readCodewords(): Int8Array;
    /**
     * <p>Reads a bit of the mapping matrix accounting for boundary wrapping.</p>
     *
     * @param row Row to read in the mapping matrix
     * @param column Column to read in the mapping matrix
     * @param numRows Number of rows in the mapping matrix
     * @param numColumns Number of columns in the mapping matrix
     * @return value of the given bit in the mapping matrix
     */
    private readModule;
    /**
     * <p>Reads the 8 bits of the standard Utah-shaped pattern.</p>
     *
     * <p>See ISO 16022:2006, 5.8.1 Figure 6</p>
     *
     * @param row Current row in the mapping matrix, anchored at the 8th bit (LSB) of the pattern
     * @param column Current column in the mapping matrix, anchored at the 8th bit (LSB) of the pattern
     * @param numRows Number of rows in the mapping matrix
     * @param numColumns Number of columns in the mapping matrix
     * @return byte from the utah shape
     */
    private readUtah;
    /**
     * <p>Reads the 8 bits of the special corner condition 1.</p>
     *
     * <p>See ISO 16022:2006, Figure F.3</p>
     *
     * @param numRows Number of rows in the mapping matrix
     * @param numColumns Number of columns in the mapping matrix
     * @return byte from the Corner condition 1
     */
    private readCorner1;
    /**
     * <p>Reads the 8 bits of the special corner condition 2.</p>
     *
     * <p>See ISO 16022:2006, Figure F.4</p>
     *
     * @param numRows Number of rows in the mapping matrix
     * @param numColumns Number of columns in the mapping matrix
     * @return byte from the Corner condition 2
     */
    private readCorner2;
    /**
     * <p>Reads the 8 bits of the special corner condition 3.</p>
     *
     * <p>See ISO 16022:2006, Figure F.5</p>
     *
     * @param numRows Number of rows in the mapping matrix
     * @param numColumns Number of columns in the mapping matrix
     * @return byte from the Corner condition 3
     */
    private readCorner3;
    /**
     * <p>Reads the 8 bits of the special corner condition 4.</p>
     *
     * <p>See ISO 16022:2006, Figure F.6</p>
     *
     * @param numRows Number of rows in the mapping matrix
     * @param numColumns Number of columns in the mapping matrix
     * @return byte from the Corner condition 4
     */
    private readCorner4;
    /**
     * <p>Extracts the data region from a {@link BitMatrix} that contains
     * alignment patterns.</p>
     *
     * @param bitMatrix Original {@link BitMatrix} with alignment patterns
     * @return BitMatrix that has the alignment patterns removed
     */
    private extractDataRegion;
}
