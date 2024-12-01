import { Proof, Token } from './index';

/**
 * Response after paying a Lightning invoice
 */
export type MeltTokensResponse = {
	/**
	 * if false, the proofs have not been invalidated and the payment can be tried later again with the same proofs
	 */
	isPaid: boolean;
	/**
	 * preimage of the paid invoice. can be null, depending on which LN-backend the mint uses
	 */
	preimage: string | null;
	/**
	 * Return/Change from overpaid fees. This happens due to Lighting fee estimation being inaccurate
	 */
	change: Array<Proof>;
};

/**
 * Response when receiving a complete token.
 */
export type ReceiveResponse = {
	/**
	 * Successfully received Cashu Token
	 */
	token: Token;
	/**
	 * TokenEntries that had errors. No error will be thrown, but clients can choose to handle tokens with errors accordingly.
	 */
	tokensWithErrors: Token | undefined;
};

/**
 *  response after sending
 */
export type SendResponse = {
	/**
	 * Proofs that exceeded the needed amount
	 */
	returnChange: Array<Proof>;
	/**
	 * Proofs to be sent, matching the chosen amount
	 */
	send: Array<Proof>;
};
