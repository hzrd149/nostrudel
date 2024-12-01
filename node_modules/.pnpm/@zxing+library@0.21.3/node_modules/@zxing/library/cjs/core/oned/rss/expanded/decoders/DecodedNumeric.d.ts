import DecodedObject from './DecodedObject';
export default class DecodedNumeric extends DecodedObject {
    private readonly firstDigit;
    private readonly secondDigit;
    static readonly FNC1: number;
    constructor(newPosition: number, firstDigit: number, secondDigit: number);
    getFirstDigit(): number;
    getSecondDigit(): number;
    getValue(): number;
    isFirstDigitFNC1(): boolean;
    isSecondDigitFNC1(): boolean;
    isAnyFNC1(): boolean;
}
