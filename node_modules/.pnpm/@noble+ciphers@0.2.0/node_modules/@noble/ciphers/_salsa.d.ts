export type SalsaOpts = {
    core: (c: Uint32Array, key: Uint32Array, nonce: Uint32Array, out: Uint32Array, counter: number, rounds?: number) => void;
    rounds?: number;
    counterRight?: boolean;
    counterLen?: number;
    blockLen?: number;
    allow128bitKeys?: boolean;
    extendNonceFn?: (c: Uint32Array, key: Uint8Array, src: Uint8Array, dst: Uint8Array) => Uint8Array;
};
export declare const salsaBasic: (opts: SalsaOpts) => (key: Uint8Array, nonce: Uint8Array, data: Uint8Array, output?: Uint8Array, counter?: number) => Uint8Array;
//# sourceMappingURL=_salsa.d.ts.map