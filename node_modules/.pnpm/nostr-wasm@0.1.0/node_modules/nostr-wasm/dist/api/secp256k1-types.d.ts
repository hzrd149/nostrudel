import type { WasmExportsExtension } from '../gen/wasm.js';
import type { Pointer } from '../types.js';
export type PointerContext = Pointer<'context'>;
export type PointerSeed = Pointer<'seed'>;
export type PointerXOnlyKey = Pointer<'xonly_key'>;
export type PointerKeypair = Pointer<'keypair'>;
export type PointerSig = Pointer<'signature'>;
export type PointerSha256 = Pointer<'sha256'>;
export declare const enum ByteLens {
    PRIVATE_KEY = 32,
    KEYPAIR_LIB = 96,
    XONLY_KEY_LIB = 64,
    BIP340_SIG = 64,// secp256k1_bip340_signature: char [64];
    XONLY_PUBKEY = 32,// serialized
    MSG_HASH = 32,
    NONCE_ENTROPY = 32,
    SHA256_LIB = 104
}
export declare const enum Flags {
    CONTEXT_NONE = 1,
    CONTEXT_VERIFY = 257,
    CONTEXT_SIGN = 513,
    CONTEXT_DECLASSIFY = 1025
}
export declare const enum BinaryResult {
    SUCCESS = 1,
    FAILURE = 0
}
export interface Secp256k1WasmCore extends WasmExportsExtension {
    /** Create a secp256k1 context object (in dynamically allocated memory).
     *
     *  This function uses malloc to allocate memory. It is guaranteed that malloc is
     *  called at most once for every call of this function. If you need to avoid dynamic
     *  memory allocation entirely, see secp256k1_context_static and the functions in
     *  secp256k1_preallocated.h.
     *
     *  Returns: a newly created context object.
     *  In:      flags: Always set to SECP256K1_CONTEXT_NONE (see below).
     */
    context_create(xm_flags: Flags): PointerContext;
    /** Compute the keypair for a secret key.
     *
     *  Returns: 1: secret was valid, keypair is ready to use
     *           0: secret was invalid, try again with a different secret
     *  Args:    ctx: pointer to a context object, initialized for signing.
     *  Out: keypair: pointer to the created keypair.
     *  In:   seckey: pointer to a 32-byte secret key.
     */
    keypair_create(ctx: PointerContext, keypair: PointerKeypair, secret: Pointer<32>): BinaryResult;
    /** Get the x-only public key from a keypair.
     *
     *  This is the same as calling secp256k1_keypair_pub and then
     *  secp256k1_xonly_pubkey_from_pubkey.
     *
     *  Returns: 1 always.
     *  Args:   ctx: pointer to a context object.
     *  Out: pubkey: pointer to an xonly_pubkey object. If 1 is returned, it is set
     *               to the keypair public key after converting it to an
     *               xonly_pubkey. If not, it's set to an invalid value.
     *    pk_parity: Ignored if NULL. Otherwise, pointer to an integer that will be set to the
     *               pk_parity argument of secp256k1_xonly_pubkey_from_pubkey.
     *  In: keypair: pointer to a keypair.
     */
    keypair_xonly_pub(ctx: PointerContext, pubkey: PointerXOnlyKey, pk_parity: Pointer | null, keypair: PointerKeypair): BinaryResult;
    /** Parse a 32-byte sequence into a xonly_pubkey object.
     *
     *  Returns: 1 if the public key was fully valid.
     *           0 if the public key could not be parsed or is invalid.
     *
     *  Args:   ctx: a secp256k1 context object.
     *  Out: pubkey: pointer to a pubkey object. If 1 is returned, it is set to a
     *               parsed version of input. If not, it's set to an invalid value.
     *  In: input32: pointer to a serialized xonly_pubkey.
     */
    xonly_pubkey_parse(ctx: PointerContext, pubkey: PointerXOnlyKey, input32: Pointer<32>): BinaryResult;
    /** Serialize an xonly_pubkey object into a 32-byte sequence.
     *
     *  Returns: 1 always.
     *
     *  Args:     ctx: a secp256k1 context object.
     *  Out: output32: a pointer to a 32-byte array to place the serialized key in.
     *  In:    pubkey: a pointer to a secp256k1_xonly_pubkey containing an initialized public key.
     */
    xonly_pubkey_serialize(ctx: PointerContext, output32: Pointer<32>, pubkey: PointerXOnlyKey): BinaryResult;
    /** Create a Schnorr signature.
     *
     *  Does _not_ strictly follow BIP-340 because it does not verify the resulting
     *  signature. Instead, you can manually use secp256k1_schnorrsig_verify and
     *  abort if it fails.
     *
     *  This function only signs 32-byte messages. If you have messages of a
     *  different size (or the same size but without a context-specific tag
     *  prefix), it is recommended to create a 32-byte message hash with
     *  secp256k1_tagged_sha256 and then sign the hash. Tagged hashing allows
     *  providing an context-specific tag for domain separation. This prevents
     *  signatures from being valid in multiple contexts by accident.
     *
     *  Returns 1 on success, 0 on failure.
     *  Args:    ctx: pointer to a context object, initialized for signing.
     *  Out:   sig64: pointer to a 64-byte array to store the serialized signature.
     *  In:    msg32: the 32-byte message being signed.
     *       keypair: pointer to an initialized keypair.
     *    aux_rand32: 32 bytes of fresh randomness. While recommended to provide
     *                this, it is only supplemental to security and can be NULL. A
     *                NULL argument is treated the same as an all-zero one. See
     *                BIP-340 "Default Signing" for a full explanation of this
     *                argument and for guidance if randomness is expensive.
     */
    schnorrsig_sign32(ctx: PointerContext, sig64: PointerSig, msg32: Pointer<32>, keypair: PointerKeypair, aux_rand32: Pointer<32>): BinaryResult;
    /** Verify a Schnorr signature.
     *
     *  Returns: 1: correct signature
     *           0: incorrect signature
     *  Args:    ctx: a secp256k1 context object, initialized for verification.
     *  In:    sig64: pointer to the 64-byte signature to verify.
     *           msg: the message being verified. Can only be NULL if msglen is 0.
     *        msglen: length of the message
     *        pubkey: pointer to an x-only public key to verify with (cannot be NULL)
     */
    schnorrsig_verify(ctx: PointerContext, sig64: PointerSig, msg32: Pointer<32>, msglen: number, pubkey: PointerXOnlyKey): BinaryResult;
    sha256_initialize(hash: PointerSha256): void;
    sha256_write(hash: PointerSha256, data: Pointer<number>, size: number): void;
    sha256_finalize(hash: PointerSha256, out32: Pointer<32>): void;
}
