import AI01decoder from './AI01decoder';
import NotFoundException from '../../../../NotFoundException';
import StringBuilder from '../../../../util/StringBuilder';
export default class AI01392xDecoder extends AI01decoder {
    constructor(information) {
        super(information);
    }
    parseInformation() {
        if (this.getInformation().getSize() < AI01392xDecoder.HEADER_SIZE + AI01decoder.GTIN_SIZE) {
            throw new NotFoundException();
        }
        let buf = new StringBuilder();
        this.encodeCompressedGtin(buf, AI01392xDecoder.HEADER_SIZE);
        let lastAIdigit = this.getGeneralDecoder().extractNumericValueFromBitArray(AI01392xDecoder.HEADER_SIZE + AI01decoder.GTIN_SIZE, AI01392xDecoder.LAST_DIGIT_SIZE);
        buf.append('(392');
        buf.append(lastAIdigit);
        buf.append(')');
        let decodedInformation = this.getGeneralDecoder().decodeGeneralPurposeField(AI01392xDecoder.HEADER_SIZE + AI01decoder.GTIN_SIZE + AI01392xDecoder.LAST_DIGIT_SIZE, null);
        buf.append(decodedInformation.getNewString());
        return buf.toString();
    }
}
AI01392xDecoder.HEADER_SIZE = 5 + 1 + 2;
AI01392xDecoder.LAST_DIGIT_SIZE = 2;
