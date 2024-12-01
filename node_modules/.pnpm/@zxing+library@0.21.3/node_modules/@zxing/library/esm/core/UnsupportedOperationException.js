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
import Exception from './Exception';
/**
 * Custom Error class of type Exception.
 */
var UnsupportedOperationException = /** @class */ (function (_super) {
    __extends(UnsupportedOperationException, _super);
    function UnsupportedOperationException() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UnsupportedOperationException.kind = 'UnsupportedOperationException';
    return UnsupportedOperationException;
}(Exception));
export default UnsupportedOperationException;
