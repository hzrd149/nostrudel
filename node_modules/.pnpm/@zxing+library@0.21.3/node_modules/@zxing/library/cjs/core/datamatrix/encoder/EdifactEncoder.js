"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdifactEncoder = void 0;
var StringUtils_1 = require("../../common/StringUtils");
var StringBuilder_1 = require("../../util/StringBuilder");
var constants_1 = require("./constants");
var HighLevelEncoder_1 = require("./HighLevelEncoder");
var EdifactEncoder = /** @class */ (function () {
    function EdifactEncoder() {
    }
    EdifactEncoder.prototype.getEncodingMode = function () {
        return constants_1.EDIFACT_ENCODATION;
    };
    EdifactEncoder.prototype.encode = function (context) {
        // step F
        var buffer = new StringBuilder_1.default();
        while (context.hasMoreCharacters()) {
            var c = context.getCurrentChar();
            this.encodeChar(c, buffer);
            context.pos++;
            var count = buffer.length();
            if (count >= 4) {
                context.writeCodewords(this.encodeToCodewords(buffer.toString()));
                var test_1 = buffer.toString().substring(4);
                buffer.setLengthToZero();
                buffer.append(test_1);
                // buffer.delete(0, 4);
                // for (let i = 0; i < 4; i++) {
                //  buffer.deleteCharAt(i);
                // }
                var newMode = HighLevelEncoder_1.default.lookAheadTest(context.getMessage(), context.pos, this.getEncodingMode());
                if (newMode !== this.getEncodingMode()) {
                    // Return to ASCII encodation, which will actually handle latch to new mode
                    context.signalEncoderChange(constants_1.ASCII_ENCODATION);
                    break;
                }
            }
        }
        buffer.append(StringUtils_1.default.getCharAt(31)); // Unlatch
        this.handleEOD(context, buffer);
    };
    /**
     * Handle "end of data" situations
     *
     * @param context the encoder context
     * @param buffer  the buffer with the remaining encoded characters
     */
    EdifactEncoder.prototype.handleEOD = function (context, buffer) {
        try {
            var count = buffer.length();
            if (count === 0) {
                return; // Already finished
            }
            if (count === 1) {
                // Only an unlatch at the end
                context.updateSymbolInfo();
                var available = context.getSymbolInfo().getDataCapacity() -
                    context.getCodewordCount();
                var remaining = context.getRemainingCharacters();
                // The following two lines are a hack inspired by the 'fix' from https://sourceforge.net/p/barcode4j/svn/221/
                if (remaining > available) {
                    context.updateSymbolInfo(context.getCodewordCount() + 1);
                    available =
                        context.getSymbolInfo().getDataCapacity() -
                            context.getCodewordCount();
                }
                if (remaining <= available && available <= 2) {
                    return; // No unlatch
                }
            }
            if (count > 4) {
                throw new Error('Count must not exceed 4');
            }
            var restChars = count - 1;
            var encoded = this.encodeToCodewords(buffer.toString());
            var endOfSymbolReached = !context.hasMoreCharacters();
            var restInAscii = endOfSymbolReached && restChars <= 2;
            if (restChars <= 2) {
                context.updateSymbolInfo(context.getCodewordCount() + restChars);
                var available = context.getSymbolInfo().getDataCapacity() -
                    context.getCodewordCount();
                if (available >= 3) {
                    restInAscii = false;
                    context.updateSymbolInfo(context.getCodewordCount() + encoded.length);
                    // available = context.symbolInfo.dataCapacity - context.getCodewordCount();
                }
            }
            if (restInAscii) {
                context.resetSymbolInfo();
                context.pos -= restChars;
            }
            else {
                context.writeCodewords(encoded);
            }
        }
        finally {
            context.signalEncoderChange(constants_1.ASCII_ENCODATION);
        }
    };
    EdifactEncoder.prototype.encodeChar = function (c, sb) {
        if (c >= ' '.charCodeAt(0) && c <= '?'.charCodeAt(0)) {
            sb.append(c);
        }
        else if (c >= '@'.charCodeAt(0) && c <= '^'.charCodeAt(0)) {
            sb.append(StringUtils_1.default.getCharAt(c - 64));
        }
        else {
            HighLevelEncoder_1.default.illegalCharacter(StringUtils_1.default.getCharAt(c));
        }
    };
    EdifactEncoder.prototype.encodeToCodewords = function (sb) {
        var len = sb.length;
        if (len === 0) {
            throw new Error('StringBuilder must not be empty');
        }
        var c1 = sb.charAt(0).charCodeAt(0);
        var c2 = len >= 2 ? sb.charAt(1).charCodeAt(0) : 0;
        var c3 = len >= 3 ? sb.charAt(2).charCodeAt(0) : 0;
        var c4 = len >= 4 ? sb.charAt(3).charCodeAt(0) : 0;
        var v = (c1 << 18) + (c2 << 12) + (c3 << 6) + c4;
        var cw1 = (v >> 16) & 255;
        var cw2 = (v >> 8) & 255;
        var cw3 = v & 255;
        var res = new StringBuilder_1.default();
        res.append(cw1);
        if (len >= 2) {
            res.append(cw2);
        }
        if (len >= 3) {
            res.append(cw3);
        }
        return res.toString();
    };
    return EdifactEncoder;
}());
exports.EdifactEncoder = EdifactEncoder;
