var ExpandedPair = /** @class */ (function () {
    function ExpandedPair(leftChar, rightChar, finderPatter, mayBeLast) {
        this.leftchar = leftChar;
        this.rightchar = rightChar;
        this.finderpattern = finderPatter;
        this.maybeLast = mayBeLast;
    }
    ExpandedPair.prototype.mayBeLast = function () {
        return this.maybeLast;
    };
    ExpandedPair.prototype.getLeftChar = function () {
        return this.leftchar;
    };
    ExpandedPair.prototype.getRightChar = function () {
        return this.rightchar;
    };
    ExpandedPair.prototype.getFinderPattern = function () {
        return this.finderpattern;
    };
    ExpandedPair.prototype.mustBeLast = function () {
        return this.rightchar == null;
    };
    ExpandedPair.prototype.toString = function () {
        return '[ ' + this.leftchar + ', ' + this.rightchar + ' : ' + (this.finderpattern == null ? 'null' : this.finderpattern.getValue()) + ' ]';
    };
    ExpandedPair.equals = function (o1, o2) {
        if (!(o1 instanceof ExpandedPair)) {
            return false;
        }
        return ExpandedPair.equalsOrNull(o1.leftchar, o2.leftchar) &&
            ExpandedPair.equalsOrNull(o1.rightchar, o2.rightchar) &&
            ExpandedPair.equalsOrNull(o1.finderpattern, o2.finderpattern);
    };
    ExpandedPair.equalsOrNull = function (o1, o2) {
        return o1 === null ? o2 === null : ExpandedPair.equals(o1, o2);
    };
    ExpandedPair.prototype.hashCode = function () {
        // return ExpandedPair.hashNotNull(leftChar) ^ hashNotNull(rightChar) ^ hashNotNull(finderPattern);
        var value = this.leftchar.getValue() ^ this.rightchar.getValue() ^ this.finderpattern.getValue();
        return value;
    };
    return ExpandedPair;
}());
export default ExpandedPair;
