import DecodedObject from './DecodedObject';
export default class DecodedChar extends DecodedObject {
    private readonly value;
    static readonly FNC1 = "$";
    constructor(newPosition: number, value: string);
    getValue(): string;
    isFNC1(): boolean;
}
