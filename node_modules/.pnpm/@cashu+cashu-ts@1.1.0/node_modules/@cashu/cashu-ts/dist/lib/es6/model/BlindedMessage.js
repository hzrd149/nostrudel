var BlindedMessage = /** @class */ (function () {
    function BlindedMessage(amount, B_, id) {
        this.amount = amount;
        this.B_ = B_;
        this.id = id;
    }
    BlindedMessage.prototype.getSerializedBlindedMessage = function () {
        return { amount: this.amount, B_: this.B_.toHex(true), id: this.id };
    };
    return BlindedMessage;
}());
export { BlindedMessage };
//# sourceMappingURL=BlindedMessage.js.map