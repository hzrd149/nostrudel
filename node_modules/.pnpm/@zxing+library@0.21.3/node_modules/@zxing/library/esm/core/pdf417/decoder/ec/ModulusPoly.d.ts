import ModulusBase from './ModulusBase';
/**
 * @author Sean Owen
 * @see com.google.zxing.common.reedsolomon.GenericGFPoly
 */
export default class ModulusPoly {
    private field;
    private coefficients;
    constructor(field: ModulusBase, coefficients: Int32Array);
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
    add(other: ModulusPoly): ModulusPoly;
    subtract(other: ModulusPoly): ModulusPoly;
    multiply(other: ModulusPoly | number): ModulusPoly;
    multiplyOther(other: ModulusPoly): ModulusPoly;
    negative(): ModulusPoly;
    multiplyScalar(scalar: number): ModulusPoly;
    multiplyByMonomial(degree: number, coefficient: number): ModulusPoly;
    toString(): String;
}
