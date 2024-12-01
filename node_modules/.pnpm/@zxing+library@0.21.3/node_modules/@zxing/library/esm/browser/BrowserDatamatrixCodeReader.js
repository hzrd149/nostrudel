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
import DataMatrixReader from '../core/datamatrix/DataMatrixReader';
/**
 * @deprecated Moving to @zxing/browser
 *
 * QR Code reader to use from browser.
 */
var BrowserDatamatrixCodeReader = /** @class */ (function (_super) {
    __extends(BrowserDatamatrixCodeReader, _super);
    /**
     * Creates an instance of BrowserQRCodeReader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     */
    function BrowserDatamatrixCodeReader(timeBetweenScansMillis) {
        if (timeBetweenScansMillis === void 0) { timeBetweenScansMillis = 500; }
        return _super.call(this, new DataMatrixReader(), timeBetweenScansMillis) || this;
    }
    return BrowserDatamatrixCodeReader;
}(BrowserCodeReader));
export { BrowserDatamatrixCodeReader };
