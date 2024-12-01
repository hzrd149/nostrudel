import BitArray from '../../../../common/BitArray';
import GeneralAppIdDecoder from './GeneralAppIdDecoder';
export default abstract class AbstractExpandedDecoder {
    private readonly information;
    private readonly generalDecoder;
    constructor(information: BitArray);
    protected getInformation(): BitArray;
    protected getGeneralDecoder(): GeneralAppIdDecoder;
    abstract parseInformation(): string;
}
