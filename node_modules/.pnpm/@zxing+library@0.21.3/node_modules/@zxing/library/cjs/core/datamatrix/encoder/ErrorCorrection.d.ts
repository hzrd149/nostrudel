import SymbolInfo from './SymbolInfo';
/**
 * Error Correction Code for ECC200.
 */
declare class ErrorCorrection {
    /**
     * Creates the ECC200 error correction for an encoded message.
     *
     * @param codewords  the codewords
     * @param symbolInfo information about the symbol to be encoded
     * @return the codewords with interleaved error correction.
     */
    static encodeECC200(codewords: string, symbolInfo: SymbolInfo): string;
    private static createECCBlock;
}
export default ErrorCorrection;
