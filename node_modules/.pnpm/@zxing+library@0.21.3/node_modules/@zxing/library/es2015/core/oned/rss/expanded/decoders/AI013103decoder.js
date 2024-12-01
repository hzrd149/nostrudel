import AI013x0xDecoder from './AI013x0xDecoder';
export default class AI013103decoder extends AI013x0xDecoder {
    constructor(information) {
        super(information);
    }
    addWeightCode(buf, weight) {
        buf.append('(3103)');
    }
    checkWeight(weight) {
        return weight;
    }
}
