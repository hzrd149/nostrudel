/// <reference types="web" />
/// <reference types="node" />
/**
 * Wrapper instance providing operations backed by libsecp256k1 WASM module
 */
export interface Secp256k1 {
    /**
     * Generates a new private key using crypto secure random bytes and without modulo bias
     * @returns a new private key (32 bytes)
     */
    gen_secret_key(): Uint8Array;
    /**
     * Computes the public key for a given private key
     * @param sk - the private key (32 bytes)
     * @returns the public key (32 bytes)
     */
    get_public_key(sk: Uint8Array): Uint8Array;
    /**
     * Signs the given message hash using the given private key.
     * @param sk - the private key
     * @param hash - the message hash (32 bytes)
     * @param entropy - optional entropy to use
     * @returns compact signature (64 bytes)`
     */
    sign(sk: Uint8Array, hash: Uint8Array, ent?: Uint8Array): Uint8Array;
    /**
     * Verifies the signature is valid for the given message hash and public key
     * @param signature - compact signature (64 bytes)
     * @param msg - the message hash (32 bytes)
     * @param pk - the public key
     */
    verify(signature: Uint8Array, hash: Uint8Array, pk: Uint8Array): boolean;
    sha256(message: string): Uint8Array;
}
/**
 * Creates a new instance of the secp256k1 WASM and returns its ES wrapper
 * @param z_src - a Response containing the WASM binary, a Promise that resolves to one,
 * 	or the raw bytes to the WASM binary as a {@link BufferSource}
 * @returns the wrapper API
 */
export declare const WasmSecp256k1: (z_src: Promise<Response> | Response | BufferSource) => Promise<Secp256k1>;
