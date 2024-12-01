import { ProjPointType } from '@noble/curves/abstract/weierstrass';
import { SerializedBlindedSignature } from './types/index.js';

class BlindedSignature {
	id: string;
	amount: number;
	C_: ProjPointType<bigint>;

	constructor(id: string, amount: number, C_: ProjPointType<bigint>) {
		this.id = id;
		this.amount = amount;
		this.C_ = C_;
	}

	getSerializedBlindedSignature(): SerializedBlindedSignature {
		return { id: this.id, amount: this.amount, C_: this.C_.toHex(true) };
	}
}

export { BlindedSignature };
