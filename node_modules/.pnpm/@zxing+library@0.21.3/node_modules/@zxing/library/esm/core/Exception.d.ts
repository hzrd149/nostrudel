import { CustomError } from 'ts-custom-error';
/**
 * Custom Error class of type Exception.
 */
export default class Exception extends CustomError {
    message: string;
    /**
     * It's typed as string so it can be extended and overriden.
     */
    static readonly kind: string;
    /**
     * Allows Exception to be constructed directly
     * with some message and prototype definition.
     */
    constructor(message?: string);
    getKind(): string;
}
