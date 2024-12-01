var State;
(function (State) {
    State[State["NUMERIC"] = 0] = "NUMERIC";
    State[State["ALPHA"] = 1] = "ALPHA";
    State[State["ISO_IEC_646"] = 2] = "ISO_IEC_646";
})(State || (State = {}));
var CurrentParsingState = /** @class */ (function () {
    function CurrentParsingState() {
        this.position = 0;
        this.encoding = State.NUMERIC;
    }
    CurrentParsingState.prototype.getPosition = function () {
        return this.position;
    };
    CurrentParsingState.prototype.setPosition = function (position) {
        this.position = position;
    };
    CurrentParsingState.prototype.incrementPosition = function (delta) {
        this.position += delta;
    };
    CurrentParsingState.prototype.isAlpha = function () {
        return this.encoding === State.ALPHA;
    };
    CurrentParsingState.prototype.isNumeric = function () {
        return this.encoding === State.NUMERIC;
    };
    CurrentParsingState.prototype.isIsoIec646 = function () {
        return this.encoding === State.ISO_IEC_646;
    };
    CurrentParsingState.prototype.setNumeric = function () {
        this.encoding = State.NUMERIC;
    };
    CurrentParsingState.prototype.setAlpha = function () {
        this.encoding = State.ALPHA;
    };
    CurrentParsingState.prototype.setIsoIec646 = function () {
        this.encoding = State.ISO_IEC_646;
    };
    return CurrentParsingState;
}());
export default CurrentParsingState;
