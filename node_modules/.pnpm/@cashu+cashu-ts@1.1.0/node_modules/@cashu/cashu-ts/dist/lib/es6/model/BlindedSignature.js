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
export { BlindedSignature };
//# sourceMappingURL=BlindedSignature.js.map