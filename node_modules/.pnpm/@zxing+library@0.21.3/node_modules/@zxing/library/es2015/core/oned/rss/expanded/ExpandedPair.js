export default class ExpandedPair {
    constructor(leftChar, rightChar, finderPatter, mayBeLast) {
        this.leftchar = leftChar;
        this.rightchar = rightChar;
        this.finderpattern = finderPatter;
        this.maybeLast = mayBeLast;
    }
    mayBeLast() {
        return this.maybeLast;
    }
    getLeftChar() {
        return this.leftchar;
    }
    getRightChar() {
        return this.rightchar;
    }
    getFinderPattern() {
        return this.finderpattern;
    }
    mustBeLast() {
        return this.rightchar == null;
    }
    toString() {
        return '[ ' + this.leftchar + ', ' + this.rightchar + ' : ' + (this.finderpattern == null ? 'null' : this.finderpattern.getValue()) + ' ]';
    }
    static equals(o1, o2) {
        if (!(o1 instanceof ExpandedPair)) {
            return false;
        }
        return ExpandedPair.equalsOrNull(o1.leftchar, o2.leftchar) &&
            ExpandedPair.equalsOrNull(o1.rightchar, o2.rightchar) &&
            ExpandedPair.equalsOrNull(o1.finderpattern, o2.finderpattern);
    }
    static equalsOrNull(o1, o2) {
        return o1 === null ? o2 === null : ExpandedPair.equals(o1, o2);
    }
    hashCode() {
        // return ExpandedPair.hashNotNull(leftChar) ^ hashNotNull(rightChar) ^ hashNotNull(finderPattern);
        let value = this.leftchar.getValue() ^ this.rightchar.getValue() ^ this.finderpattern.getValue();
        return value;
    }
}
