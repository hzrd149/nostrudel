import { int } from '../../customTypings';
export default class Arrays {
    /**
     * Assigns the specified int value to each element of the specified array
     * of ints.
     *
     * @param a the array to be filled
     * @param val the value to be stored in all elements of the array
     */
    static fill(a: Int32Array | Uint8Array | any[], val: int): void;
    /**
     * Assigns the specified int value to each element of the specified
     * range of the specified array of ints.  The range to be filled
     * extends from index {@code fromIndex}, inclusive, to index
     * {@code toIndex}, exclusive.  (If {@code fromIndex==toIndex}, the
     * range to be filled is empty.)
     *
     * @param a the array to be filled
     * @param fromIndex the index of the first element (inclusive) to be
     *        filled with the specified value
     * @param toIndex the index of the last element (exclusive) to be
     *        filled with the specified value
     * @param val the value to be stored in all elements of the array
     * @throws IllegalArgumentException if {@code fromIndex > toIndex}
     * @throws ArrayIndexOutOfBoundsException if {@code fromIndex < 0} or
     *         {@code toIndex > a.length}
     */
    static fillWithin(a: Int32Array, fromIndex: int, toIndex: int, val: int): void;
    /**
     * Checks that {@code fromIndex} and {@code toIndex} are in
     * the range and throws an exception if they aren't.
     */
    static rangeCheck(arrayLength: int, fromIndex: int, toIndex: int): void;
    static asList<T = any>(...args: T[]): T[];
    static create<T = any>(rows: int, cols: int, value?: T): T[][];
    static createInt32Array(rows: int, cols: int, value?: int): Int32Array[];
    static equals(first: any, second: any): boolean;
    static hashCode(a: any): number;
    static fillUint8Array(a: Uint8Array, value: number): void;
    static copyOf(original: Int32Array, newLength: number): Int32Array;
    static copyOfUint8Array(original: Uint8Array, newLength: number): Uint8Array;
    static copyOfRange(original: Int32Array, from: number, to: number): Int32Array;
    static binarySearch(ar: Int32Array, el: number, comparator?: (a: number, b: number) => number): number;
    static numberComparator(a: number, b: number): number;
}
