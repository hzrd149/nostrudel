export default class DataCharacter {
    private value;
    private checksumPortion;
    constructor(value: number, checksumPortion: number);
    getValue(): number;
    getChecksumPortion(): number;
    toString(): string;
    equals(o: object): boolean;
    hashCode(): number;
}
