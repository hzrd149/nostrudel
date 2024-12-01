"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserAztecCodeReader = void 0;
var BrowserCodeReader_1 = require("./BrowserCodeReader");
var AztecReader_1 = require("../core/aztec/AztecReader");
/**
 * Aztec Code reader to use from browser.
 *
 * @class BrowserAztecCodeReader
 * @extends {BrowserCodeReader}
 */
var BrowserAztecCodeReader = /** @class */ (function (_super) {
    __extends(BrowserAztecCodeReader, _super);
    /**
     * Creates an instance of BrowserAztecCodeReader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     *
     * @memberOf BrowserAztecCodeReader
     */
    function BrowserAztecCodeReader(timeBetweenScansMillis) {
        if (timeBetweenScansMillis === void 0) { timeBetweenScansMillis = 500; }
        return _super.call(this, new AztecReader_1.default(), timeBetweenScansMillis) || this;
    }
    return BrowserAztecCodeReader;
}(BrowserCodeReader_1.BrowserCodeReader));
exports.BrowserAztecCodeReader = BrowserAztecCodeReader;
