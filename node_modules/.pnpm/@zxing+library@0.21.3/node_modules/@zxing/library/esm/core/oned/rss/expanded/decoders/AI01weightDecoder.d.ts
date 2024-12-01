import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';
import AI01decoder from './AI01decoder';
export default abstract class AI01weightDecoder extends AI01decoder {
    constructor(information: BitArray);
    encodeCompressedWeight(buf: StringBuilder, currentPos: number, weightSize: number): void;
    protected abstract addWeightCode(buf: StringBuilder, weight: number): void;
    protected abstract checkWeight(weight: number): number;
}
