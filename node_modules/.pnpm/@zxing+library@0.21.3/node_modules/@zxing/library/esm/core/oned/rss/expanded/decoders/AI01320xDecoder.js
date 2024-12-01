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
import AI013x0xDecoder from './AI013x0xDecoder';
var AI01320xDecoder = /** @class */ (function (_super) {
    __extends(AI01320xDecoder, _super);
    function AI01320xDecoder(information) {
        return _super.call(this, information) || this;
    }
    AI01320xDecoder.prototype.addWeightCode = function (buf, weight) {
        if (weight < 10000) {
            buf.append('(3202)');
        }
        else {
            buf.append('(3203)');
        }
    };
    AI01320xDecoder.prototype.checkWeight = function (weight) {
        if (weight < 10000) {
            return weight;
        }
        return weight - 10000;
    };
    return AI01320xDecoder;
}(AI013x0xDecoder));
export default AI01320xDecoder;
