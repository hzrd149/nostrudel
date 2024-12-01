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
import DecodedObject from './DecodedObject';
var DecodedInformation = /** @class */ (function (_super) {
    __extends(DecodedInformation, _super);
    function DecodedInformation(newPosition, newString, remainingValue) {
        var _this = _super.call(this, newPosition) || this;
        if (remainingValue) {
            _this.remaining = true;
            _this.remainingValue = _this.remainingValue;
        }
        else {
            _this.remaining = false;
            _this.remainingValue = 0;
        }
        _this.newString = newString;
        return _this;
    }
    DecodedInformation.prototype.getNewString = function () {
        return this.newString;
    };
    DecodedInformation.prototype.isRemaining = function () {
        return this.remaining;
    };
    DecodedInformation.prototype.getRemainingValue = function () {
        return this.remainingValue;
    };
    return DecodedInformation;
}(DecodedObject));
export default DecodedInformation;
