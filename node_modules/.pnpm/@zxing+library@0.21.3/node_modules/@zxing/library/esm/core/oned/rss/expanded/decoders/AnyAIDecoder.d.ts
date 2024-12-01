import BitArray from '../../../../common/BitArray';
import AbstractExpandedDecoder from './AbstractExpandedDecoder';
export default class AnyAIDecoder extends AbstractExpandedDecoder {
    private static readonly HEADER_SIZE;
    constructor(information: BitArray);
    parseInformation(): string;
}
