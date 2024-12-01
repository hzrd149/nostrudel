/// <reference types="web" />
import type { ImportMapper } from 'src/types';
export declare const emsimp: (f_map_imports: ImportMapper, label: string) => readonly [WebAssembly.Imports, (d_memory: WebAssembly.Memory) => readonly [ArrayBuffer, Uint8Array, Uint32Array]];
