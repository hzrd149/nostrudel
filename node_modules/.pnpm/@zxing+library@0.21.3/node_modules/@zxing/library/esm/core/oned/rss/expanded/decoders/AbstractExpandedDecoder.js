import GeneralAppIdDecoder from './GeneralAppIdDecoder';
var AbstractExpandedDecoder = /** @class */ (function () {
    function AbstractExpandedDecoder(information) {
        this.information = information;
        this.generalDecoder = new GeneralAppIdDecoder(information);
    }
    AbstractExpandedDecoder.prototype.getInformation = function () {
        return this.information;
    };
    AbstractExpandedDecoder.prototype.getGeneralDecoder = function () {
        return this.generalDecoder;
    };
    return AbstractExpandedDecoder;
}());
export default AbstractExpandedDecoder;
