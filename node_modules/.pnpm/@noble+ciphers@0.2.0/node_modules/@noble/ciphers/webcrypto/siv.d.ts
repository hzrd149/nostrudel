import { AsyncCipher } from '../utils.js';
export declare function deriveKeys(key: Uint8Array, nonce: Uint8Array): Promise<{
    authKey: Uint8Array;
    encKey: Uint8Array;
}>;
export declare function aes_256_gcm_siv(key: Uint8Array, nonce: Uint8Array, AAD: Uint8Array): Promise<AsyncCipher>;
//# sourceMappingURL=siv.d.ts.map