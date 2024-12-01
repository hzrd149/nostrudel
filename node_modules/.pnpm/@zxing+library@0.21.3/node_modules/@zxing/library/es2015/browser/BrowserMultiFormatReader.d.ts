import { BrowserCodeReader } from './BrowserCodeReader';
import MultiFormatReader from '../core/MultiFormatReader';
import BinaryBitmap from '../core/BinaryBitmap';
import Result from '../core/Result';
import DecodeHintType from '../core/DecodeHintType';
export declare class BrowserMultiFormatReader extends BrowserCodeReader {
    protected readonly reader: MultiFormatReader;
    constructor(hints?: Map<DecodeHintType, any>, timeBetweenScansMillis?: number);
    /**
     * Overwrite decodeBitmap to call decodeWithState, which will pay
     * attention to the hints set in the constructor function
     */
    decodeBitmap(binaryBitmap: BinaryBitmap): Result;
}
