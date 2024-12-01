import { SerializedBlindedMessage } from './types/index.js';
import { ProjPointType } from '@noble/curves/abstract/weierstrass';

class BlindedMessage {
	amount: number;
	B_: ProjPointType<bigint>;
	id: string;
	constructor(amount: number, B_: ProjPointType<bigint>, id: string) {
		this.amount = amount;
		this.B_ = B_;
		this.id = id;
	}
	getSerializedBlindedMessage(): SerializedBlindedMessage {
		return { amount: this.amount, B_: this.B_.toHex(true), id: this.id };
	}
}
export { BlindedMessage };
