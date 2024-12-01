import DataCharacter from '../../rss/DataCharacter';
import FinderPattern from '../../rss/FinderPattern';
export default class ExpandedPair {
    private readonly maybeLast;
    private readonly leftchar;
    private readonly rightchar;
    private readonly finderpattern;
    constructor(leftChar: DataCharacter, rightChar: DataCharacter, finderPatter: FinderPattern, mayBeLast: boolean);
    mayBeLast(): boolean;
    getLeftChar(): DataCharacter;
    getRightChar(): DataCharacter;
    getFinderPattern(): FinderPattern;
    mustBeLast(): boolean;
    toString(): String;
    static equals(o1: any, o2: any): boolean;
    private static equalsOrNull;
    hashCode(): any;
}
