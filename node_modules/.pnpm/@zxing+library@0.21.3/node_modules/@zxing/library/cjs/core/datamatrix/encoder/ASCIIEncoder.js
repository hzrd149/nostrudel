"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASCIIEncoder = void 0;
var constants_1 = require("./constants");
// tslint:disable-next-line:no-circular-imports
var HighLevelEncoder_1 = require("./HighLevelEncoder");
var ASCIIEncoder = /** @class */ (function () {
    function ASCIIEncoder() {
    }
    ASCIIEncoder.prototype.getEncodingMode = function () {
        return constants_1.ASCII_ENCODATION;
    };
    ASCIIEncoder.prototype.encode = function (context) {
        // step B
        var n = HighLevelEncoder_1.default.determineConsecutiveDigitCount(context.getMessage(), context.pos);
        if (n >= 2) {
            context.writeCodeword(this.encodeASCIIDigits(context.getMessage().charCodeAt(context.pos), context.getMessage().charCodeAt(context.pos + 1)));
            context.pos += 2;
        }
        else {
            var c = context.getCurrentChar();
            var newMode = HighLevelEncoder_1.default.lookAheadTest(context.getMessage(), context.pos, this.getEncodingMode());
            if (newMode !== this.getEncodingMode()) {
                switch (newMode) {
                    case constants_1.BASE256_ENCODATION:
                        context.writeCodeword(constants_1.LATCH_TO_BASE256);
                        context.signalEncoderChange(constants_1.BASE256_ENCODATION);
                        return;
                    case constants_1.C40_ENCODATION:
                        context.writeCodeword(constants_1.LATCH_TO_C40);
                        context.signalEncoderChange(constants_1.C40_ENCODATION);
                        return;
                    case constants_1.X12_ENCODATION:
                        context.writeCodeword(constants_1.LATCH_TO_ANSIX12);
                        context.signalEncoderChange(constants_1.X12_ENCODATION);
                        break;
                    case constants_1.TEXT_ENCODATION:
                        context.writeCodeword(constants_1.LATCH_TO_TEXT);
                        context.signalEncoderChange(constants_1.TEXT_ENCODATION);
                        break;
                    case constants_1.EDIFACT_ENCODATION:
                        context.writeCodeword(constants_1.LATCH_TO_EDIFACT);
                        context.signalEncoderChange(constants_1.EDIFACT_ENCODATION);
                        break;
                    default:
                        throw new Error('Illegal mode: ' + newMode);
                }
            }
            else if (HighLevelEncoder_1.default.isExtendedASCII(c)) {
                context.writeCodeword(constants_1.UPPER_SHIFT);
                context.writeCodeword(c - 128 + 1);
                context.pos++;
            }
            else {
                context.writeCodeword(c + 1);
                context.pos++;
            }
        }
    };
    ASCIIEncoder.prototype.encodeASCIIDigits = function (digit1, digit2) {
        if (HighLevelEncoder_1.default.isDigit(digit1) && HighLevelEncoder_1.default.isDigit(digit2)) {
            var num = (digit1 - 48) * 10 + (digit2 - 48);
            return num + 130;
        }
        throw new Error('not digits: ' + digit1 + digit2);
    };
    return ASCIIEncoder;
}());
exports.ASCIIEncoder = ASCIIEncoder;
