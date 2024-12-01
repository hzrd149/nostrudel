/// <reference types="web" />
import type { WasmImports } from 'src/types';
export declare function defineWasmEnv(label: string): readonly [WasmImports, (d_memory: WebAssembly.Memory) => readonly [ArrayBuffer, Uint8Array, Uint32Array]];
