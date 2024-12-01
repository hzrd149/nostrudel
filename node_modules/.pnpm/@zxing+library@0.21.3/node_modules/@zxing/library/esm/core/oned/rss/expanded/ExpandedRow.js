var ExpandedRow = /** @class */ (function () {
    function ExpandedRow(pairs, rowNumber, wasReversed) {
        this.pairs = pairs;
        this.rowNumber = rowNumber;
        this.wasReversed = wasReversed;
    }
    ExpandedRow.prototype.getPairs = function () {
        return this.pairs;
    };
    ExpandedRow.prototype.getRowNumber = function () {
        return this.rowNumber;
    };
    ExpandedRow.prototype.isReversed = function () {
        return this.wasReversed;
    };
    // check implementation
    ExpandedRow.prototype.isEquivalent = function (otherPairs) {
        return this.checkEqualitity(this, otherPairs);
    };
    // @Override
    ExpandedRow.prototype.toString = function () {
        return '{ ' + this.pairs + ' }';
    };
    /**
     * Two rows are equal if they contain the same pairs in the same order.
     */
    // @Override
    // check implementation
    ExpandedRow.prototype.equals = function (o1, o2) {
        if (!(o1 instanceof ExpandedRow)) {
            return false;
        }
        return this.checkEqualitity(o1, o2) && o1.wasReversed === o2.wasReversed;
    };
    ExpandedRow.prototype.checkEqualitity = function (pair1, pair2) {
        if (!pair1 || !pair2)
            return;
        var result;
        pair1.forEach(function (e1, i) {
            pair2.forEach(function (e2) {
                if (e1.getLeftChar().getValue() === e2.getLeftChar().getValue() && e1.getRightChar().getValue() === e2.getRightChar().getValue() && e1.getFinderPatter().getValue() === e2.getFinderPatter().getValue()) {
                    result = true;
                }
            });
        });
        return result;
    };
    return ExpandedRow;
}());
export default ExpandedRow;
