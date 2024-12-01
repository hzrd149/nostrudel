import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';
import UPCEANReader from './UPCEANReader';
/**
 * <p>Implements decoding of the EAN-13 format.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
export default class EAN13Reader extends UPCEANReader {
    private static FIRST_DIGIT_ENCODINGS;
    private decodeMiddleCounters;
    constructor();
    decodeMiddle(row: BitArray, startRange: Int32Array, resultString: string): {
        rowOffset: number;
        resultString: string;
    };
    getBarcodeFormat(): BarcodeFormat;
    static determineFirstDigit(resultString: string, lgPatternFound: number): string;
}
