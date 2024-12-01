import ModulusPoly from './ModulusPoly';
import ModulusBase from './ModulusBase';
/**
 * <p>A field based on powers of a generator integer, modulo some modulus.</p>
 *
 * @author Sean Owen
 * @see com.google.zxing.common.reedsolomon.GenericGF
 */
export default class ModulusGF extends ModulusBase {
    static PDF417_GF: ModulusGF;
    private zero;
    private one;
    private constructor();
    getZero(): ModulusPoly;
    getOne(): ModulusPoly;
    buildMonomial(degree: number, coefficient: number): ModulusPoly;
}
