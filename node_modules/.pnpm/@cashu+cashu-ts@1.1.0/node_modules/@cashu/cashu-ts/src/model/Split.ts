import { BlindedMessage } from './BlindedMessage.js';
import { Proof } from './types/index.js';

class Split {
	proofs: Array<Proof>;
	amount: number;
	outputs: Array<BlindedMessage>;
	constructor(proofs: Array<Proof>, amount: number, outputs: Array<BlindedMessage>) {
		this.proofs = proofs;
		this.amount = amount;
		this.outputs = outputs;
	}
	getSerializedSplit() {
		return {
			proofs: this.proofs,
			amount: this.amount,
			outputs: this.outputs.map((blindedMessage: BlindedMessage) => {
				return { amount: blindedMessage.amount, B_: blindedMessage.B_.toHex(true) };
			})
		};
	}
}

export { Split };
