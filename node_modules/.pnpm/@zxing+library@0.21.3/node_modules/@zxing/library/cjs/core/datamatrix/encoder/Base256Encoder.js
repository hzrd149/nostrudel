"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base256Encoder = void 0;
var StringUtils_1 = require("../../common/StringUtils");
var StringBuilder_1 = require("../../util/StringBuilder");
var HighLevelEncoder_1 = require("./HighLevelEncoder");
var constants_1 = require("./constants");
var Base256Encoder = /** @class */ (function () {
    function Base256Encoder() {
    }
    Base256Encoder.prototype.getEncodingMode = function () {
        return constants_1.BASE256_ENCODATION;
    };
    Base256Encoder.prototype.encode = function (context) {
        var buffer = new StringBuilder_1.default();
        buffer.append(0); // Initialize length field
        while (context.hasMoreCharacters()) {
            var c = context.getCurrentChar();
            buffer.append(c);
            context.pos++;
            var newMode = HighLevelEncoder_1.default.lookAheadTest(context.getMessage(), context.pos, this.getEncodingMode());
            if (newMode !== this.getEncodingMode()) {
                // Return to ASCII encodation, which will actually handle latch to new mode
                context.signalEncoderChange(constants_1.ASCII_ENCODATION);
                break;
            }
        }
        var dataCount = buffer.length() - 1;
        var lengthFieldSize = 1;
        var currentSize = context.getCodewordCount() + dataCount + lengthFieldSize;
        context.updateSymbolInfo(currentSize);
        var mustPad = context.getSymbolInfo().getDataCapacity() - currentSize > 0;
        if (context.hasMoreCharacters() || mustPad) {
            if (dataCount <= 249) {
                buffer.setCharAt(0, StringUtils_1.default.getCharAt(dataCount));
            }
            else if (dataCount <= 1555) {
                buffer.setCharAt(0, StringUtils_1.default.getCharAt(Math.floor(dataCount / 250) + 249));
                buffer.insert(1, StringUtils_1.default.getCharAt(dataCount % 250));
            }
            else {
                throw new Error('Message length not in valid ranges: ' + dataCount);
            }
        }
        for (var i = 0, c = buffer.length(); i < c; i++) {
            context.writeCodeword(this.randomize255State(buffer.charAt(i).charCodeAt(0), context.getCodewordCount() + 1));
        }
    };
    Base256Encoder.prototype.randomize255State = function (ch, codewordPosition) {
        var pseudoRandom = ((149 * codewordPosition) % 255) + 1;
        var tempVariable = ch + pseudoRandom;
        if (tempVariable <= 255) {
            return tempVariable;
        }
        else {
            return tempVariable - 256;
        }
    };
    return Base256Encoder;
}());
exports.Base256Encoder = Base256Encoder;
