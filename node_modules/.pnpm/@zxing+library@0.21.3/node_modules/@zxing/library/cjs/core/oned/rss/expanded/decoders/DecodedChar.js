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
var DecodedObject_1 = require("./DecodedObject");
var DecodedChar = /** @class */ (function (_super) {
    __extends(DecodedChar, _super);
    function DecodedChar(newPosition, value) {
        var _this = _super.call(this, newPosition) || this;
        _this.value = value;
        return _this;
    }
    DecodedChar.prototype.getValue = function () {
        return this.value;
    };
    DecodedChar.prototype.isFNC1 = function () {
        return this.value === DecodedChar.FNC1;
    };
    DecodedChar.FNC1 = '$';
    return DecodedChar;
}(DecodedObject_1.default));
exports.default = DecodedChar;
