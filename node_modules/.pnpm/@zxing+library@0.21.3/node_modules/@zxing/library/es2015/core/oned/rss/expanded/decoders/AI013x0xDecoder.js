import AI01weightDecoder from './AI01weightDecoder';
import StringBuilder from '../../../../util/StringBuilder';
import NotFoundException from '../../../../NotFoundException';
export default class AI013x0xDecoder extends AI01weightDecoder {
    constructor(information) {
        super(information);
    }
    parseInformation() {
        if (this.getInformation().getSize() !==
            AI013x0xDecoder.HEADER_SIZE +
                AI01weightDecoder.GTIN_SIZE +
                AI013x0xDecoder.WEIGHT_SIZE) {
            throw new NotFoundException();
        }
        let buf = new StringBuilder();
        this.encodeCompressedGtin(buf, AI013x0xDecoder.HEADER_SIZE);
        this.encodeCompressedWeight(buf, AI013x0xDecoder.HEADER_SIZE + AI01weightDecoder.GTIN_SIZE, AI013x0xDecoder.WEIGHT_SIZE);
        return buf.toString();
    }
}
AI013x0xDecoder.HEADER_SIZE = 4 + 1;
AI013x0xDecoder.WEIGHT_SIZE = 15;
