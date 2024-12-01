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
/**
 * <p>Encapsulates a set of error-correction blocks in one symbol version. Most versions will
 * use blocks of differing sizes within one version, so, this encapsulates the parameters for
 * each set of blocks. It also holds the number of error-correction codewords per block since it
 * will be the same across all blocks within one version.</p>
 */
var ECBlocks = /** @class */ (function () {
    function ECBlocks(ecCodewordsPerBlock /*int*/) {
        var ecBlocks = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            ecBlocks[_i - 1] = arguments[_i];
        }
        this.ecCodewordsPerBlock = ecCodewordsPerBlock;
        this.ecBlocks = ecBlocks;
    }
    ECBlocks.prototype.getECCodewordsPerBlock = function () {
        return this.ecCodewordsPerBlock;
    };
    ECBlocks.prototype.getNumBlocks = function () {
        var e_1, _a;
        var total = 0;
        var ecBlocks = this.ecBlocks;
        try {
            for (var ecBlocks_1 = __values(ecBlocks), ecBlocks_1_1 = ecBlocks_1.next(); !ecBlocks_1_1.done; ecBlocks_1_1 = ecBlocks_1.next()) {
                var ecBlock = ecBlocks_1_1.value;
                total += ecBlock.getCount();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (ecBlocks_1_1 && !ecBlocks_1_1.done && (_a = ecBlocks_1.return)) _a.call(ecBlocks_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return total;
    };
    ECBlocks.prototype.getTotalECCodewords = function () {
        return this.ecCodewordsPerBlock * this.getNumBlocks();
    };
    ECBlocks.prototype.getECBlocks = function () {
        return this.ecBlocks;
    };
    return ECBlocks;
}());
export default ECBlocks;
