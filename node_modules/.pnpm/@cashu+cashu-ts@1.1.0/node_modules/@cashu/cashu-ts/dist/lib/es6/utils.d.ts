import { AmountPreference, Keys, Proof, Token } from './model/types/index.js';
declare function splitAmount(value: number, amountPreference?: Array<AmountPreference>): Array<number>;
declare function getDefaultAmountPreference(amount: number): Array<AmountPreference>;
declare function bytesToNumber(bytes: Uint8Array): bigint;
declare function hexToNumber(hex: string): bigint;
declare function bigIntStringify<T>(_key: unknown, value: T): string | T;
/**
 * Helper function to encode a v3 cashu token
 * @param token
 * @returns
 */
declare function getEncodedToken(token: Token): string;
declare function getEncodedTokenV4(token: Token): string;
/**
 * Helper function to decode cashu tokens into object
 * @param token an encoded cashu token (cashuAey...)
 * @returns cashu token object
 */
declare function getDecodedToken(token: string): Token;
/**
 * Returns the keyset id of a set of keys
 * @param keys keys object to derive keyset id from
 * @returns
 */
export declare function deriveKeysetId(keys: Keys): string;
export declare function sortProofsById(proofs: Array<Proof>): Proof[];
export declare function isObj(v: unknown): v is object;
export declare function checkResponse(data: {
    error?: string;
    detail?: string;
}): void;
export declare function joinUrls(...parts: Array<string>): string;
export declare function sanitizeUrl(url: string): string;
export { bigIntStringify, bytesToNumber, getDecodedToken, getEncodedToken, getEncodedTokenV4, hexToNumber, splitAmount, getDefaultAmountPreference };
