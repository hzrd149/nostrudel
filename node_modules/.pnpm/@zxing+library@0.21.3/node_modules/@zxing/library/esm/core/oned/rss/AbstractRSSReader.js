var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import MathUtils from '../../common/detector/MathUtils';
import NotFoundException from '../../NotFoundException';
import OneDReader from '../OneDReader';
// import Integer from '../../util/Integer';
// import Float from '../../util/Float';
var AbstractRSSReader = /** @class */ (function (_super) {
    __extends(AbstractRSSReader, _super);
    function AbstractRSSReader() {
        var _this = _super.call(this) || this;
        _this.decodeFinderCounters = new Int32Array(4);
        _this.dataCharacterCounters = new Int32Array(8);
        _this.oddRoundingErrors = new Array(4);
        _this.evenRoundingErrors = new Array(4);
        _this.oddCounts = new Array(_this.dataCharacterCounters.length / 2);
        _this.evenCounts = new Array(_this.dataCharacterCounters.length / 2);
        return _this;
    }
    AbstractRSSReader.prototype.getDecodeFinderCounters = function () {
        return this.decodeFinderCounters;
    };
    AbstractRSSReader.prototype.getDataCharacterCounters = function () {
        return this.dataCharacterCounters;
    };
    AbstractRSSReader.prototype.getOddRoundingErrors = function () {
        return this.oddRoundingErrors;
    };
    AbstractRSSReader.prototype.getEvenRoundingErrors = function () {
        return this.evenRoundingErrors;
    };
    AbstractRSSReader.prototype.getOddCounts = function () {
        return this.oddCounts;
    };
    AbstractRSSReader.prototype.getEvenCounts = function () {
        return this.evenCounts;
    };
    AbstractRSSReader.prototype.parseFinderValue = function (counters, finderPatterns) {
        for (var value = 0; value < finderPatterns.length; value++) {
            if (OneDReader.patternMatchVariance(counters, finderPatterns[value], AbstractRSSReader.MAX_INDIVIDUAL_VARIANCE) < AbstractRSSReader.MAX_AVG_VARIANCE) {
                return value;
            }
        }
        throw new NotFoundException();
    };
    /**
     * @param array values to sum
     * @return sum of values
     * @deprecated call {@link MathUtils#sum(int[])}
     */
    AbstractRSSReader.count = function (array) {
        return MathUtils.sum(new Int32Array(array));
    };
    AbstractRSSReader.increment = function (array, errors) {
        var index = 0;
        var biggestError = errors[0];
        for (var i = 1; i < array.length; i++) {
            if (errors[i] > biggestError) {
                biggestError = errors[i];
                index = i;
            }
        }
        array[index]++;
    };
    AbstractRSSReader.decrement = function (array, errors) {
        var index = 0;
        var biggestError = errors[0];
        for (var i = 1; i < array.length; i++) {
            if (errors[i] < biggestError) {
                biggestError = errors[i];
                index = i;
            }
        }
        array[index]--;
    };
    AbstractRSSReader.isFinderPattern = function (counters) {
        var e_1, _a;
        var firstTwoSum = counters[0] + counters[1];
        var sum = firstTwoSum + counters[2] + counters[3];
        var ratio = firstTwoSum / sum;
        if (ratio >= AbstractRSSReader.MIN_FINDER_PATTERN_RATIO && ratio <= AbstractRSSReader.MAX_FINDER_PATTERN_RATIO) {
            // passes ratio test in spec, but see if the counts are unreasonable
            var minCounter = Number.MAX_SAFE_INTEGER;
            var maxCounter = Number.MIN_SAFE_INTEGER;
            try {
                for (var counters_1 = __values(counters), counters_1_1 = counters_1.next(); !counters_1_1.done; counters_1_1 = counters_1.next()) {
                    var counter = counters_1_1.value;
                    if (counter > maxCounter) {
                        maxCounter = counter;
                    }
                    if (counter < minCounter) {
                        minCounter = counter;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (counters_1_1 && !counters_1_1.done && (_a = counters_1.return)) _a.call(counters_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return maxCounter < 10 * minCounter;
        }
        return false;
    };
    AbstractRSSReader.MAX_AVG_VARIANCE = 0.2;
    AbstractRSSReader.MAX_INDIVIDUAL_VARIANCE = 0.45;
    AbstractRSSReader.MIN_FINDER_PATTERN_RATIO = 9.5 / 12.0;
    AbstractRSSReader.MAX_FINDER_PATTERN_RATIO = 12.5 / 14.0;
    return AbstractRSSReader;
}(OneDReader));
export default AbstractRSSReader;
