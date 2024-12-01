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
import AI01decoder from './AI01decoder';
var AI01weightDecoder = /** @class */ (function (_super) {
    __extends(AI01weightDecoder, _super);
    function AI01weightDecoder(information) {
        return _super.call(this, information) || this;
    }
    AI01weightDecoder.prototype.encodeCompressedWeight = function (buf, currentPos, weightSize) {
        var originalWeightNumeric = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos, weightSize);
        this.addWeightCode(buf, originalWeightNumeric);
        var weightNumeric = this.checkWeight(originalWeightNumeric);
        var currentDivisor = 100000;
        for (var i = 0; i < 5; ++i) {
            if (weightNumeric / currentDivisor === 0) {
                buf.append('0');
            }
            currentDivisor /= 10;
        }
        buf.append(weightNumeric);
    };
    return AI01weightDecoder;
}(AI01decoder));
export default AI01weightDecoder;
