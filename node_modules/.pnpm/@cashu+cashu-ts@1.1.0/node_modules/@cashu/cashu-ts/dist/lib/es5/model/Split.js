"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Split = void 0;
var Split = /** @class */ (function () {
    function Split(proofs, amount, outputs) {
        this.proofs = proofs;
        this.amount = amount;
        this.outputs = outputs;
    }
    Split.prototype.getSerializedSplit = function () {
        return {
            proofs: this.proofs,
            amount: this.amount,
            outputs: this.outputs.map(function (blindedMessage) {
                return { amount: blindedMessage.amount, B_: blindedMessage.B_.toHex(true) };
            })
        };
    };
    return Split;
}());
exports.Split = Split;
