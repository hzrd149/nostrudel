import Charset from '../../util/Charset';
import { char } from '../../../customTypings';
import { SymbolShapeHint } from './constants';
import { MinimalECIInput } from '../../common/MinimalECIInput';
declare enum Mode {
    ASCII = 0,
    C40 = 1,
    TEXT = 2,
    X12 = 3,
    EDF = 4,
    B256 = 5
}
export declare class MinimalEncoder {
    static isExtendedASCII(ch: char, fnc1: number): boolean;
    static isInC40Shift1Set(ch: char): boolean;
    static isInC40Shift2Set(ch: char, fnc1: number): boolean;
    static isInTextShift1Set(ch: char): boolean;
    static isInTextShift2Set(ch: char, fnc1: number): boolean;
    /**
     * Performs message encoding of a DataMatrix message
     *
     * @param msg the message
     * @param priorityCharset The preferred {@link Charset}. When the value of the argument is null, the algorithm
     *   chooses charsets that leads to a minimal representation. Otherwise the algorithm will use the priority
     *   charset to encode any character in the input that can be encoded by it if the charset is among the
     *   supported charsets.
     * @param fnc1 denotes the character in the input that represents the FNC1 character or -1 if this is not a GS1
     *   bar code. If the value is not -1 then a FNC1 is also prepended.
     * @param shape requested shape.
     * @return the encoded message (the char values range from 0 to 255)
     */
    static encodeHighLevel(msg: string, priorityCharset?: Charset, fnc1?: number, shape?: SymbolShapeHint): string;
    /**
     * Encodes input minimally and returns an array of the codewords
     *
     * @param input The string to encode
     * @param priorityCharset The preferred {@link Charset}. When the value of the argument is null, the algorithm
     *   chooses charsets that leads to a minimal representation. Otherwise the algorithm will use the priority
     *   charset to encode any character in the input that can be encoded by it if the charset is among the
     *   supported charsets.
     * @param fnc1 denotes the character in the input that represents the FNC1 character or -1 if this is not a GS1
     *   bar code. If the value is not -1 then a FNC1 is also prepended.
     * @param shape requested shape.
     * @param macroId Prepends the specified macro function in case that a value of 5 or 6 is specified.
     * @return An array of bytes representing the codewords of a minimal encoding.
     */
    static encode(input: string, priorityCharset: Charset, fnc1: number, shape: SymbolShapeHint, macroId: number): Uint8Array;
    static addEdge(edges: Edge[][], edge: Edge): void;
    /** @return the number of words in which the string starting at from can be encoded in c40 or text mode.
     *  The number of characters encoded is returned in characterLength.
     *  The number of characters encoded is also minimal in the sense that the algorithm stops as soon
     *  as a character encoding fills a C40 word competely (three C40 values). An exception is at the
     *  end of the string where two C40 values are allowed (according to the spec the third c40 value
     *  is filled  with 0 (Shift 1) in this case).
     */
    static getNumberOfC40Words(input: Input, from: number, c40: boolean, characterLength: number[]): number;
    static addEdges(input: Input, edges: Edge[][], from: number, previous: Edge): void;
    static encodeMinimally(input: Input): Result;
}
declare class Result {
    private bytes;
    constructor(solution: Edge);
    prepend(bytes: Uint8Array, into: number[]): number;
    randomize253State(codewordPosition: number): number;
    applyRandomPattern(bytesAL: number[], startPosition: number, length: number): void;
    getBytes(): Uint8Array;
}
declare class Edge {
    readonly input: Input;
    readonly mode: Mode;
    readonly fromPosition: number;
    readonly characterLength: number;
    readonly previous: Edge;
    private allCodewordCapacities;
    private squareCodewordCapacities;
    private rectangularCodewordCapacities;
    cachedTotalSize: number;
    constructor(input: Input, mode: Mode, fromPosition: number, characterLength: number, previous: Edge);
    getB256Size(): number;
    getPreviousStartMode(): Mode;
    getPreviousMode(): Mode;
    /** Returns Mode.ASCII in case that:
     *  - Mode is EDIFACT and characterLength is less than 4 or the remaining characters can be encoded in at most 2
     *    ASCII bytes.
     *  - Mode is C40, TEXT or X12 and the remaining characters can be encoded in at most 1 ASCII byte.
     *  Returns mode in all other cases.
     * */
    getEndMode(): Mode;
    getMode(): Mode;
    /** Peeks ahead and returns 1 if the postfix consists of exactly two digits, 2 if the postfix consists of exactly
     *  two consecutive digits and a non extended character or of 4 digits.
     *  Returns 0 in any other case
     **/
    getLastASCII(): number;
    /** Returns the capacity in codewords of the smallest symbol that has enough capacity to fit the given minimal
     * number of codewords.
     **/
    getMinSymbolSize(minimum: number): number;
    /** Returns the remaining capacity in codewords of the smallest symbol that has enough capacity to fit the given
     * minimal number of codewords.
     **/
    getCodewordsRemaining(minimum: number): number;
    static getBytes(c1: number, c2?: number): Uint8Array;
    setC40Word(bytes: Uint8Array, offset: number, c1: number, c2: number, c3: number): void;
    getX12Value(c: number): number;
    getX12Words(): Uint8Array;
    getShiftValue(c: number, c40: boolean, fnc1: number): number;
    getC40Value(c40: boolean, setIndex: number, c: number, fnc1: number): number;
    getC40Words(c40: boolean, fnc1: number): Uint8Array;
    getEDFBytes(): Uint8Array;
    getLatchBytes(): Uint8Array;
    getDataBytes(): Uint8Array;
}
declare class Input extends MinimalECIInput {
    private readonly shape;
    private readonly macroId;
    constructor(stringToEncode: string, priorityCharset: Charset, fnc1: number, shape: SymbolShapeHint, macroId: number);
    getMacroId(): number;
    getShapeHint(): SymbolShapeHint;
}
export {};
