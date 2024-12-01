import type { CheckStatePayload, CheckStateResponse, GetInfoResponse, MeltPayload, MintActiveKeys, MintAllKeysets, PostRestoreResponse, MintQuoteResponse, SerializedBlindedMessage, SwapPayload, SwapResponse, MintQuotePayload, MintPayload, MintResponse, PostRestorePayload, MeltQuotePayload, MeltQuoteResponse } from './model/types/index.js';
import request from './request.js';
/**
 * Class represents Cashu Mint API. This class contains Lower level functions that are implemented by CashuWallet.
 */
declare class CashuMint {
    private _mintUrl;
    private _customRequest?;
    /**
     * @param _mintUrl requires mint URL to create this object
     * @param _customRequest if passed, use custom request implementation for network communication with the mint
     */
    constructor(_mintUrl: string, _customRequest?: typeof request | undefined);
    get mintUrl(): string;
    /**
     * fetches mints info at the /info endpoint
     * @param mintUrl
     * @param customRequest
     */
    static getInfo(mintUrl: string, customRequest?: typeof request): Promise<GetInfoResponse>;
    /**
     * fetches mints info at the /info endpoint
     */
    getInfo(): Promise<GetInfoResponse>;
    /**
     * Performs a swap operation with ecash inputs and outputs.
     * @param mintUrl
     * @param swapPayload payload containing inputs and outputs
     * @param customRequest
     * @returns signed outputs
     */
    static split(mintUrl: string, swapPayload: SwapPayload, customRequest?: typeof request): Promise<SwapResponse>;
    /**
     * Performs a swap operation with ecash inputs and outputs.
     * @param swapPayload payload containing inputs and outputs
     * @returns signed outputs
     */
    split(swapPayload: SwapPayload): Promise<SwapResponse>;
    /**
     * Requests a new mint quote from the mint.
     * @param mintUrl
     * @param mintQuotePayload Payload for creating a new mint quote
     * @param customRequest
     * @returns the mint will create and return a new mint quote containing a payment request for the specified amount and unit
     */
    static createMintQuote(mintUrl: string, mintQuotePayload: MintQuotePayload, customRequest?: typeof request): Promise<MintQuoteResponse>;
    /**
     * Requests a new mint quote from the mint.
     * @param mintQuotePayload Payload for creating a new mint quote
     * @returns the mint will create and return a new mint quote containing a payment request for the specified amount and unit
     */
    createMintQuote(mintQuotePayload: MintQuotePayload): Promise<MintQuoteResponse>;
    /**
     * Gets an existing mint quote from the mint.
     * @param mintUrl
     * @param quote Quote ID
     * @param customRequest
     * @returns the mint will create and return a Lightning invoice for the specified amount
     */
    static checkMintQuote(mintUrl: string, quote: string, customRequest?: typeof request): Promise<MintQuoteResponse>;
    /**
     * Gets an existing mint quote from the mint.
     * @param quote Quote ID
     * @returns the mint will create and return a Lightning invoice for the specified amount
     */
    checkMintQuote(quote: string): Promise<MintQuoteResponse>;
    /**
     * Mints new tokens by requesting blind signatures on the provided outputs.
     * @param mintUrl
     * @param mintPayload Payload containing the outputs to get blind signatures on
     * @param customRequest
     * @returns serialized blinded signatures
     */
    static mint(mintUrl: string, mintPayload: MintPayload, customRequest?: typeof request): Promise<MintResponse>;
    /**
     * Mints new tokens by requesting blind signatures on the provided outputs.
     * @param mintPayload Payload containing the outputs to get blind signatures on
     * @returns serialized blinded signatures
     */
    mint(mintPayload: MintPayload): Promise<MintResponse>;
    /**
     * Requests a new melt quote from the mint.
     * @param mintUrl
     * @param MeltQuotePayload
     * @returns
     */
    static createMeltQuote(mintUrl: string, meltQuotePayload: MeltQuotePayload, customRequest?: typeof request): Promise<MeltQuoteResponse>;
    /**
     * Requests a new melt quote from the mint.
     * @param MeltQuotePayload
     * @returns
     */
    createMeltQuote(meltQuotePayload: MeltQuotePayload): Promise<MeltQuoteResponse>;
    /**
     * Gets an existing melt quote.
     * @param mintUrl
     * @param quote Quote ID
     * @returns
     */
    static checkMeltQuote(mintUrl: string, quote: string, customRequest?: typeof request): Promise<MeltQuoteResponse>;
    /**
     * Gets an existing melt quote.
     * @param quote Quote ID
     * @returns
     */
    checkMeltQuote(quote: string): Promise<MeltQuoteResponse>;
    /**
     * Requests the mint to pay for a Bolt11 payment request by providing ecash as inputs to be spent. The inputs contain the amount and the fee_reserves for a Lightning payment. The payload can also contain blank outputs in order to receive back overpaid Lightning fees.
     * @param mintUrl
     * @param meltPayload
     * @param customRequest
     * @returns
     */
    static melt(mintUrl: string, meltPayload: MeltPayload, customRequest?: typeof request): Promise<MeltQuoteResponse>;
    /**
     * Ask mint to perform a melt operation. This pays a lightning invoice and destroys tokens matching its amount + fees
     * @param meltPayload
     * @returns
     */
    melt(meltPayload: MeltPayload): Promise<MeltQuoteResponse>;
    /**
     * Checks if specific proofs have already been redeemed
     * @param mintUrl
     * @param checkPayload
     * @param customRequest
     * @returns redeemed and unredeemed ordered list of booleans
     */
    static check(mintUrl: string, checkPayload: CheckStatePayload, customRequest?: typeof request): Promise<CheckStateResponse>;
    /**
     * Get the mints public keys
     * @param mintUrl
     * @param keysetId optional param to get the keys for a specific keyset. If not specified, the keys from all active keysets are fetched
     * @param customRequest
     * @returns
     */
    static getKeys(mintUrl: string, keysetId?: string, customRequest?: typeof request): Promise<MintActiveKeys>;
    /**
     * Get the mints public keys
     * @param keysetId optional param to get the keys for a specific keyset. If not specified, the keys from all active keysets are fetched
     * @returns the mints public keys
     */
    getKeys(keysetId?: string, mintUrl?: string): Promise<MintActiveKeys>;
    /**
     * Get the mints keysets in no specific order
     * @param mintUrl
     * @param customRequest
     * @returns all the mints past and current keysets.
     */
    static getKeySets(mintUrl: string, customRequest?: typeof request): Promise<MintAllKeysets>;
    /**
     * Get the mints keysets in no specific order
     * @returns all the mints past and current keysets.
     */
    getKeySets(): Promise<MintAllKeysets>;
    /**
     * Checks if specific proofs have already been redeemed
     * @param checkPayload
     * @returns redeemed and unredeemed ordered list of booleans
     */
    check(checkPayload: CheckStatePayload): Promise<CheckStateResponse>;
    static restore(mintUrl: string, restorePayload: PostRestorePayload, customRequest?: typeof request): Promise<PostRestoreResponse>;
    restore(restorePayload: {
        outputs: Array<SerializedBlindedMessage>;
    }): Promise<PostRestoreResponse>;
}
export { CashuMint };
