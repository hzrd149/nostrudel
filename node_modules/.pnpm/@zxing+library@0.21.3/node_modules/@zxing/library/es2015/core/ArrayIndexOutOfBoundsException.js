import IndexOutOfBoundsException from './IndexOutOfBoundsException';
/**
 * Custom Error class of type Exception.
 */
export default class ArrayIndexOutOfBoundsException extends IndexOutOfBoundsException {
    constructor(index = undefined, message = undefined) {
        super(message);
        this.index = index;
        this.message = message;
    }
}
ArrayIndexOutOfBoundsException.kind = 'ArrayIndexOutOfBoundsException';
