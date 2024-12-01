import BitArray from '../../common/BitArray';
import Token from './Token';
import { int } from '../../../customTypings';
/**
 * State represents all information about a sequence necessary to generate the current output.
 * Note that a state is immutable.
 */
export default class State {
    static INITIAL_STATE: State;
    private mode;
    private token;
    private binaryShiftByteCount;
    private bitCount;
    private constructor();
    getMode(): int;
    getToken(): Token;
    getBinaryShiftByteCount(): int;
    getBitCount(): int;
    latchAndAppend(mode: int, value: int): State;
    shiftAndAppend(mode: int, value: int): State;
    addBinaryShiftChar(index: int): State;
    endBinaryShift(index: int): State;
    isBetterThanOrEqualTo(other: State): boolean;
    toBitArray(text: Uint8Array): BitArray;
    /**
     * @Override
     */
    toString(): String;
    private static calculateBinaryShiftCost;
}
