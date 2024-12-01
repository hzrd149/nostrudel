import { BlindedMessage } from './BlindedMessage.js';
import { Proof } from './types/index.js';
declare class Split {
    proofs: Array<Proof>;
    amount: number;
    outputs: Array<BlindedMessage>;
    constructor(proofs: Array<Proof>, amount: number, outputs: Array<BlindedMessage>);
    getSerializedSplit(): {
        proofs: Proof[];
        amount: number;
        outputs: {
            amount: number;
            B_: string;
        }[];
    };
}
export { Split };
