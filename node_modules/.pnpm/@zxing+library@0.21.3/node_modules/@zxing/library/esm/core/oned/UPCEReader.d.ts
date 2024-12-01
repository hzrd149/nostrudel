import UPCEANReader from './UPCEANReader';
import BitArray from '../common/BitArray';
import BarcodeFormat from '../BarcodeFormat';
import { int } from 'src/customTypings';
/**
 * <p>Implements decoding of the UPC-E format.</p>
 * <p><a href="http://www.barcodeisland.com/upce.phtml">This</a> is a great reference for
 * UPC-E information.</p>
 *
 * @author Sean Owen
 *
 * @source https://github.com/zxing/zxing/blob/3c96923276dd5785d58eb970b6ba3f80d36a9505/core/src/main/java/com/google/zxing/oned/UPCEReader.java
 *
 * @experimental
 */
export default class UPCEReader extends UPCEANReader {
    /**
     * The pattern that marks the middle, and end, of a UPC-E pattern.
     * There is no "second half" to a UPC-E barcode.
     */
    private static MIDDLE_END_PATTERN;
    /**
     * See {@link #L_AND_G_PATTERNS}; these values similarly represent patterns of
     * even-odd parity encodings of digits that imply both the number system (0 or 1)
     * used, and the check digit.
     */
    static NUMSYS_AND_CHECK_DIGIT_PATTERNS: Int32Array[];
    private decodeMiddleCounters;
    constructor();
    /**
     * @throws NotFoundException
     */
    decodeMiddle(row: BitArray, startRange: Int32Array, result: string): number;
    /**
     * @throws NotFoundException
     */
    protected decodeEnd(row: BitArray, endStart: int): Int32Array;
    /**
     * @throws FormatException
     */
    protected checkChecksum(s: string): boolean;
    /**
     * @throws NotFoundException
     */
    private static determineNumSysAndCheckDigit;
    getBarcodeFormat(): BarcodeFormat;
    /**
     * Expands a UPC-E value back into its full, equivalent UPC-A code value.
     *
     * @param upce UPC-E code as string of digits
     * @return equivalent UPC-A code as string of digits
     */
    static convertUPCEtoUPCA(upce: string): string;
}
