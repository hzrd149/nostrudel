import DataCharacter from './DataCharacter';
import FinderPattern from './FinderPattern';
export default class Pair extends DataCharacter {
    private finderPattern;
    private count;
    constructor(value: number, checksumPortion: number, finderPattern: FinderPattern);
    getFinderPattern(): FinderPattern;
    getCount(): number;
    incrementCount(): void;
}
