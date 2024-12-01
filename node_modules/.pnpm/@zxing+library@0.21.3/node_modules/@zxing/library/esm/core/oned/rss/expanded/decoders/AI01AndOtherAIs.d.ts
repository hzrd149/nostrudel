import AI01decoder from './AI01decoder';
import BitArray from '../../../../common/BitArray';
export default class AI01AndOtherAIs extends AI01decoder {
    private static readonly HEADER_SIZE;
    constructor(information: BitArray);
    parseInformation(): string;
}
