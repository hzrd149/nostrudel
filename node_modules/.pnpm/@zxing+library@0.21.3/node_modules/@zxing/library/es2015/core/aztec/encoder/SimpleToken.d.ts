import BitArray from '../../common/BitArray';
import Token from './Token';
import { int } from '../../../customTypings';
export default class SimpleToken extends Token {
    private value;
    private bitCount;
    constructor(previous: Token, value: int, bitCount: int);
    /**
     * @Override
     */
    appendTo(bitArray: BitArray, text: Uint8Array): void;
    add(value: int, bitCount: int): Token;
    addBinaryShift(start: int, byteCount: int): Token;
    /**
     * @Override
     */
    toString(): String;
}
