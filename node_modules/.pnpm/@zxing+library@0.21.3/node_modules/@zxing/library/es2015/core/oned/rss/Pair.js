import DataCharacter from './DataCharacter';
export default class Pair extends DataCharacter {
    constructor(value, checksumPortion, finderPattern) {
        super(value, checksumPortion);
        this.count = 0;
        this.finderPattern = finderPattern;
    }
    getFinderPattern() {
        return this.finderPattern;
    }
    getCount() {
        return this.count;
    }
    incrementCount() {
        this.count++;
    }
}
