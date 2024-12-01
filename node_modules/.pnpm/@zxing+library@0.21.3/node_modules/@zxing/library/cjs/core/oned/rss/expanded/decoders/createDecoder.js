"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../../../../..");
var AI013103decoder_1 = require("./AI013103decoder");
var AI01320xDecoder_1 = require("./AI01320xDecoder");
var AI01392xDecoder_1 = require("./AI01392xDecoder");
var AI01393xDecoder_1 = require("./AI01393xDecoder");
var AI013x0x1xDecoder_1 = require("./AI013x0x1xDecoder");
var AI01AndOtherAIs_1 = require("./AI01AndOtherAIs");
var AnyAIDecoder_1 = require("./AnyAIDecoder");
var GeneralAppIdDecoder_1 = require("./GeneralAppIdDecoder");
function createDecoder(information) {
    try {
        if (information.get(1)) {
            return new AI01AndOtherAIs_1.default(information);
        }
        if (!information.get(2)) {
            return new AnyAIDecoder_1.default(information);
        }
        var fourBitEncodationMethod = GeneralAppIdDecoder_1.default.extractNumericValueFromBitArray(information, 1, 4);
        switch (fourBitEncodationMethod) {
            case 4: return new AI013103decoder_1.default(information);
            case 5: return new AI01320xDecoder_1.default(information);
        }
        var fiveBitEncodationMethod = GeneralAppIdDecoder_1.default.extractNumericValueFromBitArray(information, 1, 5);
        switch (fiveBitEncodationMethod) {
            case 12: return new AI01392xDecoder_1.default(information);
            case 13: return new AI01393xDecoder_1.default(information);
        }
        var sevenBitEncodationMethod = GeneralAppIdDecoder_1.default.extractNumericValueFromBitArray(information, 1, 7);
        switch (sevenBitEncodationMethod) {
            case 56: return new AI013x0x1xDecoder_1.default(information, '310', '11');
            case 57: return new AI013x0x1xDecoder_1.default(information, '320', '11');
            case 58: return new AI013x0x1xDecoder_1.default(information, '310', '13');
            case 59: return new AI013x0x1xDecoder_1.default(information, '320', '13');
            case 60: return new AI013x0x1xDecoder_1.default(information, '310', '15');
            case 61: return new AI013x0x1xDecoder_1.default(information, '320', '15');
            case 62: return new AI013x0x1xDecoder_1.default(information, '310', '17');
            case 63: return new AI013x0x1xDecoder_1.default(information, '320', '17');
        }
    }
    catch (e) {
        console.log(e);
        throw new __1.IllegalStateException('unknown decoder: ' + information);
    }
}
exports.default = createDecoder;
