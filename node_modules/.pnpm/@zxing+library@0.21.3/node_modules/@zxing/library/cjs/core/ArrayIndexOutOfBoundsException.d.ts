import IndexOutOfBoundsException from './IndexOutOfBoundsException';
/**
 * Custom Error class of type Exception.
 */
export default class ArrayIndexOutOfBoundsException extends IndexOutOfBoundsException {
    index: number;
    message: string;
    static readonly kind: string;
    constructor(index?: number, message?: string);
}
