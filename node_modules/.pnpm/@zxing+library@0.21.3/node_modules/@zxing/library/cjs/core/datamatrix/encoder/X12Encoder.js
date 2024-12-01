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
exports.X12Encoder = void 0;
var StringUtils_1 = require("../../common/StringUtils");
var StringBuilder_1 = require("../../util/StringBuilder");
var C40Encoder_1 = require("./C40Encoder");
var HighLevelEncoder_1 = require("./HighLevelEncoder");
var constants_1 = require("./constants");
var X12Encoder = /** @class */ (function (_super) {
    __extends(X12Encoder, _super);
    function X12Encoder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    X12Encoder.prototype.getEncodingMode = function () {
        return constants_1.X12_ENCODATION;
    };
    X12Encoder.prototype.encode = function (context) {
        // step C
        var buffer = new StringBuilder_1.default();
        while (context.hasMoreCharacters()) {
            var c = context.getCurrentChar();
            context.pos++;
            this.encodeChar(c, buffer);
            var count = buffer.length();
            if (count % 3 === 0) {
                this.writeNextTriplet(context, buffer);
                var newMode = HighLevelEncoder_1.default.lookAheadTest(context.getMessage(), context.pos, this.getEncodingMode());
                if (newMode !== this.getEncodingMode()) {
                    // Return to ASCII encodation, which will actually handle latch to new mode
                    context.signalEncoderChange(constants_1.ASCII_ENCODATION);
                    break;
                }
            }
        }
        this.handleEOD(context, buffer);
    };
    X12Encoder.prototype.encodeChar = function (c, sb) {
        switch (c) {
            case 13: // CR (Carriage return)
                sb.append(0);
                break;
            case '*'.charCodeAt(0):
                sb.append(1);
                break;
            case '>'.charCodeAt(0):
                sb.append(2);
                break;
            case ' '.charCodeAt(0):
                sb.append(3);
                break;
            default:
                if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
                    sb.append(c - 48 + 4);
                }
                else if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
                    sb.append(c - 65 + 14);
                }
                else {
                    HighLevelEncoder_1.default.illegalCharacter(StringUtils_1.default.getCharAt(c));
                }
                break;
        }
        return 1;
    };
    X12Encoder.prototype.handleEOD = function (context, buffer) {
        context.updateSymbolInfo();
        var available = context.getSymbolInfo().getDataCapacity() - context.getCodewordCount();
        var count = buffer.length();
        context.pos -= count;
        if (context.getRemainingCharacters() > 1 ||
            available > 1 ||
            context.getRemainingCharacters() !== available) {
            context.writeCodeword(constants_1.X12_UNLATCH);
        }
        if (context.getNewEncoding() < 0) {
            context.signalEncoderChange(constants_1.ASCII_ENCODATION);
        }
    };
    return X12Encoder;
}(C40Encoder_1.C40Encoder));
exports.X12Encoder = X12Encoder;
