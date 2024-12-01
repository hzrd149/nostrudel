import { BrowserCodeReader } from './BrowserCodeReader';
import DecodeHintType from '../core/DecodeHintType';
/**
 * @deprecated Moving to @zxing/browser
 *
 * Barcode reader reader to use from browser.
 */
export declare class BrowserBarcodeReader extends BrowserCodeReader {
    /**
     * Creates an instance of BrowserBarcodeReader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     * @param {Map<DecodeHintType, any>} hints
     */
    constructor(timeBetweenScansMillis?: number, hints?: Map<DecodeHintType, any>);
}
