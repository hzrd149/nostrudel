/**
 * <p>This class contains utility methods for performing mathematical operations over
 * the Galois Fields. Operations use a given primitive polynomial in calculations.</p>
 *
 * <p>Throughout this package, elements of the GF are represented as an {@code int}
 * for convenience and speed (but at the cost of memory).
 * </p>
 *
 * @author Sean Owen
 * @author David Olivier
 */
export default abstract class AbstractGenericGF {
    protected expTable: Int32Array;
    protected logTable: Int32Array;
    abstract getZero(): any;
    abstract buildMonomial(degree: number, coefficient: number): any;
    abstract equals(o: Object): boolean;
    abstract multiply(a: number, b: number): number;
    abstract inverse(a: number): number;
    /**
     * @return 2 to the power of a in GF(size)
     */
    exp(a: number): number;
    /**
     * @return base 2 log of a in GF(size)
     */
    log(a: number): number;
    /**
     * Implements both addition and subtraction -- they are the same in GF(size).
     *
     * @return sum/difference of a and b
     */
    static addOrSubtract(a: number, b: number): number;
}
