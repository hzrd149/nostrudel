export * from './payloads';
export * from './responses';
export * from './tokens';
export type AmountPreference = {
    amount: number;
    count: number;
};
/**
 * represents a single Cashu proof.
 */
export type Proof = {
    /**
     * Keyset id, used to link proofs to a mint an its MintKeys.
     */
    id: string;
    /**
     * Amount denominated in Satoshis. Has to match the amount of the mints signing key.
     */
    amount: number;
    /**
     * The initial secret that was (randomly) chosen for the creation of this proof.
     */
    secret: string;
    /**
     * The unblinded signature for this secret, signed by the mints private key.
     */
    C: string;
};
/**
 * response when after receiving a single TokenEntry
 */
export type ReceiveTokenEntryResponse = {
    /**
     * Received proofs
     */
    proofs: Array<Proof>;
};
/**
 * Payload that needs to be sent to the mint when paying a lightning invoice.
 */
export type PaymentPayload = {
    /**
     * Payment request/Lighting invoice that should get paid by the mint.
     */
    pr: string;
    /**
     * Proofs, matching Lightning invoices amount + fees.
     */
    proofs: Array<Proof>;
};
/**
 * @deprecated Token V2
 * should no longer be used
 */
export type TokenV2 = {
    proofs: Array<Proof>;
    mints: Array<{
        url: string;
        ids: Array<string>;
    }>;
};
