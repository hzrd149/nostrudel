export default class ExpandedRow {
    constructor(pairs, rowNumber, wasReversed) {
        this.pairs = pairs;
        this.rowNumber = rowNumber;
        this.wasReversed = wasReversed;
    }
    getPairs() {
        return this.pairs;
    }
    getRowNumber() {
        return this.rowNumber;
    }
    isReversed() {
        return this.wasReversed;
    }
    // check implementation
    isEquivalent(otherPairs) {
        return this.checkEqualitity(this, otherPairs);
    }
    // @Override
    toString() {
        return '{ ' + this.pairs + ' }';
    }
    /**
     * Two rows are equal if they contain the same pairs in the same order.
     */
    // @Override
    // check implementation
    equals(o1, o2) {
        if (!(o1 instanceof ExpandedRow)) {
            return false;
        }
        return this.checkEqualitity(o1, o2) && o1.wasReversed === o2.wasReversed;
    }
    checkEqualitity(pair1, pair2) {
        if (!pair1 || !pair2)
            return;
        let result;
        pair1.forEach((e1, i) => {
            pair2.forEach(e2 => {
                if (e1.getLeftChar().getValue() === e2.getLeftChar().getValue() && e1.getRightChar().getValue() === e2.getRightChar().getValue() && e1.getFinderPatter().getValue() === e2.getFinderPatter().getValue()) {
                    result = true;
                }
            });
        });
        return result;
    }
}
