var State;
(function (State) {
    State[State["NUMERIC"] = 0] = "NUMERIC";
    State[State["ALPHA"] = 1] = "ALPHA";
    State[State["ISO_IEC_646"] = 2] = "ISO_IEC_646";
})(State || (State = {}));
export default class CurrentParsingState {
    constructor() {
        this.position = 0;
        this.encoding = State.NUMERIC;
    }
    getPosition() {
        return this.position;
    }
    setPosition(position) {
        this.position = position;
    }
    incrementPosition(delta) {
        this.position += delta;
    }
    isAlpha() {
        return this.encoding === State.ALPHA;
    }
    isNumeric() {
        return this.encoding === State.NUMERIC;
    }
    isIsoIec646() {
        return this.encoding === State.ISO_IEC_646;
    }
    setNumeric() {
        this.encoding = State.NUMERIC;
    }
    setAlpha() {
        this.encoding = State.ALPHA;
    }
    setIsoIec646() {
        this.encoding = State.ISO_IEC_646;
    }
}
