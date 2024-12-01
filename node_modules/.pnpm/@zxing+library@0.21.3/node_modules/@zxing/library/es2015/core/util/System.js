export default class System {
    // public static void arraycopy(Object src, int srcPos, Object dest, int destPos, int length)
    /**
     * Makes a copy of a array.
     */
    static arraycopy(src, srcPos, dest, destPos, length) {
        // TODO: better use split or set?
        while (length--) {
            dest[destPos++] = src[srcPos++];
        }
    }
    /**
     * Returns the current time in milliseconds.
     */
    static currentTimeMillis() {
        return Date.now();
    }
}
