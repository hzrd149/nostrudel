import AI01decoder from './AI01decoder';
import BitArray from '../../../../common/BitArray';
export default class AI01393xDecoder extends AI01decoder {
    private static readonly HEADER_SIZE;
    private static readonly LAST_DIGIT_SIZE;
    private static readonly FIRST_THREE_DIGITS_SIZE;
    constructor(information: BitArray);
    parseInformation(): string;
}
