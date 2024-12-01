"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FormatException_1 = require("../../../../FormatException");
var IllegalStateException_1 = require("../../../../IllegalStateException");
var StringBuilder_1 = require("../../../../util/StringBuilder");
var BlockParsedResult_1 = require("./BlockParsedResult");
var DecodedChar_1 = require("./DecodedChar");
var DecodedInformation_1 = require("./DecodedInformation");
var DecodedNumeric_1 = require("./DecodedNumeric");
var FieldParser_1 = require("./FieldParser");
var GeneralAppIdDecoder = /** @class */ (function () {
    function GeneralAppIdDecoder(information) {
        this.buffer = new StringBuilder_1.default();
        this.information = information;
    }
    GeneralAppIdDecoder.prototype.decodeAllCodes = function (buff, initialPosition) {
        var currentPosition = initialPosition;
        var remaining = null;
        do {
            var info = this.decodeGeneralPurposeField(currentPosition, remaining);
            var parsedFields = FieldParser_1.default.parseFieldsInGeneralPurpose(info.getNewString());
            if (parsedFields != null) {
                buff.append(parsedFields);
            }
            if (info.isRemaining()) {
                remaining = '' + info.getRemainingValue();
            }
            else {
                remaining = null;
            }
            if (currentPosition === info.getNewPosition()) { // No step forward!
                break;
            }
            currentPosition = info.getNewPosition();
        } while (true);
        return buff.toString();
    };
    GeneralAppIdDecoder.prototype.isStillNumeric = function (pos) {
        // It's numeric if it still has 7 positions
        // and one of the first 4 bits is "1".
        if (pos + 7 > this.information.getSize()) {
            return pos + 4 <= this.information.getSize();
        }
        for (var i = pos; i < pos + 3; ++i) {
            if (this.information.get(i)) {
                return true;
            }
        }
        return this.information.get(pos + 3);
    };
    GeneralAppIdDecoder.prototype.decodeNumeric = function (pos) {
        if (pos + 7 > this.information.getSize()) {
            var numeric_1 = this.extractNumericValueFromBitArray(pos, 4);
            if (numeric_1 === 0) {
                return new DecodedNumeric_1.default(this.information.getSize(), DecodedNumeric_1.default.FNC1, DecodedNumeric_1.default.FNC1);
            }
            return new DecodedNumeric_1.default(this.information.getSize(), numeric_1 - 1, DecodedNumeric_1.default.FNC1);
        }
        var numeric = this.extractNumericValueFromBitArray(pos, 7);
        var digit1 = (numeric - 8) / 11;
        var digit2 = (numeric - 8) % 11;
        return new DecodedNumeric_1.default(pos + 7, digit1, digit2);
    };
    GeneralAppIdDecoder.prototype.extractNumericValueFromBitArray = function (pos, bits) {
        return GeneralAppIdDecoder.extractNumericValueFromBitArray(this.information, pos, bits);
    };
    GeneralAppIdDecoder.extractNumericValueFromBitArray = function (information, pos, bits) {
        var value = 0;
        for (var i = 0; i < bits; ++i) {
            if (information.get(pos + i)) {
                value |= 1 << (bits - i - 1);
            }
        }
        return value;
    };
    GeneralAppIdDecoder.prototype.decodeGeneralPurposeField = function (pos, remaining) {
        // this.buffer.setLength(0);
        this.buffer.setLengthToZero();
        if (remaining != null) {
            this.buffer.append(remaining);
        }
        this.current.setPosition(pos);
        var lastDecoded = this.parseBlocks();
        if (lastDecoded != null && lastDecoded.isRemaining()) {
            return new DecodedInformation_1.default(this.current.getPosition(), this.buffer.toString(), lastDecoded.getRemainingValue());
        }
        return new DecodedInformation_1.default(this.current.getPosition(), this.buffer.toString());
    };
    GeneralAppIdDecoder.prototype.parseBlocks = function () {
        var isFinished;
        var result;
        do {
            var initialPosition = this.current.getPosition();
            if (this.current.isAlpha()) {
                result = this.parseAlphaBlock();
                isFinished = result.isFinished();
            }
            else if (this.current.isIsoIec646()) {
                result = this.parseIsoIec646Block();
                isFinished = result.isFinished();
            }
            else { // it must be numeric
                result = this.parseNumericBlock();
                isFinished = result.isFinished();
            }
            var positionChanged = initialPosition !== this.current.getPosition();
            if (!positionChanged && !isFinished) {
                break;
            }
        } while (!isFinished);
        return result.getDecodedInformation();
    };
    GeneralAppIdDecoder.prototype.parseNumericBlock = function () {
        while (this.isStillNumeric(this.current.getPosition())) {
            var numeric = this.decodeNumeric(this.current.getPosition());
            this.current.setPosition(numeric.getNewPosition());
            if (numeric.isFirstDigitFNC1()) {
                var information = void 0;
                if (numeric.isSecondDigitFNC1()) {
                    information = new DecodedInformation_1.default(this.current.getPosition(), this.buffer.toString());
                }
                else {
                    information = new DecodedInformation_1.default(this.current.getPosition(), this.buffer.toString(), numeric.getSecondDigit());
                }
                return new BlockParsedResult_1.default(true, information);
            }
            this.buffer.append(numeric.getFirstDigit());
            if (numeric.isSecondDigitFNC1()) {
                var information = new DecodedInformation_1.default(this.current.getPosition(), this.buffer.toString());
                return new BlockParsedResult_1.default(true, information);
            }
            this.buffer.append(numeric.getSecondDigit());
        }
        if (this.isNumericToAlphaNumericLatch(this.current.getPosition())) {
            this.current.setAlpha();
            this.current.incrementPosition(4);
        }
        return new BlockParsedResult_1.default(false);
    };
    GeneralAppIdDecoder.prototype.parseIsoIec646Block = function () {
        while (this.isStillIsoIec646(this.current.getPosition())) {
            var iso = this.decodeIsoIec646(this.current.getPosition());
            this.current.setPosition(iso.getNewPosition());
            if (iso.isFNC1()) {
                var information = new DecodedInformation_1.default(this.current.getPosition(), this.buffer.toString());
                return new BlockParsedResult_1.default(true, information);
            }
            this.buffer.append(iso.getValue());
        }
        if (this.isAlphaOr646ToNumericLatch(this.current.getPosition())) {
            this.current.incrementPosition(3);
            this.current.setNumeric();
        }
        else if (this.isAlphaTo646ToAlphaLatch(this.current.getPosition())) {
            if (this.current.getPosition() + 5 < this.information.getSize()) {
                this.current.incrementPosition(5);
            }
            else {
                this.current.setPosition(this.information.getSize());
            }
            this.current.setAlpha();
        }
        return new BlockParsedResult_1.default(false);
    };
    GeneralAppIdDecoder.prototype.parseAlphaBlock = function () {
        while (this.isStillAlpha(this.current.getPosition())) {
            var alpha = this.decodeAlphanumeric(this.current.getPosition());
            this.current.setPosition(alpha.getNewPosition());
            if (alpha.isFNC1()) {
                var information = new DecodedInformation_1.default(this.current.getPosition(), this.buffer.toString());
                return new BlockParsedResult_1.default(true, information); // end of the char block
            }
            this.buffer.append(alpha.getValue());
        }
        if (this.isAlphaOr646ToNumericLatch(this.current.getPosition())) {
            this.current.incrementPosition(3);
            this.current.setNumeric();
        }
        else if (this.isAlphaTo646ToAlphaLatch(this.current.getPosition())) {
            if (this.current.getPosition() + 5 < this.information.getSize()) {
                this.current.incrementPosition(5);
            }
            else {
                this.current.setPosition(this.information.getSize());
            }
            this.current.setIsoIec646();
        }
        return new BlockParsedResult_1.default(false);
    };
    GeneralAppIdDecoder.prototype.isStillIsoIec646 = function (pos) {
        if (pos + 5 > this.information.getSize()) {
            return false;
        }
        var fiveBitValue = this.extractNumericValueFromBitArray(pos, 5);
        if (fiveBitValue >= 5 && fiveBitValue < 16) {
            return true;
        }
        if (pos + 7 > this.information.getSize()) {
            return false;
        }
        var sevenBitValue = this.extractNumericValueFromBitArray(pos, 7);
        if (sevenBitValue >= 64 && sevenBitValue < 116) {
            return true;
        }
        if (pos + 8 > this.information.getSize()) {
            return false;
        }
        var eightBitValue = this.extractNumericValueFromBitArray(pos, 8);
        return eightBitValue >= 232 && eightBitValue < 253;
    };
    GeneralAppIdDecoder.prototype.decodeIsoIec646 = function (pos) {
        var fiveBitValue = this.extractNumericValueFromBitArray(pos, 5);
        if (fiveBitValue === 15) {
            return new DecodedChar_1.default(pos + 5, DecodedChar_1.default.FNC1);
        }
        if (fiveBitValue >= 5 && fiveBitValue < 15) {
            return new DecodedChar_1.default(pos + 5, ('0' + (fiveBitValue - 5)));
        }
        var sevenBitValue = this.extractNumericValueFromBitArray(pos, 7);
        if (sevenBitValue >= 64 && sevenBitValue < 90) {
            return new DecodedChar_1.default(pos + 7, ('' + (sevenBitValue + 1)));
        }
        if (sevenBitValue >= 90 && sevenBitValue < 116) {
            return new DecodedChar_1.default(pos + 7, ('' + (sevenBitValue + 7)));
        }
        var eightBitValue = this.extractNumericValueFromBitArray(pos, 8);
        var c;
        switch (eightBitValue) {
            case 232:
                c = '!';
                break;
            case 233:
                c = '"';
                break;
            case 234:
                c = '%';
                break;
            case 235:
                c = '&';
                break;
            case 236:
                c = '\'';
                break;
            case 237:
                c = '(';
                break;
            case 238:
                c = ')';
                break;
            case 239:
                c = '*';
                break;
            case 240:
                c = '+';
                break;
            case 241:
                c = ',';
                break;
            case 242:
                c = '-';
                break;
            case 243:
                c = '.';
                break;
            case 244:
                c = '/';
                break;
            case 245:
                c = ':';
                break;
            case 246:
                c = ';';
                break;
            case 247:
                c = '<';
                break;
            case 248:
                c = '=';
                break;
            case 249:
                c = '>';
                break;
            case 250:
                c = '?';
                break;
            case 251:
                c = '_';
                break;
            case 252:
                c = ' ';
                break;
            default:
                throw new FormatException_1.default();
        }
        return new DecodedChar_1.default(pos + 8, c);
    };
    GeneralAppIdDecoder.prototype.isStillAlpha = function (pos) {
        if (pos + 5 > this.information.getSize()) {
            return false;
        }
        // We now check if it's a valid 5-bit value (0..9 and FNC1)
        var fiveBitValue = this.extractNumericValueFromBitArray(pos, 5);
        if (fiveBitValue >= 5 && fiveBitValue < 16) {
            return true;
        }
        if (pos + 6 > this.information.getSize()) {
            return false;
        }
        var sixBitValue = this.extractNumericValueFromBitArray(pos, 6);
        return sixBitValue >= 16 && sixBitValue < 63; // 63 not included
    };
    GeneralAppIdDecoder.prototype.decodeAlphanumeric = function (pos) {
        var fiveBitValue = this.extractNumericValueFromBitArray(pos, 5);
        if (fiveBitValue === 15) {
            return new DecodedChar_1.default(pos + 5, DecodedChar_1.default.FNC1);
        }
        if (fiveBitValue >= 5 && fiveBitValue < 15) {
            return new DecodedChar_1.default(pos + 5, ('0' + (fiveBitValue - 5)));
        }
        var sixBitValue = this.extractNumericValueFromBitArray(pos, 6);
        if (sixBitValue >= 32 && sixBitValue < 58) {
            return new DecodedChar_1.default(pos + 6, ('' + (sixBitValue + 33)));
        }
        var c;
        switch (sixBitValue) {
            case 58:
                c = '*';
                break;
            case 59:
                c = ',';
                break;
            case 60:
                c = '-';
                break;
            case 61:
                c = '.';
                break;
            case 62:
                c = '/';
                break;
            default:
                throw new IllegalStateException_1.default('Decoding invalid alphanumeric value: ' + sixBitValue);
        }
        return new DecodedChar_1.default(pos + 6, c);
    };
    GeneralAppIdDecoder.prototype.isAlphaTo646ToAlphaLatch = function (pos) {
        if (pos + 1 > this.information.getSize()) {
            return false;
        }
        for (var i = 0; i < 5 && i + pos < this.information.getSize(); ++i) {
            if (i === 2) {
                if (!this.information.get(pos + 2)) {
                    return false;
                }
            }
            else if (this.information.get(pos + i)) {
                return false;
            }
        }
        return true;
    };
    GeneralAppIdDecoder.prototype.isAlphaOr646ToNumericLatch = function (pos) {
        // Next is alphanumeric if there are 3 positions and they are all zeros
        if (pos + 3 > this.information.getSize()) {
            return false;
        }
        for (var i = pos; i < pos + 3; ++i) {
            if (this.information.get(i)) {
                return false;
            }
        }
        return true;
    };
    GeneralAppIdDecoder.prototype.isNumericToAlphaNumericLatch = function (pos) {
        // Next is alphanumeric if there are 4 positions and they are all zeros, or
        // if there is a subset of this just before the end of the symbol
        if (pos + 1 > this.information.getSize()) {
            return false;
        }
        for (var i = 0; i < 4 && i + pos < this.information.getSize(); ++i) {
            if (this.information.get(pos + i)) {
                return false;
            }
        }
        return true;
    };
    return GeneralAppIdDecoder;
}());
exports.default = GeneralAppIdDecoder;
