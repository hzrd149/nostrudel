import ExpandedPair from './ExpandedPair';
export default class ExpandedRow {
    private readonly pairs;
    private readonly rowNumber;
    private readonly wasReversed;
    constructor(pairs: Array<ExpandedPair>, rowNumber: number, wasReversed: boolean);
    getPairs(): Array<ExpandedPair>;
    getRowNumber(): number;
    isReversed(): boolean;
    isEquivalent(otherPairs: Array<ExpandedPair>): boolean;
    toString(): String;
    /**
     * Two rows are equal if they contain the same pairs in the same order.
     */
    equals(o1: ExpandedRow, o2: ExpandedRow): boolean;
    checkEqualitity(pair1: any, pair2: any): boolean;
}
