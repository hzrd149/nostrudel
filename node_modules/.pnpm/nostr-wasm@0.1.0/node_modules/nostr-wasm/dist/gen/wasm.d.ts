/// <reference types="web" />
import type { Pointer, WasmImports, WasmExports } from '../types.js';
export interface WasmImportsExtension extends WasmImports {
}
export interface WasmExportsExtension extends WasmExports {
    sha256_initialize: Function;
    sha256_write: Function;
    sha256_finalize: Function;
    context_create: Function;
    xonly_pubkey_parse: Function;
    xonly_pubkey_serialize: Function;
    keypair_create: Function;
    keypair_xonly_pub: Function;
    schnorrsig_sign32: Function;
    schnorrsig_verify: Function;
}
export declare const map_wasm_imports: (g_imports: WasmImportsExtension) => {
    a: {
        a: () => void;
        f: <nb_size extends number>(ip_dst: Pointer<nb_size>, ip_src: Pointer<nb_size>, nb_size: nb_size) => Uint8Array;
        d: (nb_size: number) => void;
        e: () => number;
        c: () => number;
        b: (i_fd: number, ip_iov: Pointer<number>, nl_iovs: number, ip_written: Pointer<number>) => 0;
    };
};
export declare const map_wasm_exports: <g_extension extends WasmExportsExtension = WasmExportsExtension>(g_exports: WebAssembly.Exports) => g_extension;
