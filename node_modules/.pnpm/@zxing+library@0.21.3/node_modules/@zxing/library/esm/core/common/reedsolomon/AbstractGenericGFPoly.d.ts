import AbstractGenericGF from './AbstractGenericGF';
/**
 * <p>Represents a polynomial whose coefficients are elements of a GF.
 * Instances of this class are immutable.</p>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code are an indirect
 * port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 */
export default abstract class AbstractGenericGFPoly {
    protected field: AbstractGenericGF;
    protected coefficients: Int32Array;
    getCoefficients(): Int32Array;
    /**
     * @return degree of this polynomial
     */
    getDegree(): number;
    /**
     * @return true iff this polynomial is the monomial "0"
     */
    isZero(): boolean;
    /**
     * @return coefficient of x^degree term in this polynomial
     */
    getCoefficient(degree: number): number;
    /**
     * @return evaluation of this polynomial at a given point
     */
    evaluateAt(a: number): number;
    abstract addOrSubtract(other: AbstractGenericGFPoly): AbstractGenericGFPoly;
    abstract multiply(other: AbstractGenericGFPoly): AbstractGenericGFPoly;
    abstract multiplyScalar(scalar: number): AbstractGenericGFPoly;
    abstract multiplyByMonomial(degree: number, coefficient: number): AbstractGenericGFPoly;
    abstract divide(other: AbstractGenericGFPoly): AbstractGenericGFPoly[];
    toString(): string;
}
