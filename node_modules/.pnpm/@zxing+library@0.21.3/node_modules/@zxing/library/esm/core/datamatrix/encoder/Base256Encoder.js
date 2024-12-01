import StringUtils from '../../common/StringUtils';
import StringBuilder from '../../util/StringBuilder';
import HighLevelEncoder from './HighLevelEncoder';
import { BASE256_ENCODATION, ASCII_ENCODATION } from './constants';
var Base256Encoder = /** @class */ (function () {
    function Base256Encoder() {
    }
    Base256Encoder.prototype.getEncodingMode = function () {
        return BASE256_ENCODATION;
    };
    Base256Encoder.prototype.encode = function (context) {
        var buffer = new StringBuilder();
        buffer.append(0); // Initialize length field
        while (context.hasMoreCharacters()) {
            var c = context.getCurrentChar();
            buffer.append(c);
            context.pos++;
            var newMode = HighLevelEncoder.lookAheadTest(context.getMessage(), context.pos, this.getEncodingMode());
            if (newMode !== this.getEncodingMode()) {
                // Return to ASCII encodation, which will actually handle latch to new mode
                context.signalEncoderChange(ASCII_ENCODATION);
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
                buffer.setCharAt(0, StringUtils.getCharAt(dataCount));
            }
            else if (dataCount <= 1555) {
                buffer.setCharAt(0, StringUtils.getCharAt(Math.floor(dataCount / 250) + 249));
                buffer.insert(1, StringUtils.getCharAt(dataCount % 250));
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
export { Base256Encoder };
