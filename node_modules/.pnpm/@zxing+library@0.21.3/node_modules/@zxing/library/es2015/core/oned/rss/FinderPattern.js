import ResultPoint from '../../ResultPoint';
export default class FinderPattern {
    constructor(value, startEnd, start, end, rowNumber) {
        this.value = value;
        this.startEnd = startEnd;
        this.value = value;
        this.startEnd = startEnd;
        this.resultPoints = new Array();
        this.resultPoints.push(new ResultPoint(start, rowNumber));
        this.resultPoints.push(new ResultPoint(end, rowNumber));
    }
    getValue() {
        return this.value;
    }
    getStartEnd() {
        return this.startEnd;
    }
    getResultPoints() {
        return this.resultPoints;
    }
    equals(o) {
        if (!(o instanceof FinderPattern)) {
            return false;
        }
        const that = o;
        return this.value === that.value;
    }
    hashCode() {
        return this.value;
    }
}
