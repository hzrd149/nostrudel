import AbstractExpandedDecoder from './AbstractExpandedDecoder';
export default class AI01decoder extends AbstractExpandedDecoder {
    constructor(information) {
        super(information);
    }
    encodeCompressedGtin(buf, currentPos) {
        buf.append('(01)');
        let initialPosition = buf.length();
        buf.append('9');
        this.encodeCompressedGtinWithoutAI(buf, currentPos, initialPosition);
    }
    encodeCompressedGtinWithoutAI(buf, currentPos, initialBufferPosition) {
        for (let i = 0; i < 4; ++i) {
            let currentBlock = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos + 10 * i, 10);
            if (currentBlock / 100 === 0) {
                buf.append('0');
            }
            if (currentBlock / 10 === 0) {
                buf.append('0');
            }
            buf.append(currentBlock);
        }
        AI01decoder.appendCheckDigit(buf, initialBufferPosition);
    }
    static appendCheckDigit(buf, currentPos) {
        let checkDigit = 0;
        for (let i = 0; i < 13; i++) {
            // let digit = buf.charAt(i + currentPos) - '0';
            // To be checked
            let digit = buf.charAt(i + currentPos).charCodeAt(0) - '0'.charCodeAt(0);
            checkDigit += (i & 0x01) === 0 ? 3 * digit : digit;
        }
        checkDigit = 10 - (checkDigit % 10);
        if (checkDigit === 10) {
            checkDigit = 0;
        }
        buf.append(checkDigit);
    }
}
AI01decoder.GTIN_SIZE = 40;
