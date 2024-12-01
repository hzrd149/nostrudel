"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-circular-imports
var ASCIIEncoder_1 = require("./ASCIIEncoder");
// tslint:disable-next-line:no-circular-imports
var Base256Encoder_1 = require("./Base256Encoder");
// tslint:disable-next-line:no-circular-imports
var C40Encoder_1 = require("./C40Encoder");
var constants_1 = require("./constants");
// tslint:disable-next-line:no-circular-imports
var EdifactEncoder_1 = require("./EdifactEncoder");
var EncoderContext_1 = require("./EncoderContext");
// tslint:disable-next-line:no-circular-imports
var X12Encoder_1 = require("./X12Encoder");
// tslint:disable-next-line:no-circular-imports
var TextEncoder_1 = require("./TextEncoder");
var Arrays_1 = require("../../util/Arrays");
var Integer_1 = require("../../util/Integer");
/**
 * DataMatrix ECC 200 data encoder following the algorithm described in ISO/IEC 16022:200(E) in
 * annex S.
 */
var HighLevelEncoder = /** @class */ (function () {
    function HighLevelEncoder() {
    }
    HighLevelEncoder.randomize253State = function (codewordPosition) {
        var pseudoRandom = ((149 * codewordPosition) % 253) + 1;
        var tempVariable = constants_1.PAD + pseudoRandom;
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
        var c40Encoder = new C40Encoder_1.C40Encoder();
        var encoders = [
            new ASCIIEncoder_1.ASCIIEncoder(),
            c40Encoder,
            new TextEncoder_1.TextEncoder(),
            new X12Encoder_1.X12Encoder(),
            new EdifactEncoder_1.EdifactEncoder(),
            new Base256Encoder_1.Base256Encoder(),
        ];
        var context = new EncoderContext_1.EncoderContext(msg);
        context.setSymbolShape(shape);
        context.setSizeConstraints(minSize, maxSize);
        if (msg.startsWith(constants_1.MACRO_05_HEADER) && msg.endsWith(constants_1.MACRO_TRAILER)) {
            context.writeCodeword(constants_1.MACRO_05);
            context.setSkipAtEnd(2);
            context.pos += constants_1.MACRO_05_HEADER.length;
        }
        else if (msg.startsWith(constants_1.MACRO_06_HEADER) && msg.endsWith(constants_1.MACRO_TRAILER)) {
            context.writeCodeword(constants_1.MACRO_06);
            context.setSkipAtEnd(2);
            context.pos += constants_1.MACRO_06_HEADER.length;
        }
        var encodingMode = constants_1.ASCII_ENCODATION; // Default mode
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
            encodingMode !== constants_1.ASCII_ENCODATION &&
            encodingMode !== constants_1.BASE256_ENCODATION &&
            encodingMode !== constants_1.EDIFACT_ENCODATION) {
            context.writeCodeword('\u00fe'); // Unlatch (254)
        }
        // Padding
        var codewords = context.getCodewords();
        if (codewords.length() < capacity) {
            codewords.append(constants_1.PAD);
        }
        while (codewords.length() < capacity) {
            codewords.append(this.randomize253State(codewords.length() + 1));
        }
        return context.getCodewords().toString();
    };
    HighLevelEncoder.lookAheadTest = function (msg, startpos, currentMode) {
        var newMode = this.lookAheadTestIntern(msg, startpos, currentMode);
        if (currentMode === constants_1.X12_ENCODATION && newMode === constants_1.X12_ENCODATION) {
            var endpos = Math.min(startpos + 3, msg.length);
            for (var i = startpos; i < endpos; i++) {
                if (!this.isNativeX12(msg.charCodeAt(i))) {
                    return constants_1.ASCII_ENCODATION;
                }
            }
        }
        else if (currentMode === constants_1.EDIFACT_ENCODATION &&
            newMode === constants_1.EDIFACT_ENCODATION) {
            var endpos = Math.min(startpos + 4, msg.length);
            for (var i = startpos; i < endpos; i++) {
                if (!this.isNativeEDIFACT(msg.charCodeAt(i))) {
                    return constants_1.ASCII_ENCODATION;
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
        if (currentMode === constants_1.ASCII_ENCODATION) {
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
                Arrays_1.default.fill(mins, 0);
                Arrays_1.default.fill(intCharCounts, 0);
                var min = this.findMinimums(charCounts, intCharCounts, Integer_1.default.MAX_VALUE, mins);
                var minCount = this.getMinimumCount(mins);
                if (intCharCounts[constants_1.ASCII_ENCODATION] === min) {
                    return constants_1.ASCII_ENCODATION;
                }
                if (minCount === 1) {
                    if (mins[constants_1.BASE256_ENCODATION] > 0) {
                        return constants_1.BASE256_ENCODATION;
                    }
                    if (mins[constants_1.EDIFACT_ENCODATION] > 0) {
                        return constants_1.EDIFACT_ENCODATION;
                    }
                    if (mins[constants_1.TEXT_ENCODATION] > 0) {
                        return constants_1.TEXT_ENCODATION;
                    }
                    if (mins[constants_1.X12_ENCODATION] > 0) {
                        return constants_1.X12_ENCODATION;
                    }
                }
                return constants_1.C40_ENCODATION;
            }
            var c = msg.charCodeAt(startpos + charsProcessed);
            charsProcessed++;
            // step L
            if (this.isDigit(c)) {
                charCounts[constants_1.ASCII_ENCODATION] += 0.5;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[constants_1.ASCII_ENCODATION] = Math.ceil(charCounts[constants_1.ASCII_ENCODATION]);
                charCounts[constants_1.ASCII_ENCODATION] += 2.0;
            }
            else {
                charCounts[constants_1.ASCII_ENCODATION] = Math.ceil(charCounts[constants_1.ASCII_ENCODATION]);
                charCounts[constants_1.ASCII_ENCODATION]++;
            }
            // step M
            if (this.isNativeC40(c)) {
                charCounts[constants_1.C40_ENCODATION] += 2.0 / 3.0;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[constants_1.C40_ENCODATION] += 8.0 / 3.0;
            }
            else {
                charCounts[constants_1.C40_ENCODATION] += 4.0 / 3.0;
            }
            // step N
            if (this.isNativeText(c)) {
                charCounts[constants_1.TEXT_ENCODATION] += 2.0 / 3.0;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[constants_1.TEXT_ENCODATION] += 8.0 / 3.0;
            }
            else {
                charCounts[constants_1.TEXT_ENCODATION] += 4.0 / 3.0;
            }
            // step O
            if (this.isNativeX12(c)) {
                charCounts[constants_1.X12_ENCODATION] += 2.0 / 3.0;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[constants_1.X12_ENCODATION] += 13.0 / 3.0;
            }
            else {
                charCounts[constants_1.X12_ENCODATION] += 10.0 / 3.0;
            }
            // step P
            if (this.isNativeEDIFACT(c)) {
                charCounts[constants_1.EDIFACT_ENCODATION] += 3.0 / 4.0;
            }
            else if (this.isExtendedASCII(c)) {
                charCounts[constants_1.EDIFACT_ENCODATION] += 17.0 / 4.0;
            }
            else {
                charCounts[constants_1.EDIFACT_ENCODATION] += 13.0 / 4.0;
            }
            // step Q
            if (this.isSpecialB256(c)) {
                charCounts[constants_1.BASE256_ENCODATION] += 4.0;
            }
            else {
                charCounts[constants_1.BASE256_ENCODATION]++;
            }
            // step R
            if (charsProcessed >= 4) {
                Arrays_1.default.fill(mins, 0);
                Arrays_1.default.fill(intCharCounts, 0);
                this.findMinimums(charCounts, intCharCounts, Integer_1.default.MAX_VALUE, mins);
                if (intCharCounts[constants_1.ASCII_ENCODATION] <
                    this.min(intCharCounts[constants_1.BASE256_ENCODATION], intCharCounts[constants_1.C40_ENCODATION], intCharCounts[constants_1.TEXT_ENCODATION], intCharCounts[constants_1.X12_ENCODATION], intCharCounts[constants_1.EDIFACT_ENCODATION])) {
                    return constants_1.ASCII_ENCODATION;
                }
                if (intCharCounts[constants_1.BASE256_ENCODATION] < intCharCounts[constants_1.ASCII_ENCODATION] ||
                    intCharCounts[constants_1.BASE256_ENCODATION] + 1 <
                        this.min(intCharCounts[constants_1.C40_ENCODATION], intCharCounts[constants_1.TEXT_ENCODATION], intCharCounts[constants_1.X12_ENCODATION], intCharCounts[constants_1.EDIFACT_ENCODATION])) {
                    return constants_1.BASE256_ENCODATION;
                }
                if (intCharCounts[constants_1.EDIFACT_ENCODATION] + 1 <
                    this.min(intCharCounts[constants_1.BASE256_ENCODATION], intCharCounts[constants_1.C40_ENCODATION], intCharCounts[constants_1.TEXT_ENCODATION], intCharCounts[constants_1.X12_ENCODATION], intCharCounts[constants_1.ASCII_ENCODATION])) {
                    return constants_1.EDIFACT_ENCODATION;
                }
                if (intCharCounts[constants_1.TEXT_ENCODATION] + 1 <
                    this.min(intCharCounts[constants_1.BASE256_ENCODATION], intCharCounts[constants_1.C40_ENCODATION], intCharCounts[constants_1.EDIFACT_ENCODATION], intCharCounts[constants_1.X12_ENCODATION], intCharCounts[constants_1.ASCII_ENCODATION])) {
                    return constants_1.TEXT_ENCODATION;
                }
                if (intCharCounts[constants_1.X12_ENCODATION] + 1 <
                    this.min(intCharCounts[constants_1.BASE256_ENCODATION], intCharCounts[constants_1.C40_ENCODATION], intCharCounts[constants_1.EDIFACT_ENCODATION], intCharCounts[constants_1.TEXT_ENCODATION], intCharCounts[constants_1.ASCII_ENCODATION])) {
                    return constants_1.X12_ENCODATION;
                }
                if (intCharCounts[constants_1.C40_ENCODATION] + 1 <
                    this.min(intCharCounts[constants_1.ASCII_ENCODATION], intCharCounts[constants_1.BASE256_ENCODATION], intCharCounts[constants_1.EDIFACT_ENCODATION], intCharCounts[constants_1.TEXT_ENCODATION])) {
                    if (intCharCounts[constants_1.C40_ENCODATION] < intCharCounts[constants_1.X12_ENCODATION]) {
                        return constants_1.C40_ENCODATION;
                    }
                    if (intCharCounts[constants_1.C40_ENCODATION] === intCharCounts[constants_1.X12_ENCODATION]) {
                        var p = startpos + charsProcessed + 1;
                        while (p < msg.length) {
                            var tc = msg.charCodeAt(p);
                            if (this.isX12TermSep(tc)) {
                                return constants_1.X12_ENCODATION;
                            }
                            if (!this.isNativeX12(tc)) {
                                break;
                            }
                            p++;
                        }
                        return constants_1.C40_ENCODATION;
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
                Arrays_1.default.fill(mins, 0);
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
        var hex = Integer_1.default.toHexString(singleCharacter.charCodeAt(0));
        hex = '0000'.substring(0, 4 - hex.length) + hex;
        throw new Error('Illegal character: ' + singleCharacter + ' (0x' + hex + ')');
    };
    return HighLevelEncoder;
}());
exports.default = HighLevelEncoder;
