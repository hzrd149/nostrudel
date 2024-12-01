/// <reference types="web" />
/// <reference types="node" />
type Event = {
    id: string;
    pubkey: string;
    sig: string;
    content: string;
    kind: number;
    created_at: number;
    tags: string[][];
};
export interface Nostr {
    /**
     * Generates a new private key using crypto secure random bytes and without modulo bias
     * @returns a new private key (32 bytes)
     */
    generateSecretKey(): Uint8Array;
    /**
     * Computes the public key for a given private key
     * @param seckey - the private key (32 bytes)
     * @returns the public key (32 bytes)
     */
    getPublicKey(seckey: Uint8Array): Uint8Array;
    /**
     * Fills in an event object with pubkey, id and sig.
     * @param event - the Nostr event object
     * @param seckey - the private key
     * @param entropy - optional entropy to use
     */
    finalizeEvent(event: Event, seckey: Uint8Array, ent?: Uint8Array): void;
    /**
     * Verifies if an event's .id property is correct and that the .sig is valid
     * @param event - the Nostr event object
     * @throws an error with a .message if the event is not valid for any reason
     */
    verifyEvent(event: Event): void;
}
/**
 * Creates a new instance of the secp256k1 WASM and returns the Nostr wrapper
 * @param z_src - a Response containing the WASM binary, a Promise that resolves to one,
 * 	or the raw bytes to the WASM binary as a {@link BufferSource}
 * @returns the wrapper API
 */
export declare const NostrWasm: (z_src: Promise<Response> | Response | BufferSource) => Promise<Nostr>;
export {};
