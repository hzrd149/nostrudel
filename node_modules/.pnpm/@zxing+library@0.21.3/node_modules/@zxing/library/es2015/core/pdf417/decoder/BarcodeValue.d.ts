import { int } from '../../../customTypings';
/**
 * @author Guenther Grau
 */
export default class BarcodeValue {
    private values;
    /**
     * Add an occurrence of a value
     */
    setValue(value: int): void;
    /**
     * Determines the maximum occurrence of a set value and returns all values which were set with this occurrence.
     * @return an array of int, containing the values with the highest occurrence, or null, if no value was set
     */
    getValue(): Int32Array;
    getConfidence(value: int): int;
}
