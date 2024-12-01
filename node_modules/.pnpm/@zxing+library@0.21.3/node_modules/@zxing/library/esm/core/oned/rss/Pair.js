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
import DataCharacter from './DataCharacter';
var Pair = /** @class */ (function (_super) {
    __extends(Pair, _super);
    function Pair(value, checksumPortion, finderPattern) {
        var _this = _super.call(this, value, checksumPortion) || this;
        _this.count = 0;
        _this.finderPattern = finderPattern;
        return _this;
    }
    Pair.prototype.getFinderPattern = function () {
        return this.finderPattern;
    };
    Pair.prototype.getCount = function () {
        return this.count;
    };
    Pair.prototype.incrementCount = function () {
        this.count++;
    };
    return Pair;
}(DataCharacter));
export default Pair;
