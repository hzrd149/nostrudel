import BitArray from '../../common/BitArray';
import { int } from '../../../customTypings';
export default abstract class Token {
    private previous;
    constructor(previous: Token);
    getPrevious(): Token;
    abstract add(value: int, bitCount: int): Token;
    abstract addBinaryShift(start: int, byteCount: int): Token;
    abstract appendTo(bitArray: BitArray, text: Uint8Array): void;
}
