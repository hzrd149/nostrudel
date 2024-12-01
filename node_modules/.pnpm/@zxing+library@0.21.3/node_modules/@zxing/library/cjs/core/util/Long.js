"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Ponyfill for Java's Long class.
 */
var Long = /** @class */ (function () {
    function Long() {
    }
    /**
     * Parses a string to a number, since JS has no really Int64.
     *
     * @param num Numeric string.
     * @param radix Destination radix.
     */
    Long.parseLong = function (num, radix) {
        if (radix === void 0) { radix = undefined; }
        return parseInt(num, radix);
    };
    return Long;
}());
exports.default = Long;
