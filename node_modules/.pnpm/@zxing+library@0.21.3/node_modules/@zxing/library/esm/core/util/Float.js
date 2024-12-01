/**
 * Ponyfill for Java's Float class.
 */
var Float = /** @class */ (function () {
    function Float() {
    }
    /**
     * SincTS has no difference between int and float, there's all numbers,
     * this is used only to polyfill Java code.
     */
    Float.floatToIntBits = function (f) {
        return f;
    };
    /**
     * The float max value in JS is the number max value.
     */
    Float.MAX_VALUE = Number.MAX_SAFE_INTEGER;
    return Float;
}());
export default Float;
