import StringBuilder from '../../util/StringBuilder';
import SymbolInfo from './SymbolInfo';
export class EncoderContext {
    constructor(msg) {
        this.msg = msg;
        this.pos = 0;
        this.skipAtEnd = 0;
        // From this point on Strings are not Unicode anymore!
        const msgBinary = msg.split('').map(c => c.charCodeAt(0));
        const sb = new StringBuilder();
        for (let i = 0, c = msgBinary.length; i < c; i++) {
            const ch = String.fromCharCode(msgBinary[i] & 0xff);
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
    setSymbolShape(shape) {
        this.shape = shape;
    }
    setSizeConstraints(minSize, maxSize) {
        this.minSize = minSize;
        this.maxSize = maxSize;
    }
    getMessage() {
        return this.msg;
    }
    setSkipAtEnd(count) {
        this.skipAtEnd = count;
    }
    getCurrentChar() {
        return this.msg.charCodeAt(this.pos);
    }
    getCurrent() {
        return this.msg.charCodeAt(this.pos);
    }
    getCodewords() {
        return this.codewords;
    }
    writeCodewords(codewords) {
        this.codewords.append(codewords);
    }
    writeCodeword(codeword) {
        this.codewords.append(codeword);
    }
    getCodewordCount() {
        return this.codewords.length();
    }
    getNewEncoding() {
        return this.newEncoding;
    }
    signalEncoderChange(encoding) {
        this.newEncoding = encoding;
    }
    resetEncoderSignal() {
        this.newEncoding = -1;
    }
    hasMoreCharacters() {
        return this.pos < this.getTotalMessageCharCount();
    }
    getTotalMessageCharCount() {
        return this.msg.length - this.skipAtEnd;
    }
    getRemainingCharacters() {
        return this.getTotalMessageCharCount() - this.pos;
    }
    getSymbolInfo() {
        return this.symbolInfo;
    }
    updateSymbolInfo(len = this.getCodewordCount()) {
        if (this.symbolInfo == null || len > this.symbolInfo.getDataCapacity()) {
            this.symbolInfo = SymbolInfo.lookup(len, this.shape, this.minSize, this.maxSize, true);
        }
    }
    resetSymbolInfo() {
        this.symbolInfo = null;
    }
}
