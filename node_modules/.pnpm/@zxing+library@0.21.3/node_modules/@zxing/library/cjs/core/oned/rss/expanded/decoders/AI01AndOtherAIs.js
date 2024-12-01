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
var StringBuilder_1 = require("../../../../util/StringBuilder");
var AI01AndOtherAIs = /** @class */ (function (_super) {
    __extends(AI01AndOtherAIs, _super);
    // the second one is the encodation method, and the other two are for the variable length
    function AI01AndOtherAIs(information) {
        return _super.call(this, information) || this;
    }
    AI01AndOtherAIs.prototype.parseInformation = function () {
        var buff = new StringBuilder_1.default();
        buff.append('(01)');
        var initialGtinPosition = buff.length();
        var firstGtinDigit = this.getGeneralDecoder().extractNumericValueFromBitArray(AI01AndOtherAIs.HEADER_SIZE, 4);
        buff.append(firstGtinDigit);
        this.encodeCompressedGtinWithoutAI(buff, AI01AndOtherAIs.HEADER_SIZE + 4, initialGtinPosition);
        return this.getGeneralDecoder().decodeAllCodes(buff, AI01AndOtherAIs.HEADER_SIZE + 44);
    };
    AI01AndOtherAIs.HEADER_SIZE = 1 + 1 + 2; // first bit encodes the linkage flag,
    return AI01AndOtherAIs;
}(AI01decoder_1.default));
exports.default = AI01AndOtherAIs;
