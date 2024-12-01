import OneDReader from '../OneDReader';
export default abstract class AbstractRSSReader extends OneDReader {
    private static readonly MAX_AVG_VARIANCE;
    private static readonly MAX_INDIVIDUAL_VARIANCE;
    private static readonly MIN_FINDER_PATTERN_RATIO;
    private static readonly MAX_FINDER_PATTERN_RATIO;
    private readonly decodeFinderCounters;
    private readonly dataCharacterCounters;
    private readonly oddRoundingErrors;
    private readonly evenRoundingErrors;
    private readonly oddCounts;
    private readonly evenCounts;
    constructor();
    protected getDecodeFinderCounters(): Int32Array;
    protected getDataCharacterCounters(): Int32Array;
    protected getOddRoundingErrors(): number[];
    protected getEvenRoundingErrors(): number[];
    protected getOddCounts(): number[];
    protected getEvenCounts(): number[];
    protected parseFinderValue(counters: Int32Array, finderPatterns: Int32Array[]): number;
    /**
     * @param array values to sum
     * @return sum of values
     * @deprecated call {@link MathUtils#sum(int[])}
     */
    protected static count(array: number[]): number;
    protected static increment(array: number[], errors: number[]): void;
    protected static decrement(array: number[], errors: number[]): void;
    protected static isFinderPattern(counters: Int32Array): boolean;
}
