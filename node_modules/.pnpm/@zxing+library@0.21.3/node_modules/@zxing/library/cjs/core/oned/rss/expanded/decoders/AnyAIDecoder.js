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
var StringBuilder_1 = require("../../../../util/StringBuilder");
var AbstractExpandedDecoder_1 = require("./AbstractExpandedDecoder");
var AnyAIDecoder = /** @class */ (function (_super) {
    __extends(AnyAIDecoder, _super);
    function AnyAIDecoder(information) {
        return _super.call(this, information) || this;
    }
    AnyAIDecoder.prototype.parseInformation = function () {
        var buf = new StringBuilder_1.default();
        return this.getGeneralDecoder().decodeAllCodes(buf, AnyAIDecoder.HEADER_SIZE);
    };
    AnyAIDecoder.HEADER_SIZE = 2 + 1 + 2;
    return AnyAIDecoder;
}(AbstractExpandedDecoder_1.default));
exports.default = AnyAIDecoder;
