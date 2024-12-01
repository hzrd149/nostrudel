import { BrowserCodeReader } from './BrowserCodeReader';
/**
 * @deprecated Moving to @zxing/browser
 *
 * QR Code reader to use from browser.
 */
export declare class BrowserQRCodeReader extends BrowserCodeReader {
    /**
     * Creates an instance of BrowserQRCodeReader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     */
    constructor(timeBetweenScansMillis?: number);
}
