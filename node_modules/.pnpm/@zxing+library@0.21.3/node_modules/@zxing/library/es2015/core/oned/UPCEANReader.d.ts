import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import Result from '../Result';
import AbstractUPCEANReader from './AbstractUPCEANReader';
/**
 * <p>Encapsulates functionality and implementation that is common to UPC and EAN families
 * of one-dimensional barcodes.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
export default abstract class UPCEANReader extends AbstractUPCEANReader {
    constructor();
    decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
    static checkChecksum(s: string): boolean;
    static checkStandardUPCEANChecksum(s: string): boolean;
    static getStandardUPCEANChecksum(s: string): number;
    static decodeEnd(row: BitArray, endStart: number): Int32Array;
}
