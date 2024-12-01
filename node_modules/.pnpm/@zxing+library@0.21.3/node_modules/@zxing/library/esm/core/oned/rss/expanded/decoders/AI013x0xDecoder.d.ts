import AI01weightDecoder from './AI01weightDecoder';
import BitArray from '../../../../common/BitArray';
export default abstract class AI013x0xDecoder extends AI01weightDecoder {
    private static readonly HEADER_SIZE;
    private static readonly WEIGHT_SIZE;
    constructor(information: BitArray);
    parseInformation(): string;
}
