"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DataCharacter = /** @class */ (function () {
    function DataCharacter(value, checksumPortion) {
        this.value = value;
        this.checksumPortion = checksumPortion;
    }
    DataCharacter.prototype.getValue = function () {
        return this.value;
    };
    DataCharacter.prototype.getChecksumPortion = function () {
        return this.checksumPortion;
    };
    DataCharacter.prototype.toString = function () {
        return this.value + '(' + this.checksumPortion + ')';
    };
    DataCharacter.prototype.equals = function (o) {
        if (!(o instanceof DataCharacter)) {
            return false;
        }
        var that = o;
        return this.value === that.value && this.checksumPortion === that.checksumPortion;
    };
    DataCharacter.prototype.hashCode = function () {
        return this.value ^ this.checksumPortion;
    };
    return DataCharacter;
}());
exports.default = DataCharacter;
