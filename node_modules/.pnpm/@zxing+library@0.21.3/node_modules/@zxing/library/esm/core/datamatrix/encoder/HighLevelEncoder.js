// tslint:disable-next-line:no-circular-imports
import { ASCIIEncoder } from './ASCIIEncoder';
// tslint:disable-next-line:no-circular-imports
import { Base256Encoder } from './Base256Encoder';
// tslint:disable-next-line:no-circular-imports
import { C40Encoder } from './C40Encoder';
import { ASCII_ENCODATION, BASE256_ENCODATION, C40_ENCODATION, EDIFACT_ENCODATION, MACRO_05, MACRO_05_HEADER, MACRO_06, MACRO_06_HEADER, MACRO_TRAILER, PAD, TEXT_ENCODATION, X12_ENCODATION, } from './constants';
// tslint:disable-next-line:no-circular-imports
import { EdifactEncoder } from './EdifactEncoder';
import { EncoderContext } from './EncoderContext';
// tslint:disable-next-line:no-circular-imports
import { X12Encoder } from './X12Encoder';
// tslint:disable-next-line:no-circular-imports
import { TextEncoder } from './TextEncoder';
import Arrays from '../../util/Arrays';
import Integer from '../../util/Integer';
/**
 * DataMatrix ECC 200 data encoder following the algorithm described in ISO/IEC 16022:200(E) in
 * annex S.
 */
var HighLevelEncoder = /** @class */ (function () {
    function HighLevelEncoder() {
    }
    HighLevelEncoder.randomize253State = function (codewordPosition) {
        var pseudoRandom = ((149 * codewordPosition) % 253) + 1;
        var tempVariable = PAD + pseudoRandom;
        return tempVariable <= 254 ? tempVariable : tempVariable - 254;
    };
    /**
     * Performs message encoding of a DataMatrix message using the algorithm described in annex P
     * of ISO/IEC 16022:2000(E).
     *
     * @param msg     the message
     * @param shape   requested shape. May be {@code SymbolShapeHint.FORCE_NONE},
     *                {@code SymbolShapeHint.FORCE_SQUARE} or {@code SymbolShapeHint.FORCE_RECTANGLE}.
     * @param minSize the minimum symbol size constraint or null for no constraint
     * @param maxSize the maximum symbol size constraint or null for no constraint
     * @param forceC40 enforce C40 encoding
     * @return the encoded message (the char values range from 0 to 255)
     */
    HighLevelEncoder.encodeHighLevel = function (msg, shape, minSize, maxSize, forceC40) {
        if (shape === void 0) { shape = 0 /* FORCE_NONE */; }
        if (minSize === void 0) { minSize = null; }
        if (maxSize === void 0) { maxSize = null; }
        if (forceC40 === void 0) { forceC40 = false; }
        // the codewords 0..255 are encoded as Unicode characters
        var c40Encoder = new C40Encoder();
        var encoders = [
            new ASCIIEncoder(),
            c40Encoder,
            new TextEncoder(),
            new X12Encoder(),
            new EdifactEncoder(),
            new Base256Encoder(),
        ];
        var context = new EncoderContext(msg);
        context.setSymbolShape(shape);
        context.setSizeConstraints(minSize, maxSize);
        if (msg.startsWith(MACRO_05_HEADER) && msg.endsWith(MACRO_TRAILER)) {
            context.writeCodeword(MACRO_05);
            context.setSkipAtEnd(2);
            context.pos += MACRO_05_HEADER.length;
        }
        else if (msg.startsWith(MACRO_06_HEADER) && msg.endsWith(MACRO_TRAILER)) {
            context.writeCodeword(MACRO_06);
            context.setSkipAtEnd(2);
            context.pos += MACRO_06_HEADER.length;
        }
        var encodingMode = ASCII_ENCODATION; // Default mode
        if (forceC40) {
            c40Encoder.encodeMaximal(context);
            encodingMode = context.getNewEncoding();
            context.resetEncoderSignal();
        }
        while (context.hasMoreCharacters()) {
            encoders[encodingMode].encode(context);
            if (context.getNewEncoding() >= 0) {
                encodingMode = context.getNewEncoding();
                context.resetEncoderSignal();
            }
        }
        var len = context.getCodewordCount();
        context.updateSymbolInfo();
        var capacity = context.getSymbolInfo().getDataCapacity();
        if (len < capacity &&
            encodingMode !== ASCII_ENCODATION &&
            encodingMode !== BASE256_ENCODATION &&
            encodingMode !== EDIFACT_ENCODATION) {
            context.writeCodeword('\u00fe'); // Unlatch (254)
        }
        // Padding
        var codewords = context.getCodewords();
        if (codewords.length() < capacity) {
            codewords.append(PAD);
        }
        while (codewords.length() < capacity) {
            codewords.append(this.randomize253State(codewords.length() + 1));
        }
        return context.getCodewords().toString();
    };
    HighLevelEncoder.lookAheadTest = function (msg, startpos, currentMode) {
        var newMode = this.lookAheadTestIntern(msg, startpos, currentMode);
        if (currentMode === X12_ENCODATION && newMode === X12_ENCODATION) {
            var endpos = Math.min(startpos + 3, msg.length);
            for (var i = startpos; i < endpos; i++) {
                if (!this.isNativeX12(msg.charCodeAt(i))) {
                    return ASCII_ENCODATION;
                }
            }
        }
        else if (currentMode === EDIFACT_ENCODATION &&
            newMode === EDIFACT_ENCODATION) {
            var endpos = Math.min(startpos + 4, msg.length);
            for (var i = startpos; i < endpos; i++) {
                if (!this.isNativeEDIFACT(msg.charCodeAt(i))) {
                    return ASCII_ENCODATION;
                }
            }
        }
        return newMode;
    };
    HighLevelEncoder.lookAheadTestIntern = function (msg, startpos, currentMode) {
        if (startpos >= msg.length) {
            return currentMode;
        }
        var charCounts;
        // step J
        if (currentMode === ASCII_ENCODATION) {
            charCounts = [0, 1, 1, 1, 1, 1.25];
        }
        else {
            charCounts = [1, 2, 2, 2, 2, 2.25];
            charCounts[currentMode] = 0;
        }
        var charsProcessed = 0;
        var mins = new Uint8Array(6);
        var intCharCounts = [];
        while (true) {
            // step K
            if (startpos + charsProcessed === msg.length) {
                Arrays.fill(mins, 0);
                Arrays.fill(intCharCounts, 0);
                var min = this.findMinimums(charCounts, intCharCounts, Integer.MAX_VALUE, mins);
                var minCount = this.getMinimumCount(mins);
                if (intCharCounts[ASCII_ENCODATION] === min) {
                    return ASCII_ENCODATION;
                }
                if (minCount === 1) {
                    if (mins[BASE256_ENCODATION] > 0) {
                        return BASE256_ENCODATION;
                    }
                    if (mins[EDIFACT_ENCODATION] > 0) {
                        return EDIFACT_ENCODATION;
                    }
                    if (mins[TEXT_ENCODATION] > 0) {
                        return TEXT_ENCODATION;
                    }
                    if (mins[X12_ENCODATION] > 0) {
                        return X12_ENCODATION;
                    }
                }
                return C40_ENCODATION;
            }
            var c = msg.charCodeAt(startpos + charsProcessed);
            charsProcessed++;
            // step L
            if (this.isDigit(c)) {
                charCounts[ASCII_ENCODATION] += 0.5;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[ASCII_ENCODATION] = Math.ceil(charCounts[ASCII_ENCODATION]);
                charCounts[ASCII_ENCODATION] += 2.0;
            }
            else {
                charCounts[ASCII_ENCODATION] = Math.ceil(charCounts[ASCII_ENCODATION]);
                charCounts[ASCII_ENCODATION]++;
            }
            // step M
            if (this.isNativeC40(c)) {
                charCounts[C40_ENCODATION] += 2.0 / 3.0;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[C40_ENCODATION] += 8.0 / 3.0;
            }
            else {
                charCounts[C40_ENCODATION] += 4.0 / 3.0;
            }
            // step N
            if (this.isNativeText(c)) {
                charCounts[TEXT_ENCODATION] += 2.0 / 3.0;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[TEXT_ENCODATION] += 8.0 / 3.0;
            }
            else {
                charCounts[TEXT_ENCODATION] += 4.0 / 3.0;
            }
            // step O
            if (this.isNativeX12(c)) {
                charCounts[X12_ENCODATION] += 2.0 / 3.0;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[X12_ENCODATION] += 13.0 / 3.0;
            }
            else {
                charCounts[X12_ENCODATION] += 10.0 / 3.0;
            }
            // step P
            if (this.isNativeEDIFACT(c)) {
                charCounts[EDIFACT_ENCODATION] += 3.0 / 4.0;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[EDIFACT_ENCODATION] += 17.0 / 4.0;
            }
            else {
                charCounts[EDIFACT_ENCODATION] += 13.0 / 4.0;
            }
            // step Q
            if (this.isSpecialB256(c)) {
                charCounts[BASE256_ENCODATION] += 4.0;
            }
            else {
                charCounts[BASE256_ENCODATION]++;
            }
            // step R
            if (charsProcessed >= 4) {
                Arrays.fill(mins, 0);
                Arrays.fill(intCharCounts, 0);
                this.findMinimums(charCounts, intCharCounts, Integer.MAX_VALUE, mins);
                if (intCharCounts[ASCII_ENCODATION] <
                    this.min(intCharCounts[BASE256_ENCODATION], intCharCounts[C40_ENCODATION], intCharCounts[TEXT_ENCODATION], intCharCounts[X12_ENCODATION], intCharCounts[EDIFACT_ENCODATION])) {
                    return ASCII_ENCODATION;
                }
                if (intCharCounts[BASE256_ENCODATION] < intCharCounts[ASCII_ENCODATION] ||
                    intCharCounts[BASE256_ENCODATION] + 1 <
                        this.min(intCharCounts[C40_ENCODATION], intCharCounts[TEXT_ENCODATION], intCharCounts[X12_ENCODATION], intCharCounts[EDIFACT_ENCODATION])) {
                    return BASE256_ENCODATION;
                }
                if (intCharCounts[EDIFACT_ENCODATION] + 1 <
                    this.min(intCharCounts[BASE256_ENCODATION], intCharCounts[C40_ENCODATION], intCharCounts[TEXT_ENCODATION], intCharCounts[X12_ENCODATION], intCharCounts[ASCII_ENCODATION])) {
                    return EDIFACT_ENCODATION;
                }
                if (intCharCounts[TEXT_ENCODATION] + 1 <
                    this.min(intCharCounts[BASE256_ENCODATION], intCharCounts[C40_ENCODATION], intCharCounts[EDIFACT_ENCODATION], intCharCounts[X12_ENCODATION], intCharCounts[ASCII_ENCODATION])) {
                    return TEXT_ENCODATION;
                }
                if (intCharCounts[X12_ENCODATION] + 1 <
                    this.min(intCharCounts[BASE256_ENCODATION], intCharCounts[C40_ENCODATION], intCharCounts[EDIFACT_ENCODATION], intCharCounts[TEXT_ENCODATION], intCharCounts[ASCII_ENCODATION])) {
                    return X12_ENCODATION;
                }
                if (intCharCounts[C40_ENCODATION] + 1 <
                    this.min(intCharCounts[ASCII_ENCODATION], intCharCounts[BASE256_ENCODATION], intCharCounts[EDIFACT_ENCODATION], intCharCounts[TEXT_ENCODATION])) {
                    if (intCharCounts[C40_ENCODATION] < intCharCounts[X12_ENCODATION]) {
                        return C40_ENCODATION;
                    }
                    if (intCharCounts[C40_ENCODATION] === intCharCounts[X12_ENCODATION]) {
                        var p = startpos + charsProcessed + 1;
                        while (p < msg.length) {
                            var tc = msg.charCodeAt(p);
                            if (this.isX12TermSep(tc)) {
                                return X12_ENCODATION;
                            }
                            if (!this.isNativeX12(tc)) {
                                break;
                            }
                            p++;
                        }
                        return C40_ENCODATION;
                    }
                }
            }
        }
    };
    HighLevelEncoder.min = function (f1, f2, f3, f4, f5) {
        var val = Math.min(f1, Math.min(f2, Math.min(f3, f4)));
        if (f5 === undefined) {
            return val;
        }
        else {
            return Math.min(val, f5);
        }
    };
    HighLevelEncoder.findMinimums = function (charCounts, intCharCounts, min, mins) {
        for (var i = 0; i < 6; i++) {
            var current = (intCharCounts[i] = Math.ceil(charCounts[i]));
            if (min > current) {
                min = current;
                Arrays.fill(mins, 0);
            }
            if (min === current) {
                mins[i] = mins[i] + 1;
            }
        }
        return min;
    };
    HighLevelEncoder.getMinimumCount = function (mins) {
        var minCount = 0;
        for (var i = 0; i < 6; i++) {
            minCount += mins[i];
        }
        return minCount || 0;
    };
    HighLevelEncoder.isDigit = function (ch) {
        return ch >= '0'.charCodeAt(0) && ch <= '9'.charCodeAt(0);
    };
    HighLevelEncoder.isExtendedASCII = function (ch) {
        return ch >= 128 && ch <= 255;
    };
    HighLevelEncoder.isNativeC40 = function (ch) {
        return (ch === ' '.charCodeAt(0) ||
            (ch >= '0'.charCodeAt(0) && ch <= '9'.charCodeAt(0)) ||
            (ch >= 'A'.charCodeAt(0) && ch <= 'Z'.charCodeAt(0)));
    };
    HighLevelEncoder.isNativeText = function (ch) {
        return (ch === ' '.charCodeAt(0) ||
            (ch >= '0'.charCodeAt(0) && ch <= '9'.charCodeAt(0)) ||
            (ch >= 'a'.charCodeAt(0) && ch <= 'z'.charCodeAt(0)));
    };
    HighLevelEncoder.isNativeX12 = function (ch) {
        return (this.isX12TermSep(ch) ||
            ch === ' '.charCodeAt(0) ||
            (ch >= '0'.charCodeAt(0) && ch <= '9'.charCodeAt(0)) ||
            (ch >= 'A'.charCodeAt(0) && ch <= 'Z'.charCodeAt(0)));
    };
    HighLevelEncoder.isX12TermSep = function (ch) {
        return (ch === 13 || // CR
            ch === '*'.charCodeAt(0) ||
            ch === '>'.charCodeAt(0));
    };
    HighLevelEncoder.isNativeEDIFACT = function (ch) {
        return ch >= ' '.charCodeAt(0) && ch <= '^'.charCodeAt(0);
    };
    HighLevelEncoder.isSpecialB256 = function (ch) {
        return false; // TODO NOT IMPLEMENTED YET!!!
    };
    /**
     * Determines the number of consecutive characters that are encodable using numeric compaction.
     *
     * @param msg      the message
     * @param startpos the start position within the message
     * @return the requested character count
     */
    HighLevelEncoder.determineConsecutiveDigitCount = function (msg, startpos) {
        if (startpos === void 0) { startpos = 0; }
        var len = msg.length;
        var idx = startpos;
        while (idx < len && this.isDigit(msg.charCodeAt(idx))) {
            idx++;
        }
        return idx - startpos;
    };
    HighLevelEncoder.illegalCharacter = function (singleCharacter) {
        var hex = Integer.toHexString(singleCharacter.charCodeAt(0));
        hex = '0000'.substring(0, 4 - hex.length) + hex;
        throw new Error('Illegal character: ' + singleCharacter + ' (0x' + hex + ')');
    };
    return HighLevelEncoder;
}());
export default HighLevelEncoder;
