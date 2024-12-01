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
var IndexOutOfBoundsException_1 = require("./IndexOutOfBoundsException");
/**
 * Custom Error class of type Exception.
 */
var ArrayIndexOutOfBoundsException = /** @class */ (function (_super) {
    __extends(ArrayIndexOutOfBoundsException, _super);
    function ArrayIndexOutOfBoundsException(index, message) {
        if (index === void 0) { index = undefined; }
        if (message === void 0) { message = undefined; }
        var _this = _super.call(this, message) || this;
        _this.index = index;
        _this.message = message;
        return _this;
    }
    ArrayIndexOutOfBoundsException.kind = 'ArrayIndexOutOfBoundsException';
    return ArrayIndexOutOfBoundsException;
}(IndexOutOfBoundsException_1.default));
exports.default = ArrayIndexOutOfBoundsException;
