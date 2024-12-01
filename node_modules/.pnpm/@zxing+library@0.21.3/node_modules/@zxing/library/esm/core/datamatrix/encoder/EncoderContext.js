import StringBuilder from '../../util/StringBuilder';
import SymbolInfo from './SymbolInfo';
var EncoderContext = /** @class */ (function () {
    function EncoderContext(msg) {
        this.msg = msg;
        this.pos = 0;
        this.skipAtEnd = 0;
        // From this point on Strings are not Unicode anymore!
        var msgBinary = msg.split('').map(function (c) { return c.charCodeAt(0); });
        var sb = new StringBuilder();
        for (var i = 0, c = msgBinary.length; i < c; i++) {
            var ch = String.fromCharCode(msgBinary[i] & 0xff);
            if (ch === '?' && msg.charAt(i) !== '?') {
                throw new Error('Message contains characters outside ISO-8859-1 encoding.');
            }
            sb.append(ch);
        }
        this.msg = sb.toString(); // Not Unicode here!
        this.shape = 0 /* FORCE_NONE */;
        this.codewords = new StringBuilder();
        this.newEncoding = -1;
    }
    EncoderContext.prototype.setSymbolShape = function (shape) {
        this.shape = shape;
    };
    EncoderContext.prototype.setSizeConstraints = function (minSize, maxSize) {
        this.minSize = minSize;
        this.maxSize = maxSize;
    };
    EncoderContext.prototype.getMessage = function () {
        return this.msg;
    };
    EncoderContext.prototype.setSkipAtEnd = function (count) {
        this.skipAtEnd = count;
    };
    EncoderContext.prototype.getCurrentChar = function () {
        return this.msg.charCodeAt(this.pos);
    };
    EncoderContext.prototype.getCurrent = function () {
        return this.msg.charCodeAt(this.pos);
    };
    EncoderContext.prototype.getCodewords = function () {
        return this.codewords;
    };
    EncoderContext.prototype.writeCodewords = function (codewords) {
        this.codewords.append(codewords);
    };
    EncoderContext.prototype.writeCodeword = function (codeword) {
        this.codewords.append(codeword);
    };
    EncoderContext.prototype.getCodewordCount = function () {
        return this.codewords.length();
    };
    EncoderContext.prototype.getNewEncoding = function () {
        return this.newEncoding;
    };
    EncoderContext.prototype.signalEncoderChange = function (encoding) {
        this.newEncoding = encoding;
    };
    EncoderContext.prototype.resetEncoderSignal = function () {
        this.newEncoding = -1;
    };
    EncoderContext.prototype.hasMoreCharacters = function () {
        return this.pos < this.getTotalMessageCharCount();
    };
    EncoderContext.prototype.getTotalMessageCharCount = function () {
        return this.msg.length - this.skipAtEnd;
    };
    EncoderContext.prototype.getRemainingCharacters = function () {
        return this.getTotalMessageCharCount() - this.pos;
    };
    EncoderContext.prototype.getSymbolInfo = function () {
        return this.symbolInfo;
    };
    EncoderContext.prototype.updateSymbolInfo = function (len) {
        if (len === void 0) { len = this.getCodewordCount(); }
        if (this.symbolInfo == null || len > this.symbolInfo.getDataCapacity()) {
            this.symbolInfo = SymbolInfo.lookup(len, this.shape, this.minSize, this.maxSize, true);
        }
    };
    EncoderContext.prototype.resetSymbolInfo = function () {
        this.symbolInfo = null;
    };
    return EncoderContext;
}());
export { EncoderContext };
