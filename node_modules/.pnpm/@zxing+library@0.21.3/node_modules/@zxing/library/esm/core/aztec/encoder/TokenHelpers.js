import SimpleToken from './SimpleToken';
import BinaryShiftToken from './BinaryShiftToken';
export function addBinaryShift(token, start, byteCount) {
    // int bitCount = (byteCount * 8) + (byteCount <= 31 ? 10 : byteCount <= 62 ? 20 : 21);
    return new BinaryShiftToken(token, start, byteCount);
}
export function add(token, value, bitCount) {
    return new SimpleToken(token, value, bitCount);
}
