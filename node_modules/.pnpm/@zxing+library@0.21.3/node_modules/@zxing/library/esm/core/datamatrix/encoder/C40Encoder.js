import StringBuilder from '../../util/StringBuilder';
import HighLevelEncoder from './HighLevelEncoder';
import { C40_ENCODATION, LATCH_TO_C40, ASCII_ENCODATION, C40_UNLATCH, } from './constants';
var C40Encoder = /** @class */ (function () {
    function C40Encoder() {
    }
    C40Encoder.prototype.getEncodingMode = function () {
        return C40_ENCODATION;
    };
    C40Encoder.prototype.encodeMaximal = function (context) {
        var buffer = new StringBuilder();
        var lastCharSize = 0;
        var backtrackStartPosition = context.pos;
        var backtrackBufferLength = 0;
        while (context.hasMoreCharacters()) {
            var c = context.getCurrentChar();
            context.pos++;
            lastCharSize = this.encodeChar(c, buffer);
            if (buffer.length() % 3 === 0) {
                backtrackStartPosition = context.pos;
                backtrackBufferLength = buffer.length();
            }
        }
        if (backtrackBufferLength !== buffer.length()) {
            var unwritten = Math.floor((buffer.length() / 3) * 2);
            var curCodewordCount = Math.floor(context.getCodewordCount() + unwritten + 1); // +1 for the latch to C40
            context.updateSymbolInfo(curCodewordCount);
            var available = context.getSymbolInfo().getDataCapacity() - curCodewordCount;
            var rest = Math.floor(buffer.length() % 3);
            if ((rest === 2 && available !== 2) ||
                (rest === 1 && (lastCharSize > 3 || available !== 1))) {
                // buffer.setLength(backtrackBufferLength);
                context.pos = backtrackStartPosition;
            }
        }
        if (buffer.length() > 0) {
            context.writeCodeword(LATCH_TO_C40);
        }
        this.handleEOD(context, buffer);
    };
    C40Encoder.prototype.encode = function (context) {
        // step C
        var buffer = new StringBuilder();
        while (context.hasMoreCharacters()) {
            var c = context.getCurrentChar();
            context.pos++;
            var lastCharSize = this.encodeChar(c, buffer);
            var unwritten = Math.floor(buffer.length() / 3) * 2;
            var curCodewordCount = context.getCodewordCount() + unwritten;
            context.updateSymbolInfo(curCodewordCount);
            var available = context.getSymbolInfo().getDataCapacity() - curCodewordCount;
            if (!context.hasMoreCharacters()) {
                // Avoid having a single C40 value in the last triplet
                var removed = new StringBuilder();
                if (buffer.length() % 3 === 2 && available !== 2) {
                    lastCharSize = this.backtrackOneCharacter(context, buffer, removed, lastCharSize);
                }
                while (buffer.length() % 3 === 1 &&
                    (lastCharSize > 3 || available !== 1)) {
                    lastCharSize = this.backtrackOneCharacter(context, buffer, removed, lastCharSize);
                }
                break;
            }
            var count = buffer.length();
            if (count % 3 === 0) {
                var newMode = HighLevelEncoder.lookAheadTest(context.getMessage(), context.pos, this.getEncodingMode());
                if (newMode !== this.getEncodingMode()) {
                    // Return to ASCII encodation, which will actually handle latch to new mode
                    context.signalEncoderChange(ASCII_ENCODATION);
                    break;
                }
            }
        }
        this.handleEOD(context, buffer);
    };
    C40Encoder.prototype.backtrackOneCharacter = function (context, buffer, removed, lastCharSize) {
        var count = buffer.length();
        var test = buffer.toString().substring(0, count - lastCharSize);
        buffer.setLengthToZero();
        buffer.append(test);
        // buffer.delete(count - lastCharSize, count);
        /*for (let i = count - lastCharSize; i < count; i++) {
          buffer.deleteCharAt(i);
        }*/
        context.pos--;
        var c = context.getCurrentChar();
        lastCharSize = this.encodeChar(c, removed);
        context.resetSymbolInfo(); // Deal with possible reduction in symbol size
        return lastCharSize;
    };
    C40Encoder.prototype.writeNextTriplet = function (context, buffer) {
        context.writeCodewords(this.encodeToCodewords(buffer.toString()));
        var test = buffer.toString().substring(3);
        buffer.setLengthToZero();
        buffer.append(test);
        // buffer.delete(0, 3);
        /*for (let i = 0; i < 3; i++) {
          buffer.deleteCharAt(i);
        }*/
    };
    /**
     * Handle "end of data" situations
     *
     * @param context the encoder context
     * @param buffer  the buffer with the remaining encoded characters
     */
    C40Encoder.prototype.handleEOD = function (context, buffer) {
        var unwritten = Math.floor((buffer.length() / 3) * 2);
        var rest = buffer.length() % 3;
        var curCodewordCount = context.getCodewordCount() + unwritten;
        context.updateSymbolInfo(curCodewordCount);
        var available = context.getSymbolInfo().getDataCapacity() - curCodewordCount;
        if (rest === 2) {
            buffer.append('\0'); // Shift 1
            while (buffer.length() >= 3) {
                this.writeNextTriplet(context, buffer);
            }
            if (context.hasMoreCharacters()) {
                context.writeCodeword(C40_UNLATCH);
            }
        }
        else if (available === 1 && rest === 1) {
            while (buffer.length() >= 3) {
                this.writeNextTriplet(context, buffer);
            }
            if (context.hasMoreCharacters()) {
                context.writeCodeword(C40_UNLATCH);
            }
            // else no unlatch
            context.pos--;
        }
        else if (rest === 0) {
            while (buffer.length() >= 3) {
                this.writeNextTriplet(context, buffer);
            }
            if (available > 0 || context.hasMoreCharacters()) {
                context.writeCodeword(C40_UNLATCH);
            }
        }
        else {
            throw new Error('Unexpected case. Please report!');
        }
        context.signalEncoderChange(ASCII_ENCODATION);
    };
    C40Encoder.prototype.encodeChar = function (c, sb) {
        if (c === ' '.charCodeAt(0)) {
            sb.append(3);
            return 1;
        }
        if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
            sb.append(c - 48 + 4);
            return 1;
        }
        if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
            sb.append(c - 65 + 14);
            return 1;
        }
        if (c < ' '.charCodeAt(0)) {
            sb.append(0); // Shift 1 Set
            sb.append(c);
            return 2;
        }
        if (c <= '/'.charCodeAt(0)) {
            sb.append(1); // Shift 2 Set
            sb.append(c - 33);
            return 2;
        }
        if (c <= '@'.charCodeAt(0)) {
            sb.append(1); // Shift 2 Set
            sb.append(c - 58 + 15);
            return 2;
        }
        if (c <= '_'.charCodeAt(0)) {
            sb.append(1); // Shift 2 Set
            sb.append(c - 91 + 22);
            return 2;
        }
        if (c <= 127) {
            sb.append(2); // Shift 3 Set
            sb.append(c - 96);
            return 2;
        }
        sb.append(1 + "\u001E"); // Shift 2, Upper Shift
        var len = 2;
        len += this.encodeChar(c - 128, sb);
        return len;
    };
    C40Encoder.prototype.encodeToCodewords = function (sb) {
        var v = 1600 * sb.charCodeAt(0) + 40 * sb.charCodeAt(1) + sb.charCodeAt(2) + 1;
        var cw1 = v / 256;
        var cw2 = v % 256;
        var result = new StringBuilder();
        result.append(cw1);
        result.append(cw2);
        return result.toString();
    };
    return C40Encoder;
}());
export { C40Encoder };
