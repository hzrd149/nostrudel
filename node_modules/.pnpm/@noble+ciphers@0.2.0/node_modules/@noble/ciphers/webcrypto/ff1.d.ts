import type { AsyncCipher } from '../utils.js';
export declare function encryptBlock(msg: Uint8Array, key: Uint8Array): Promise<Uint8Array>;
export declare function FF1(radix: number, key: Uint8Array, tweak?: Uint8Array): {
    encrypt(x: number[]): Promise<number[]>;
    decrypt(x: number[]): Promise<number[]>;
};
export declare function BinaryFF1(key: Uint8Array, tweak?: Uint8Array): AsyncCipher;
//# sourceMappingURL=ff1.d.ts.map