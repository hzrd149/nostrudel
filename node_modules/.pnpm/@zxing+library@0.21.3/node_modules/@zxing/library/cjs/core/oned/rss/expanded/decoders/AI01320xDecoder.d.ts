import AI013x0xDecoder from './AI013x0xDecoder';
import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';
export default class AI01320xDecoder extends AI013x0xDecoder {
    constructor(information: BitArray);
    protected addWeightCode(buf: StringBuilder, weight: number): void;
    protected checkWeight(weight: number): number;
}
