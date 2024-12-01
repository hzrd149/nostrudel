import { BrowserCodeReader } from './BrowserCodeReader';
import MultiFormatReader from '../core/MultiFormatReader';
export class BrowserMultiFormatReader extends BrowserCodeReader {
    constructor(hints = null, timeBetweenScansMillis = 500) {
        const reader = new MultiFormatReader();
        reader.setHints(hints);
        super(reader, timeBetweenScansMillis);
    }
    /**
     * Overwrite decodeBitmap to call decodeWithState, which will pay
     * attention to the hints set in the constructor function
     */
    decodeBitmap(binaryBitmap) {
        return this.reader.decodeWithState(binaryBitmap);
    }
}
