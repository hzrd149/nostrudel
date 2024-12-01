var System = /** @class */ (function () {
    function System() {
    }
    // public static void arraycopy(Object src, int srcPos, Object dest, int destPos, int length)
    /**
     * Makes a copy of a array.
     */
    System.arraycopy = function (src, srcPos, dest, destPos, length) {
        // TODO: better use split or set?
        while (length--) {
            dest[destPos++] = src[srcPos++];
        }
    };
    /**
     * Returns the current time in milliseconds.
     */
    System.currentTimeMillis = function () {
        return Date.now();
    };
    return System;
}());
export default System;
