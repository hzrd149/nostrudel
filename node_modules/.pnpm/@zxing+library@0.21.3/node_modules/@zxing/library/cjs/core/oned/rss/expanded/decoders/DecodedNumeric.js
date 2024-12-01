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
var FormatException_1 = require("../../../../FormatException");
var DecodedObject_1 = require("./DecodedObject");
var DecodedNumeric = /** @class */ (function (_super) {
    __extends(DecodedNumeric, _super);
    function DecodedNumeric(newPosition, firstDigit, secondDigit) {
        var _this = _super.call(this, newPosition) || this;
        if (firstDigit < 0 || firstDigit > 10 || secondDigit < 0 || secondDigit > 10) {
            throw new FormatException_1.default();
        }
        _this.firstDigit = firstDigit;
        _this.secondDigit = secondDigit;
        return _this;
    }
    DecodedNumeric.prototype.getFirstDigit = function () {
        return this.firstDigit;
    };
    DecodedNumeric.prototype.getSecondDigit = function () {
        return this.secondDigit;
    };
    DecodedNumeric.prototype.getValue = function () {
        return this.firstDigit * 10 + this.secondDigit;
    };
    DecodedNumeric.prototype.isFirstDigitFNC1 = function () {
        return this.firstDigit === DecodedNumeric.FNC1;
    };
    DecodedNumeric.prototype.isSecondDigitFNC1 = function () {
        return this.secondDigit === DecodedNumeric.FNC1;
    };
    DecodedNumeric.prototype.isAnyFNC1 = function () {
        return this.firstDigit === DecodedNumeric.FNC1 || this.secondDigit === DecodedNumeric.FNC1;
    };
    DecodedNumeric.FNC1 = 10;
    return DecodedNumeric;
}(DecodedObject_1.default));
exports.default = DecodedNumeric;
