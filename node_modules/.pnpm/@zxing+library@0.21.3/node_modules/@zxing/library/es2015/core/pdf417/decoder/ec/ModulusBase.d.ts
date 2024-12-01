export default class ModulusBase {
    protected logTable: Int32Array;
    protected expTable: Int32Array;
    protected modulus: number;
    add(a: number, b: number): number;
    subtract(a: number, b: number): number;
    exp(a: number): number;
    log(a: number): number;
    inverse(a: number): number;
    multiply(a: number, b: number): number;
    getSize(): number;
    equals(o: Object): boolean;
}
