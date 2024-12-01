import { SerializedBlindedMessage } from '../wallet';
/**
 * Cashu api error
 */
export type ApiError = {
    /**
     * Error message
     */
    error?: string;
    /**
     * HTTP error code
     */
    code?: number;
    /**
     * Detailed error message
     */
    detail?: string;
};
/**
 * Entries of CheckStateResponse with state of the proof
 */
export type CheckStateEntry = {
    Y: string;
    state: CheckStateEnum;
    witness: string | null;
};
/**
 * Enum for the state of a proof
 */
export declare enum CheckStateEnum {
    UNSPENT = "UNSPENT",
    PENDING = "PENDING",
    SPENT = "SPENT"
}
/**
 * Response when checking proofs if they are spendable. Should not rely on this for receiving, since it can be easily cheated.
 */
export type CheckStateResponse = {
    /**
     *
     */
    states: Array<CheckStateEntry>;
} & ApiError;
/**
 * Response from mint at /info endpoint
 */
export type GetInfoResponse = {
    name: string;
    pubkey: string;
    version: string;
    description?: string;
    description_long?: string;
    contact: Array<MintContactInfo>;
    nuts: {
        '4': {
            methods: Array<SwapMethod>;
            disabled: boolean;
        };
        '5': {
            methods: Array<SwapMethod>;
            disabled: boolean;
        };
        '7'?: {
            supported: boolean;
        };
        '8'?: {
            supported: boolean;
        };
        '9'?: {
            supported: boolean;
        };
        '10'?: {
            supported: boolean;
        };
        '11'?: {
            supported: boolean;
        };
        '12'?: {
            supported: boolean;
        };
        '13'?: {
            supported: boolean;
        };
    };
    motd?: string;
};
/**
 * Response from the mint after requesting a melt quote
 */
export type MeltQuoteResponse = {
    /**
     * Quote ID
     */
    quote: string;
    /**
     * Amount to be melted
     */
    amount: number;
    /**
     * Fee reserve to be added to the amount
     */
    fee_reserve: number;
    /**
     * State of the melt quote
     */
    state: MeltQuoteState;
    /**
     * Timestamp of when the quote expires
     */
    expiry: number;
    /**
     * preimage of the paid invoice. is null if it the invoice has not been paid yet. can be null, depending on which LN-backend the mint uses
     */
    payment_preimage: string | null;
    /**
     * Return/Change from overpaid fees. This happens due to Lighting fee estimation being inaccurate
     */
    change?: Array<SerializedBlindedSignature>;
} & ApiError;
export declare enum MeltQuoteState {
    UNPAID = "UNPAID",
    PENDING = "PENDING",
    PAID = "PAID"
}
export type MintContactInfo = {
    method: string;
    info: string;
};
export declare enum MintQuoteState {
    UNPAID = "UNPAID",
    PAID = "PAID",
    ISSUED = "ISSUED"
}
/**
 * Response from the mint after requesting a mint
 */
export type MintQuoteResponse = {
    /**
     * Payment request
     */
    request: string;
    /**
     * Quote ID
     */
    quote: string;
    /**
     * State of the mint quote
     */
    state: MintQuoteState;
    /**
     * Timestamp of when the quote expires
     */
    expiry: number;
} & ApiError;
/**
 * Response from the mint after requesting a mint
 */
export type MintResponse = {
    signatures: Array<SerializedBlindedSignature>;
} & ApiError;
/**
 * Response from mint at /v1/restore endpoint
 */
export type PostRestoreResponse = {
    outputs: Array<SerializedBlindedMessage>;
    promises: Array<SerializedBlindedSignature>;
};
/**
 * Blinded signature as it is received from the mint
 */
export type SerializedBlindedSignature = {
    /**
     * keyset id for indicating which public key was used to sign the blinded message
     */
    id: string;
    /**
     * Amount denominated in Satoshi
     */
    amount: number;
    /**
     * Blinded signature
     */
    C_: string;
};
/**
 * Ecash to other MoE swap method, displayed in @type {GetInfoResponse}
 */
export type SwapMethod = {
    method: string;
    unit: string;
    min_amount: number;
    max_amount: number;
};
/**
 * Response from the mint after performing a split action
 */
export type SwapResponse = {
    /**
     * represents the outputs after the split
     */
    signatures: Array<SerializedBlindedSignature>;
} & ApiError;
