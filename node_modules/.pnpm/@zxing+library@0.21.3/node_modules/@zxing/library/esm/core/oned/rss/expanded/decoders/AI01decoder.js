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
import AbstractExpandedDecoder from './AbstractExpandedDecoder';
var AI01decoder = /** @class */ (function (_super) {
    __extends(AI01decoder, _super);
    function AI01decoder(information) {
        return _super.call(this, information) || this;
    }
    AI01decoder.prototype.encodeCompressedGtin = function (buf, currentPos) {
        buf.append('(01)');
        var initialPosition = buf.length();
        buf.append('9');
        this.encodeCompressedGtinWithoutAI(buf, currentPos, initialPosition);
    };
    AI01decoder.prototype.encodeCompressedGtinWithoutAI = function (buf, currentPos, initialBufferPosition) {
        for (var i = 0; i < 4; ++i) {
            var currentBlock = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos + 10 * i, 10);
            if (currentBlock / 100 === 0) {
                buf.append('0');
            }
            if (currentBlock / 10 === 0) {
                buf.append('0');
            }
            buf.append(currentBlock);
        }
        AI01decoder.appendCheckDigit(buf, initialBufferPosition);
    };
    AI01decoder.appendCheckDigit = function (buf, currentPos) {
        var checkDigit = 0;
        for (var i = 0; i < 13; i++) {
            // let digit = buf.charAt(i + currentPos) - '0';
            // To be checked
            var digit = buf.charAt(i + currentPos).charCodeAt(0) - '0'.charCodeAt(0);
            checkDigit += (i & 0x01) === 0 ? 3 * digit : digit;
        }
        checkDigit = 10 - (checkDigit % 10);
        if (checkDigit === 10) {
            checkDigit = 0;
        }
        buf.append(checkDigit);
    };
    AI01decoder.GTIN_SIZE = 40;
    return AI01decoder;
}(AbstractExpandedDecoder));
export default AI01decoder;
