/**
 * Java Formatter class polyfill that works in the JS way.
 */
export default class Formatter {
    /**
     * The internal formatted value.
     */
    buffer: string;
    constructor();
    /**
     *
     * @see https://stackoverflow.com/a/13439711/4367683
     *
     * @param str
     * @param arr
     */
    private static form;
    /**
     *
     * @param append The new string to append.
     * @param args Argumets values to be formated.
     */
    format(append: string, ...args: any): void;
    /**
     * Returns the Formatter string value.
     */
    toString(): string;
}
