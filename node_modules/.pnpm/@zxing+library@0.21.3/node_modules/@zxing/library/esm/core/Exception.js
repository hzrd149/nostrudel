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
import { CustomError } from 'ts-custom-error';
/**
 * Custom Error class of type Exception.
 */
var Exception = /** @class */ (function (_super) {
    __extends(Exception, _super);
    /**
     * Allows Exception to be constructed directly
     * with some message and prototype definition.
     */
    function Exception(message) {
        if (message === void 0) { message = undefined; }
        var _this = _super.call(this, message) || this;
        _this.message = message;
        return _this;
    }
    Exception.prototype.getKind = function () {
        var ex = this.constructor;
        return ex.kind;
    };
    /**
     * It's typed as string so it can be extended and overriden.
     */
    Exception.kind = 'Exception';
    return Exception;
}(CustomError));
export default Exception;
