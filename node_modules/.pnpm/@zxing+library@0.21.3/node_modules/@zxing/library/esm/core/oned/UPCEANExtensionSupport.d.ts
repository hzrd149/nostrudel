import BitArray from '../common/BitArray';
import Result from '../Result';
export default class UPCEANExtensionSupport {
    private static EXTENSION_START_PATTERN;
    static decodeRow(rowNumber: number, row: BitArray, rowOffset: number): Result;
}
