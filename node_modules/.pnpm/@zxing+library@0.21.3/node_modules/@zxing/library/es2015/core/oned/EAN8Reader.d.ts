import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';
import UPCEANReader from './UPCEANReader';
/**
 * <p>Implements decoding of the EAN-8 format.</p>
 *
 * @author Sean Owen
 */
export default class EAN8Reader extends UPCEANReader {
    private decodeMiddleCounters;
    constructor();
    decodeMiddle(row: BitArray, startRange: Int32Array, resultString: string): {
        rowOffset: number;
        resultString: string;
    };
    getBarcodeFormat(): BarcodeFormat;
}
