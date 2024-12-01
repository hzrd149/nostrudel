import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';
import AbstractExpandedDecoder from './AbstractExpandedDecoder';
export default abstract class AI01decoder extends AbstractExpandedDecoder {
    static readonly GTIN_SIZE: number;
    constructor(information: BitArray);
    encodeCompressedGtin(buf: StringBuilder, currentPos: number): void;
    encodeCompressedGtinWithoutAI(buf: StringBuilder, currentPos: number, initialBufferPosition: number): void;
    private static appendCheckDigit;
}
