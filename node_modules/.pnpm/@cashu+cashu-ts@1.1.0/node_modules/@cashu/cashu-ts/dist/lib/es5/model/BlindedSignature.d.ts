import { ProjPointType } from '@noble/curves/abstract/weierstrass';
import { SerializedBlindedSignature } from './types/index.js';
declare class BlindedSignature {
    id: string;
    amount: number;
    C_: ProjPointType<bigint>;
    constructor(id: string, amount: number, C_: ProjPointType<bigint>);
    getSerializedBlindedSignature(): SerializedBlindedSignature;
}
export { BlindedSignature };
