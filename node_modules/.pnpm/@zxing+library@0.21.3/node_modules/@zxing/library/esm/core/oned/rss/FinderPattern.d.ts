import ResultPoint from '../../ResultPoint';
export default class FinderPattern {
    private value;
    private startEnd;
    private resultPoints;
    constructor(value: number, startEnd: number[], start: number, end: number, rowNumber: number);
    getValue(): number;
    getStartEnd(): number[];
    getResultPoints(): Array<ResultPoint>;
    equals(o: object): boolean;
    hashCode(): number;
}
