import StringBuilder from '../../../../util/StringBuilder';
import AbstractExpandedDecoder from './AbstractExpandedDecoder';
export default class AnyAIDecoder extends AbstractExpandedDecoder {
    constructor(information) {
        super(information);
    }
    parseInformation() {
        let buf = new StringBuilder();
        return this.getGeneralDecoder().decodeAllCodes(buf, AnyAIDecoder.HEADER_SIZE);
    }
}
AnyAIDecoder.HEADER_SIZE = 2 + 1 + 2;
