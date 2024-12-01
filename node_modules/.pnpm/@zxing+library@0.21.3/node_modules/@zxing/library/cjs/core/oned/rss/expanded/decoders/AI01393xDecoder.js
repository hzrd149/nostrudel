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
var AI01decoder_1 = require("./AI01decoder");
var NotFoundException_1 = require("../../../../NotFoundException");
var StringBuilder_1 = require("../../../../util/StringBuilder");
var AI01393xDecoder = /** @class */ (function (_super) {
    __extends(AI01393xDecoder, _super);
    function AI01393xDecoder(information) {
        return _super.call(this, information) || this;
    }
    AI01393xDecoder.prototype.parseInformation = function () {
        if (this.getInformation().getSize() <
            AI01393xDecoder.HEADER_SIZE + AI01decoder_1.default.GTIN_SIZE) {
            throw new NotFoundException_1.default();
        }
        var buf = new StringBuilder_1.default();
        this.encodeCompressedGtin(buf, AI01393xDecoder.HEADER_SIZE);
        var lastAIdigit = this.getGeneralDecoder().extractNumericValueFromBitArray(AI01393xDecoder.HEADER_SIZE + AI01decoder_1.default.GTIN_SIZE, AI01393xDecoder.LAST_DIGIT_SIZE);
        buf.append('(393');
        buf.append(lastAIdigit);
        buf.append(')');
        var firstThreeDigits = this.getGeneralDecoder().extractNumericValueFromBitArray(AI01393xDecoder.HEADER_SIZE +
            AI01decoder_1.default.GTIN_SIZE +
            AI01393xDecoder.LAST_DIGIT_SIZE, AI01393xDecoder.FIRST_THREE_DIGITS_SIZE);
        if (firstThreeDigits / 100 === 0) {
            buf.append('0');
        }
        if (firstThreeDigits / 10 === 0) {
            buf.append('0');
        }
        buf.append(firstThreeDigits);
        var generalInformation = this.getGeneralDecoder().decodeGeneralPurposeField(AI01393xDecoder.HEADER_SIZE +
            AI01decoder_1.default.GTIN_SIZE +
            AI01393xDecoder.LAST_DIGIT_SIZE +
            AI01393xDecoder.FIRST_THREE_DIGITS_SIZE, null);
        buf.append(generalInformation.getNewString());
        return buf.toString();
    };
    AI01393xDecoder.HEADER_SIZE = 5 + 1 + 2;
    AI01393xDecoder.LAST_DIGIT_SIZE = 2;
    AI01393xDecoder.FIRST_THREE_DIGITS_SIZE = 10;
    return AI01393xDecoder;
}(AI01decoder_1.default));
exports.default = AI01393xDecoder;
