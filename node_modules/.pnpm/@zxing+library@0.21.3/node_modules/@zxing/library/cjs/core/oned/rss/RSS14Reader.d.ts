import AbstractRSSReader from './AbstractRSSReader';
import Result from '../../Result';
import BitArray from '../../common/BitArray';
import DecodeHintType from '../../DecodeHintType';
export default class RSS14Reader extends AbstractRSSReader {
    private static readonly OUTSIDE_EVEN_TOTAL_SUBSET;
    private static readonly INSIDE_ODD_TOTAL_SUBSET;
    private static readonly OUTSIDE_GSUM;
    private static readonly INSIDE_GSUM;
    private static readonly OUTSIDE_ODD_WIDEST;
    private static readonly INSIDE_ODD_WIDEST;
    private static readonly FINDER_PATTERNS;
    private readonly possibleLeftPairs;
    private readonly possibleRightPairs;
    decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
    private static addOrTally;
    reset(): void;
    private static constructResult;
    private static checkChecksum;
    private decodePair;
    private decodeDataCharacter;
    private findFinderPattern;
    private parseFoundFinderPattern;
    private adjustOddEvenCounts;
}
