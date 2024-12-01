import MathUtils from '../../common/detector/MathUtils';
import NotFoundException from '../../NotFoundException';
import OneDReader from '../OneDReader';
// import Integer from '../../util/Integer';
// import Float from '../../util/Float';
export default class AbstractRSSReader extends OneDReader {
    constructor() {
        super();
        this.decodeFinderCounters = new Int32Array(4);
        this.dataCharacterCounters = new Int32Array(8);
        this.oddRoundingErrors = new Array(4);
        this.evenRoundingErrors = new Array(4);
        this.oddCounts = new Array(this.dataCharacterCounters.length / 2);
        this.evenCounts = new Array(this.dataCharacterCounters.length / 2);
    }
    getDecodeFinderCounters() {
        return this.decodeFinderCounters;
    }
    getDataCharacterCounters() {
        return this.dataCharacterCounters;
    }
    getOddRoundingErrors() {
        return this.oddRoundingErrors;
    }
    getEvenRoundingErrors() {
        return this.evenRoundingErrors;
    }
    getOddCounts() {
        return this.oddCounts;
    }
    getEvenCounts() {
        return this.evenCounts;
    }
    parseFinderValue(counters, finderPatterns) {
        for (let value = 0; value < finderPatterns.length; value++) {
            if (OneDReader.patternMatchVariance(counters, finderPatterns[value], AbstractRSSReader.MAX_INDIVIDUAL_VARIANCE) < AbstractRSSReader.MAX_AVG_VARIANCE) {
                return value;
            }
        }
        throw new NotFoundException();
    }
    /**
     * @param array values to sum
     * @return sum of values
     * @deprecated call {@link MathUtils#sum(int[])}
     */
    static count(array) {
        return MathUtils.sum(new Int32Array(array));
    }
    static increment(array, errors) {
        let index = 0;
        let biggestError = errors[0];
        for (let i = 1; i < array.length; i++) {
            if (errors[i] > biggestError) {
                biggestError = errors[i];
                index = i;
            }
        }
        array[index]++;
    }
    static decrement(array, errors) {
        let index = 0;
        let biggestError = errors[0];
        for (let i = 1; i < array.length; i++) {
            if (errors[i] < biggestError) {
                biggestError = errors[i];
                index = i;
            }
        }
        array[index]--;
    }
    static isFinderPattern(counters) {
        let firstTwoSum = counters[0] + counters[1];
        let sum = firstTwoSum + counters[2] + counters[3];
        let ratio = firstTwoSum / sum;
        if (ratio >= AbstractRSSReader.MIN_FINDER_PATTERN_RATIO && ratio <= AbstractRSSReader.MAX_FINDER_PATTERN_RATIO) {
            // passes ratio test in spec, but see if the counts are unreasonable
            let minCounter = Number.MAX_SAFE_INTEGER;
            let maxCounter = Number.MIN_SAFE_INTEGER;
            for (let counter of counters) {
                if (counter > maxCounter) {
                    maxCounter = counter;
                }
                if (counter < minCounter) {
                    minCounter = counter;
                }
            }
            return maxCounter < 10 * minCounter;
        }
        return false;
    }
}
AbstractRSSReader.MAX_AVG_VARIANCE = 0.2;
AbstractRSSReader.MAX_INDIVIDUAL_VARIANCE = 0.45;
AbstractRSSReader.MIN_FINDER_PATTERN_RATIO = 9.5 / 12.0;
AbstractRSSReader.MAX_FINDER_PATTERN_RATIO = 12.5 / 14.0;
