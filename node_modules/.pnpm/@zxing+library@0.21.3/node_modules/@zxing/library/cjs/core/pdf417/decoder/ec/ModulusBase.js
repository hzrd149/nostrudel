"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IllegalArgumentException_1 = require("../../../IllegalArgumentException");
var ArithmeticException_1 = require("../../../ArithmeticException");
var ModulusBase = /** @class */ (function () {
    function ModulusBase() {
    }
    ModulusBase.prototype.add = function (a, b) {
        return (a + b) % this.modulus;
    };
    ModulusBase.prototype.subtract = function (a, b) {
        return (this.modulus + a - b) % this.modulus;
    };
    ModulusBase.prototype.exp = function (a) {
        return this.expTable[a];
    };
    ModulusBase.prototype.log = function (a) {
        if (a === 0) {
            throw new IllegalArgumentException_1.default();
        }
        return this.logTable[a];
    };
    ModulusBase.prototype.inverse = function (a) {
        if (a === 0) {
            throw new ArithmeticException_1.default();
        }
        return this.expTable[this.modulus - this.logTable[a] - 1];
    };
    ModulusBase.prototype.multiply = function (a, b) {
        if (a === 0 || b === 0) {
            return 0;
        }
        return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.modulus - 1)];
    };
    ModulusBase.prototype.getSize = function () {
        return this.modulus;
    };
    ModulusBase.prototype.equals = function (o) {
        return o === this;
    };
    return ModulusBase;
}());
exports.default = ModulusBase;
