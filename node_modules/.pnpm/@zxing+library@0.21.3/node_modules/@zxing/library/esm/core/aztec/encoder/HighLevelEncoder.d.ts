import BitArray from '../../common/BitArray';
/**
 * This produces nearly optimal encodings of text into the first-level of
 * encoding used by Aztec code.
 *
 * It uses a dynamic algorithm.  For each prefix of the string, it determines
 * a set of encodings that could lead to this prefix.  We repeatedly add a
 * character and generate a new set of optimal encodings until we have read
 * through the entire input.
 *
 * @author Frank Yellin
 * @author Rustam Abdullaev
 */
export default class HighLevelEncoder {
    private text;
    constructor(text: Uint8Array);
    /**
     * @return text represented by this encoder encoded as a {@link BitArray}
     */
    encode(): BitArray;
    private updateStateListForChar;
    private updateStateForChar;
    private static updateStateListForPair;
    private static updateStateForPair;
    private static simplifyStates;
}
