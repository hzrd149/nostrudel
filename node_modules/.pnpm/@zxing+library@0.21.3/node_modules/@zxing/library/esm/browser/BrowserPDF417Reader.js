var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { BrowserCodeReader } from './BrowserCodeReader';
import PDF417Reader from '../core/pdf417/PDF417Reader';
/**
 * @deprecated Moving to @zxing/browser
 *
 * QR Code reader to use from browser.
 */
var BrowserPDF417Reader = /** @class */ (function (_super) {
    __extends(BrowserPDF417Reader, _super);
    /**
     * Creates an instance of BrowserPDF417Reader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     */
    function BrowserPDF417Reader(timeBetweenScansMillis) {
        if (timeBetweenScansMillis === void 0) { timeBetweenScansMillis = 500; }
        return _super.call(this, new PDF417Reader(), timeBetweenScansMillis) || this;
    }
    return BrowserPDF417Reader;
}(BrowserCodeReader));
export { BrowserPDF417Reader };
