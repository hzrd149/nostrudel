"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var NotFoundException_1 = require("../../../../NotFoundException");
var FieldParser = /** @class */ (function () {
    function FieldParser() {
    }
    FieldParser.parseFieldsInGeneralPurpose = function (rawInformation) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d;
        if (!rawInformation) {
            return null;
        }
        // Processing 2-digit AIs
        if (rawInformation.length < 2) {
            throw new NotFoundException_1.default();
        }
        var firstTwoDigits = rawInformation.substring(0, 2);
        try {
            for (var _e = __values(FieldParser.TWO_DIGIT_DATA_LENGTH), _f = _e.next(); !_f.done; _f = _e.next()) {
                var dataLength = _f.value;
                if (dataLength[0] === firstTwoDigits) {
                    if (dataLength[1] === FieldParser.VARIABLE_LENGTH) {
                        return FieldParser.processVariableAI(2, dataLength[2], rawInformation);
                    }
                    return FieldParser.processFixedAI(2, dataLength[1], rawInformation);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (rawInformation.length < 3) {
            throw new NotFoundException_1.default();
        }
        var firstThreeDigits = rawInformation.substring(0, 3);
        try {
            for (var _g = __values(FieldParser.THREE_DIGIT_DATA_LENGTH), _h = _g.next(); !_h.done; _h = _g.next()) {
                var dataLength = _h.value;
                if (dataLength[0] === firstThreeDigits) {
                    if (dataLength[1] === FieldParser.VARIABLE_LENGTH) {
                        return FieldParser.processVariableAI(3, dataLength[2], rawInformation);
                    }
                    return FieldParser.processFixedAI(3, dataLength[1], rawInformation);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
            }
            finally { if (e_2) throw e_2.error; }
        }
        try {
            for (var _j = __values(FieldParser.THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH), _k = _j.next(); !_k.done; _k = _j.next()) {
                var dataLength = _k.value;
                if (dataLength[0] === firstThreeDigits) {
                    if (dataLength[1] === FieldParser.VARIABLE_LENGTH) {
                        return FieldParser.processVariableAI(4, dataLength[2], rawInformation);
                    }
                    return FieldParser.processFixedAI(4, dataLength[1], rawInformation);
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
            }
            finally { if (e_3) throw e_3.error; }
        }
        if (rawInformation.length < 4) {
            throw new NotFoundException_1.default();
        }
        var firstFourDigits = rawInformation.substring(0, 4);
        try {
            for (var _l = __values(FieldParser.FOUR_DIGIT_DATA_LENGTH), _m = _l.next(); !_m.done; _m = _l.next()) {
                var dataLength = _m.value;
                if (dataLength[0] === firstFourDigits) {
                    if (dataLength[1] === FieldParser.VARIABLE_LENGTH) {
                        return FieldParser.processVariableAI(4, dataLength[2], rawInformation);
                    }
                    return FieldParser.processFixedAI(4, dataLength[1], rawInformation);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_m && !_m.done && (_d = _l.return)) _d.call(_l);
            }
            finally { if (e_4) throw e_4.error; }
        }
        throw new NotFoundException_1.default();
    };
    FieldParser.processFixedAI = function (aiSize, fieldSize, rawInformation) {
        if (rawInformation.length < aiSize) {
            throw new NotFoundException_1.default();
        }
        var ai = rawInformation.substring(0, aiSize);
        if (rawInformation.length < aiSize + fieldSize) {
            throw new NotFoundException_1.default();
        }
        var field = rawInformation.substring(aiSize, aiSize + fieldSize);
        var remaining = rawInformation.substring(aiSize + fieldSize);
        var result = '(' + ai + ')' + field;
        var parsedAI = FieldParser.parseFieldsInGeneralPurpose(remaining);
        return parsedAI == null ? result : result + parsedAI;
    };
    FieldParser.processVariableAI = function (aiSize, variableFieldSize, rawInformation) {
        var ai = rawInformation.substring(0, aiSize);
        var maxSize;
        if (rawInformation.length < aiSize + variableFieldSize) {
            maxSize = rawInformation.length;
        }
        else {
            maxSize = aiSize + variableFieldSize;
        }
        var field = rawInformation.substring(aiSize, maxSize);
        var remaining = rawInformation.substring(maxSize);
        var result = '(' + ai + ')' + field;
        var parsedAI = FieldParser.parseFieldsInGeneralPurpose(remaining);
        return parsedAI == null ? result : result + parsedAI;
    };
    FieldParser.VARIABLE_LENGTH = [];
    FieldParser.TWO_DIGIT_DATA_LENGTH = [
        ['00', 18],
        ['01', 14],
        ['02', 14],
        ['10', FieldParser.VARIABLE_LENGTH, 20],
        ['11', 6],
        ['12', 6],
        ['13', 6],
        ['15', 6],
        ['17', 6],
        ['20', 2],
        ['21', FieldParser.VARIABLE_LENGTH, 20],
        ['22', FieldParser.VARIABLE_LENGTH, 29],
        ['30', FieldParser.VARIABLE_LENGTH, 8],
        ['37', FieldParser.VARIABLE_LENGTH, 8],
        // internal company codes
        ['90', FieldParser.VARIABLE_LENGTH, 30],
        ['91', FieldParser.VARIABLE_LENGTH, 30],
        ['92', FieldParser.VARIABLE_LENGTH, 30],
        ['93', FieldParser.VARIABLE_LENGTH, 30],
        ['94', FieldParser.VARIABLE_LENGTH, 30],
        ['95', FieldParser.VARIABLE_LENGTH, 30],
        ['96', FieldParser.VARIABLE_LENGTH, 30],
        ['97', FieldParser.VARIABLE_LENGTH, 3],
        ['98', FieldParser.VARIABLE_LENGTH, 30],
        ['99', FieldParser.VARIABLE_LENGTH, 30],
    ];
    FieldParser.THREE_DIGIT_DATA_LENGTH = [
        // Same format as above
        ['240', FieldParser.VARIABLE_LENGTH, 30],
        ['241', FieldParser.VARIABLE_LENGTH, 30],
        ['242', FieldParser.VARIABLE_LENGTH, 6],
        ['250', FieldParser.VARIABLE_LENGTH, 30],
        ['251', FieldParser.VARIABLE_LENGTH, 30],
        ['253', FieldParser.VARIABLE_LENGTH, 17],
        ['254', FieldParser.VARIABLE_LENGTH, 20],
        ['400', FieldParser.VARIABLE_LENGTH, 30],
        ['401', FieldParser.VARIABLE_LENGTH, 30],
        ['402', 17],
        ['403', FieldParser.VARIABLE_LENGTH, 30],
        ['410', 13],
        ['411', 13],
        ['412', 13],
        ['413', 13],
        ['414', 13],
        ['420', FieldParser.VARIABLE_LENGTH, 20],
        ['421', FieldParser.VARIABLE_LENGTH, 15],
        ['422', 3],
        ['423', FieldParser.VARIABLE_LENGTH, 15],
        ['424', 3],
        ['425', 3],
        ['426', 3],
    ];
    FieldParser.THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH = [
        // Same format as above
        ['310', 6],
        ['311', 6],
        ['312', 6],
        ['313', 6],
        ['314', 6],
        ['315', 6],
        ['316', 6],
        ['320', 6],
        ['321', 6],
        ['322', 6],
        ['323', 6],
        ['324', 6],
        ['325', 6],
        ['326', 6],
        ['327', 6],
        ['328', 6],
        ['329', 6],
        ['330', 6],
        ['331', 6],
        ['332', 6],
        ['333', 6],
        ['334', 6],
        ['335', 6],
        ['336', 6],
        ['340', 6],
        ['341', 6],
        ['342', 6],
        ['343', 6],
        ['344', 6],
        ['345', 6],
        ['346', 6],
        ['347', 6],
        ['348', 6],
        ['349', 6],
        ['350', 6],
        ['351', 6],
        ['352', 6],
        ['353', 6],
        ['354', 6],
        ['355', 6],
        ['356', 6],
        ['357', 6],
        ['360', 6],
        ['361', 6],
        ['362', 6],
        ['363', 6],
        ['364', 6],
        ['365', 6],
        ['366', 6],
        ['367', 6],
        ['368', 6],
        ['369', 6],
        ['390', FieldParser.VARIABLE_LENGTH, 15],
        ['391', FieldParser.VARIABLE_LENGTH, 18],
        ['392', FieldParser.VARIABLE_LENGTH, 15],
        ['393', FieldParser.VARIABLE_LENGTH, 18],
        ['703', FieldParser.VARIABLE_LENGTH, 30],
    ];
    FieldParser.FOUR_DIGIT_DATA_LENGTH = [
        // Same format as above
        ['7001', 13],
        ['7002', FieldParser.VARIABLE_LENGTH, 30],
        ['7003', 10],
        ['8001', 14],
        ['8002', FieldParser.VARIABLE_LENGTH, 20],
        ['8003', FieldParser.VARIABLE_LENGTH, 30],
        ['8004', FieldParser.VARIABLE_LENGTH, 30],
        ['8005', 6],
        ['8006', 18],
        ['8007', FieldParser.VARIABLE_LENGTH, 30],
        ['8008', FieldParser.VARIABLE_LENGTH, 12],
        ['8018', 18],
        ['8020', FieldParser.VARIABLE_LENGTH, 25],
        ['8100', 6],
        ['8101', 10],
        ['8102', 2],
        ['8110', FieldParser.VARIABLE_LENGTH, 70],
        ['8200', FieldParser.VARIABLE_LENGTH, 70],
    ];
    return FieldParser;
}());
exports.default = FieldParser;
