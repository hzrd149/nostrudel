import GeneralAppIdDecoder from './GeneralAppIdDecoder';
export default class AbstractExpandedDecoder {
    constructor(information) {
        this.information = information;
        this.generalDecoder = new GeneralAppIdDecoder(information);
    }
    getInformation() {
        return this.information;
    }
    getGeneralDecoder() {
        return this.generalDecoder;
    }
}
