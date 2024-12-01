import AI01decoder from './AI01decoder';
import BitArray from '../../../../common/BitArray';
export default class AI01392xDecoder extends AI01decoder {
    private static readonly HEADER_SIZE;
    private static readonly LAST_DIGIT_SIZE;
    constructor(information: BitArray);
    parseInformation(): string;
}
