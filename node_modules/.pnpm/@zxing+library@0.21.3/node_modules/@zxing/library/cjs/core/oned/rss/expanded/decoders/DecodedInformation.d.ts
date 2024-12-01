import DecodedObject from './DecodedObject';
export default class DecodedInformation extends DecodedObject {
    private readonly newString;
    private readonly remainingValue;
    private readonly remaining;
    constructor(newPosition: number, newString: string, remainingValue?: number);
    getNewString(): string;
    isRemaining(): boolean;
    getRemainingValue(): number;
}
