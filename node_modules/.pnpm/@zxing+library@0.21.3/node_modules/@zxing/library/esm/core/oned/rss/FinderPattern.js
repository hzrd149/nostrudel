import ResultPoint from '../../ResultPoint';
var FinderPattern = /** @class */ (function () {
    function FinderPattern(value, startEnd, start, end, rowNumber) {
        this.value = value;
        this.startEnd = startEnd;
        this.value = value;
        this.startEnd = startEnd;
        this.resultPoints = new Array();
        this.resultPoints.push(new ResultPoint(start, rowNumber));
        this.resultPoints.push(new ResultPoint(end, rowNumber));
    }
    FinderPattern.prototype.getValue = function () {
        return this.value;
    };
    FinderPattern.prototype.getStartEnd = function () {
        return this.startEnd;
    };
    FinderPattern.prototype.getResultPoints = function () {
        return this.resultPoints;
    };
    FinderPattern.prototype.equals = function (o) {
        if (!(o instanceof FinderPattern)) {
            return false;
        }
        var that = o;
        return this.value === that.value;
    };
    FinderPattern.prototype.hashCode = function () {
        return this.value;
    };
    return FinderPattern;
}());
export default FinderPattern;
