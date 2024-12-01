"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Ponyfill for Java's Integer class.
 */
var Integer = /** @class */ (function () {
    function Integer() {
    }
    Integer.numberOfTrailingZeros = function (i) {
        var y;
        if (i === 0)
            return 32;
        var n = 31;
        y = i << 16;
        if (y !== 0) {
            n -= 16;
            i = y;
        }
        y = i << 8;
        if (y !== 0) {
            n -= 8;
            i = y;
        }
        y = i << 4;
        if (y !== 0) {
            n -= 4;
            i = y;
        }
        y = i << 2;
        if (y !== 0) {
            n -= 2;
            i = y;
        }
        return n - ((i << 1) >>> 31);
    };
    Integer.numberOfLeadingZeros = function (i) {
        // HD, Figure 5-6
        if (i === 0) {
            return 32;
        }
        var n = 1;
        if (i >>> 16 === 0) {
            n += 16;
            i <<= 16;
        }
        if (i >>> 24 === 0) {
            n += 8;
            i <<= 8;
        }
        if (i >>> 28 === 0) {
            n += 4;
            i <<= 4;
        }
        if (i >>> 30 === 0) {
            n += 2;
            i <<= 2;
        }
        n -= i >>> 31;
        return n;
    };
    Integer.toHexString = function (i) {
        return i.toString(16);
    };
    Integer.toBinaryString = function (intNumber) {
        return String(parseInt(String(intNumber), 2));
    };
    // Returns the number of one-bits in the two's complement binary representation of the specified int value. This function is sometimes referred to as the population count.
    // Returns:
    // the number of one-bits in the two's complement binary representation of the specified int value.
    Integer.bitCount = function (i) {
        // HD, Figure 5-2
        i = i - ((i >>> 1) & 0x55555555);
        i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
        i = (i + (i >>> 4)) & 0x0f0f0f0f;
        i = i + (i >>> 8);
        i = i + (i >>> 16);
        return i & 0x3f;
    };
    Integer.truncDivision = function (dividend, divisor) {
        return Math.trunc(dividend / divisor);
    };
    /**
     * Converts A string to an integer.
     * @param s A string to convert into a number.
     * @param radix A value between 2 and 36 that specifies the base of the number in numString. If this argument is not supplied, strings with a prefix of '0x' are considered hexadecimal. All other strings are considered decimal.
     */
    Integer.parseInt = function (num, radix) {
        if (radix === void 0) { radix = undefined; }
        return parseInt(num, radix);
    };
    Integer.MIN_VALUE_32_BITS = -2147483648;
    Integer.MAX_VALUE = Number.MAX_SAFE_INTEGER;
    return Integer;
}());
exports.default = Integer;
