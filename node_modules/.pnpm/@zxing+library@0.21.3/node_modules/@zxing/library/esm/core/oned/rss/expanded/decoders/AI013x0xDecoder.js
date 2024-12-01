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
import AI01weightDecoder from './AI01weightDecoder';
import StringBuilder from '../../../../util/StringBuilder';
import NotFoundException from '../../../../NotFoundException';
var AI013x0xDecoder = /** @class */ (function (_super) {
    __extends(AI013x0xDecoder, _super);
    function AI013x0xDecoder(information) {
        return _super.call(this, information) || this;
    }
    AI013x0xDecoder.prototype.parseInformation = function () {
        if (this.getInformation().getSize() !==
            AI013x0xDecoder.HEADER_SIZE +
                AI01weightDecoder.GTIN_SIZE +
                AI013x0xDecoder.WEIGHT_SIZE) {
            throw new NotFoundException();
        }
        var buf = new StringBuilder();
        this.encodeCompressedGtin(buf, AI013x0xDecoder.HEADER_SIZE);
        this.encodeCompressedWeight(buf, AI013x0xDecoder.HEADER_SIZE + AI01weightDecoder.GTIN_SIZE, AI013x0xDecoder.WEIGHT_SIZE);
        return buf.toString();
    };
    AI013x0xDecoder.HEADER_SIZE = 4 + 1;
    AI013x0xDecoder.WEIGHT_SIZE = 15;
    return AI013x0xDecoder;
}(AI01weightDecoder));
export default AI013x0xDecoder;
