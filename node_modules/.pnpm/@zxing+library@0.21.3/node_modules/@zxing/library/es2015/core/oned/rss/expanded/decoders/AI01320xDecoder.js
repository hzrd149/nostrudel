import AI013x0xDecoder from './AI013x0xDecoder';
export default class AI01320xDecoder extends AI013x0xDecoder {
    constructor(information) {
        super(information);
    }
    addWeightCode(buf, weight) {
        if (weight < 10000) {
            buf.append('(3202)');
        }
        else {
            buf.append('(3203)');
        }
    }
    checkWeight(weight) {
        if (weight < 10000) {
            return weight;
        }
        return weight - 10000;
    }
}
