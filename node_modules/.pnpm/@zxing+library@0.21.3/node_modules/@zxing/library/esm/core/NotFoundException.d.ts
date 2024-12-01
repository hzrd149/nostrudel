import Exception from './Exception';
/**
 * Custom Error class of type Exception.
 */
export default class NotFoundException extends Exception {
    static readonly kind: string;
    static getNotFoundInstance(): NotFoundException;
}
