"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindedSignature = void 0;
var BlindedSignature = /** @class */ (function () {
    function BlindedSignature(id, amount, C_) {
        this.id = id;
        this.amount = amount;
        this.C_ = C_;
    }
    BlindedSignature.prototype.getSerializedBlindedSignature = function () {
        return { id: this.id, amount: this.amount, C_: this.C_.toHex(true) };
    };
    return BlindedSignature;
}());
exports.BlindedSignature = BlindedSignature;
