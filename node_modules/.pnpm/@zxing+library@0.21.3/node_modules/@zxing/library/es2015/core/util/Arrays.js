import System from './System';
import IllegalArgumentException from '../IllegalArgumentException';
import ArrayIndexOutOfBoundsException from '../ArrayIndexOutOfBoundsException';
export default class Arrays {
    /**
     * Assigns the specified int value to each element of the specified array
     * of ints.
     *
     * @param a the array to be filled
     * @param val the value to be stored in all elements of the array
     */
    static fill(a, val) {
        for (let i = 0, len = a.length; i < len; i++)
            a[i] = val;
    }
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
    static fillWithin(a, fromIndex, toIndex, val) {
        Arrays.rangeCheck(a.length, fromIndex, toIndex);
        for (let i = fromIndex; i < toIndex; i++)
            a[i] = val;
    }
    /**
     * Checks that {@code fromIndex} and {@code toIndex} are in
     * the range and throws an exception if they aren't.
     */
    static rangeCheck(arrayLength, fromIndex, toIndex) {
        if (fromIndex > toIndex) {
            throw new IllegalArgumentException('fromIndex(' + fromIndex + ') > toIndex(' + toIndex + ')');
        }
        if (fromIndex < 0) {
            throw new ArrayIndexOutOfBoundsException(fromIndex);
        }
        if (toIndex > arrayLength) {
            throw new ArrayIndexOutOfBoundsException(toIndex);
        }
    }
    static asList(...args) {
        return args;
    }
    static create(rows, cols, value) {
        let arr = Array.from({ length: rows });
        return arr.map(x => Array.from({ length: cols }).fill(value));
    }
    static createInt32Array(rows, cols, value) {
        let arr = Array.from({ length: rows });
        return arr.map(x => Int32Array.from({ length: cols }).fill(value));
    }
    static equals(first, second) {
        if (!first) {
            return false;
        }
        if (!second) {
            return false;
        }
        if (!first.length) {
            return false;
        }
        if (!second.length) {
            return false;
        }
        if (first.length !== second.length) {
            return false;
        }
        for (let i = 0, length = first.length; i < length; i++) {
            if (first[i] !== second[i]) {
                return false;
            }
        }
        return true;
    }
    static hashCode(a) {
        if (a === null) {
            return 0;
        }
        let result = 1;
        for (const element of a) {
            result = 31 * result + element;
        }
        return result;
    }
    static fillUint8Array(a, value) {
        for (let i = 0; i !== a.length; i++) {
            a[i] = value;
        }
    }
    static copyOf(original, newLength) {
        return original.slice(0, newLength);
    }
    static copyOfUint8Array(original, newLength) {
        if (original.length <= newLength) {
            const newArray = new Uint8Array(newLength);
            newArray.set(original);
            return newArray;
        }
        return original.slice(0, newLength);
    }
    static copyOfRange(original, from, to) {
        const newLength = to - from;
        const copy = new Int32Array(newLength);
        System.arraycopy(original, from, copy, 0, newLength);
        return copy;
    }
    /*
    * Returns the index of of the element in a sorted array or (-n-1) where n is the insertion point
    * for the new element.
    * Parameters:
    *     ar - A sorted array
    *     el - An element to search for
    *     comparator - A comparator function. The function takes two arguments: (a, b) and returns:
    *        a negative number  if a is less than b;
    *        0 if a is equal to b;
    *        a positive number of a is greater than b.
    * The array may contain duplicate elements. If there are more than one equal elements in the array,
    * the returned value can be the index of any one of the equal elements.
    *
    * http://jsfiddle.net/aryzhov/pkfst550/
    */
    static binarySearch(ar, el, comparator) {
        if (undefined === comparator) {
            comparator = Arrays.numberComparator;
        }
        let m = 0;
        let n = ar.length - 1;
        while (m <= n) {
            const k = (n + m) >> 1;
            const cmp = comparator(el, ar[k]);
            if (cmp > 0) {
                m = k + 1;
            }
            else if (cmp < 0) {
                n = k - 1;
            }
            else {
                return k;
            }
        }
        return -m - 1;
    }
    static numberComparator(a, b) {
        return a - b;
    }
}
