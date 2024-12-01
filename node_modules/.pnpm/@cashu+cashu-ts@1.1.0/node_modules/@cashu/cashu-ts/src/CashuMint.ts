import type {
	CheckStatePayload,
	CheckStateResponse,
	GetInfoResponse,
	MeltPayload,
	MintActiveKeys,
	MintAllKeysets,
	PostRestoreResponse,
	MintQuoteResponse,
	SerializedBlindedMessage,
	SwapPayload,
	SwapResponse,
	MintQuotePayload,
	MintPayload,
	MintResponse,
	PostRestorePayload,
	MeltQuotePayload,
	MeltQuoteResponse,
	MintContactInfo
} from './model/types/index.js';
import { MeltQuoteState } from './model/types/index.js';
import request from './request.js';
import { isObj, joinUrls, sanitizeUrl } from './utils.js';
import {
	MeltQuoteResponsePaidDeprecated,
	handleMeltQuoteResponseDeprecated
} from './legacy/nut-05.js';
import {
	MintQuoteResponsePaidDeprecated,
	handleMintQuoteResponseDeprecated
} from './legacy/nut-04.js';
import { handleMintInfoContactFieldDeprecated } from './legacy/nut-06.js';
/**
 * Class represents Cashu Mint API. This class contains Lower level functions that are implemented by CashuWallet.
 */
class CashuMint {
	/**
	 * @param _mintUrl requires mint URL to create this object
	 * @param _customRequest if passed, use custom request implementation for network communication with the mint
	 */
	constructor(private _mintUrl: string, private _customRequest?: typeof request) {
		this._mintUrl = sanitizeUrl(_mintUrl);
		this._customRequest = _customRequest;
	}

	get mintUrl() {
		return this._mintUrl;
	}

	/**
	 * fetches mints info at the /info endpoint
	 * @param mintUrl
	 * @param customRequest
	 */
	public static async getInfo(
		mintUrl: string,
		customRequest?: typeof request
	): Promise<GetInfoResponse> {
		const requestInstance = customRequest || request;
		const response = await requestInstance<GetInfoResponse>({
			endpoint: joinUrls(mintUrl, '/v1/info')
		});
		const data = handleMintInfoContactFieldDeprecated(response);
		return data;
	}
	/**
	 * fetches mints info at the /info endpoint
	 */
	async getInfo(): Promise<GetInfoResponse> {
		return CashuMint.getInfo(this._mintUrl, this._customRequest);
	}

	/**
	 * Performs a swap operation with ecash inputs and outputs.
	 * @param mintUrl
	 * @param swapPayload payload containing inputs and outputs
	 * @param customRequest
	 * @returns signed outputs
	 */
	public static async split(
		mintUrl: string,
		swapPayload: SwapPayload,
		customRequest?: typeof request
	): Promise<SwapResponse> {
		const requestInstance = customRequest || request;
		const data = await requestInstance<SwapResponse>({
			endpoint: joinUrls(mintUrl, '/v1/swap'),
			method: 'POST',
			requestBody: swapPayload
		});

		if (!isObj(data) || !Array.isArray(data?.signatures)) {
			throw new Error(data.detail ?? 'bad response');
		}

		return data;
	}
	/**
	 * Performs a swap operation with ecash inputs and outputs.
	 * @param swapPayload payload containing inputs and outputs
	 * @returns signed outputs
	 */
	async split(swapPayload: SwapPayload): Promise<SwapResponse> {
		return CashuMint.split(this._mintUrl, swapPayload, this._customRequest);
	}

	/**
	 * Requests a new mint quote from the mint.
	 * @param mintUrl
	 * @param mintQuotePayload Payload for creating a new mint quote
	 * @param customRequest
	 * @returns the mint will create and return a new mint quote containing a payment request for the specified amount and unit
	 */
	public static async createMintQuote(
		mintUrl: string,
		mintQuotePayload: MintQuotePayload,
		customRequest?: typeof request
	): Promise<MintQuoteResponse> {
		const requestInstance = customRequest || request;
		const response = await requestInstance<MintQuoteResponse & MintQuoteResponsePaidDeprecated>({
			endpoint: joinUrls(mintUrl, '/v1/mint/quote/bolt11'),
			method: 'POST',
			requestBody: mintQuotePayload
		});
		const data = handleMintQuoteResponseDeprecated(response);
		return data;
	}
	/**
	 * Requests a new mint quote from the mint.
	 * @param mintQuotePayload Payload for creating a new mint quote
	 * @returns the mint will create and return a new mint quote containing a payment request for the specified amount and unit
	 */
	async createMintQuote(mintQuotePayload: MintQuotePayload): Promise<MintQuoteResponse> {
		return CashuMint.createMintQuote(this._mintUrl, mintQuotePayload, this._customRequest);
	}

	/**
	 * Gets an existing mint quote from the mint.
	 * @param mintUrl
	 * @param quote Quote ID
	 * @param customRequest
	 * @returns the mint will create and return a Lightning invoice for the specified amount
	 */
	public static async checkMintQuote(
		mintUrl: string,
		quote: string,
		customRequest?: typeof request
	): Promise<MintQuoteResponse> {
		const requestInstance = customRequest || request;
		const response = await requestInstance<MintQuoteResponse & MintQuoteResponsePaidDeprecated>({
			endpoint: joinUrls(mintUrl, '/v1/mint/quote/bolt11', quote),
			method: 'GET'
		});

		const data = handleMintQuoteResponseDeprecated(response);
		return data;
	}
	/**
	 * Gets an existing mint quote from the mint.
	 * @param quote Quote ID
	 * @returns the mint will create and return a Lightning invoice for the specified amount
	 */
	async checkMintQuote(quote: string): Promise<MintQuoteResponse> {
		return CashuMint.checkMintQuote(this._mintUrl, quote, this._customRequest);
	}

	/**
	 * Mints new tokens by requesting blind signatures on the provided outputs.
	 * @param mintUrl
	 * @param mintPayload Payload containing the outputs to get blind signatures on
	 * @param customRequest
	 * @returns serialized blinded signatures
	 */
	public static async mint(
		mintUrl: string,
		mintPayload: MintPayload,
		customRequest?: typeof request
	) {
		const requestInstance = customRequest || request;
		const data = await requestInstance<MintResponse>({
			endpoint: joinUrls(mintUrl, '/v1/mint/bolt11'),
			method: 'POST',
			requestBody: mintPayload
		});

		if (!isObj(data) || !Array.isArray(data?.signatures)) {
			throw new Error('bad response');
		}

		return data;
	}
	/**
	 * Mints new tokens by requesting blind signatures on the provided outputs.
	 * @param mintPayload Payload containing the outputs to get blind signatures on
	 * @returns serialized blinded signatures
	 */
	async mint(mintPayload: MintPayload) {
		return CashuMint.mint(this._mintUrl, mintPayload, this._customRequest);
	}

	/**
	 * Requests a new melt quote from the mint.
	 * @param mintUrl
	 * @param MeltQuotePayload
	 * @returns
	 */
	public static async createMeltQuote(
		mintUrl: string,
		meltQuotePayload: MeltQuotePayload,
		customRequest?: typeof request
	): Promise<MeltQuoteResponse> {
		const requestInstance = customRequest || request;
		const response = await requestInstance<MeltQuoteResponse & MeltQuoteResponsePaidDeprecated>({
			endpoint: joinUrls(mintUrl, '/v1/melt/quote/bolt11'),
			method: 'POST',
			requestBody: meltQuotePayload
		});

		const data = handleMeltQuoteResponseDeprecated(response);

		if (
			!isObj(data) ||
			typeof data?.amount !== 'number' ||
			typeof data?.fee_reserve !== 'number' ||
			typeof data?.quote !== 'string'
		) {
			throw new Error('bad response');
		}
		return data;
	}
	/**
	 * Requests a new melt quote from the mint.
	 * @param MeltQuotePayload
	 * @returns
	 */
	async createMeltQuote(meltQuotePayload: MeltQuotePayload): Promise<MeltQuoteResponse> {
		return CashuMint.createMeltQuote(this._mintUrl, meltQuotePayload, this._customRequest);
	}

	/**
	 * Gets an existing melt quote.
	 * @param mintUrl
	 * @param quote Quote ID
	 * @returns
	 */
	public static async checkMeltQuote(
		mintUrl: string,
		quote: string,
		customRequest?: typeof request
	): Promise<MeltQuoteResponse> {
		const requestInstance = customRequest || request;
		const response = await requestInstance<MeltQuoteResponse & MeltQuoteResponsePaidDeprecated>({
			endpoint: joinUrls(mintUrl, '/v1/melt/quote/bolt11', quote),
			method: 'GET'
		});

		const data = handleMeltQuoteResponseDeprecated(response);

		if (
			!isObj(data) ||
			typeof data?.amount !== 'number' ||
			typeof data?.fee_reserve !== 'number' ||
			typeof data?.quote !== 'string' ||
			typeof data?.state !== 'string' ||
			!Object.values(MeltQuoteState).includes(data.state)
		) {
			throw new Error('bad response');
		}

		return data;
	}
	/**
	 * Gets an existing melt quote.
	 * @param quote Quote ID
	 * @returns
	 */
	async checkMeltQuote(quote: string): Promise<MeltQuoteResponse> {
		return CashuMint.checkMeltQuote(this._mintUrl, quote, this._customRequest);
	}

	/**
	 * Requests the mint to pay for a Bolt11 payment request by providing ecash as inputs to be spent. The inputs contain the amount and the fee_reserves for a Lightning payment. The payload can also contain blank outputs in order to receive back overpaid Lightning fees.
	 * @param mintUrl
	 * @param meltPayload
	 * @param customRequest
	 * @returns
	 */
	public static async melt(
		mintUrl: string,
		meltPayload: MeltPayload,
		customRequest?: typeof request
	): Promise<MeltQuoteResponse> {
		const requestInstance = customRequest || request;
		const response = await requestInstance<MeltQuoteResponse & MeltQuoteResponsePaidDeprecated>({
			endpoint: joinUrls(mintUrl, '/v1/melt/bolt11'),
			method: 'POST',
			requestBody: meltPayload
		});

		const data = handleMeltQuoteResponseDeprecated(response);

		if (
			!isObj(data) ||
			typeof data?.state !== 'string' ||
			!Object.values(MeltQuoteState).includes(data.state)
		) {
			throw new Error('bad response');
		}

		return data;
	}
	/**
	 * Ask mint to perform a melt operation. This pays a lightning invoice and destroys tokens matching its amount + fees
	 * @param meltPayload
	 * @returns
	 */
	async melt(meltPayload: MeltPayload): Promise<MeltQuoteResponse> {
		return CashuMint.melt(this._mintUrl, meltPayload, this._customRequest);
	}
	/**
	 * Checks if specific proofs have already been redeemed
	 * @param mintUrl
	 * @param checkPayload
	 * @param customRequest
	 * @returns redeemed and unredeemed ordered list of booleans
	 */
	public static async check(
		mintUrl: string,
		checkPayload: CheckStatePayload,
		customRequest?: typeof request
	): Promise<CheckStateResponse> {
		const requestInstance = customRequest || request;
		const data = await requestInstance<CheckStateResponse>({
			endpoint: joinUrls(mintUrl, '/v1/checkstate'),
			method: 'POST',
			requestBody: checkPayload
		});

		if (!isObj(data) || !Array.isArray(data?.states)) {
			throw new Error('bad response');
		}

		return data;
	}

	/**
	 * Get the mints public keys
	 * @param mintUrl
	 * @param keysetId optional param to get the keys for a specific keyset. If not specified, the keys from all active keysets are fetched
	 * @param customRequest
	 * @returns
	 */
	public static async getKeys(
		mintUrl: string,
		keysetId?: string,
		customRequest?: typeof request
	): Promise<MintActiveKeys> {
		// backwards compatibility for base64 encoded keyset ids
		if (keysetId) {
			// make the keysetId url safe
			keysetId = keysetId.replace(/\//g, '_').replace(/\+/g, '-');
		}
		const requestInstance = customRequest || request;
		const data = await requestInstance<MintActiveKeys>({
			endpoint: keysetId ? joinUrls(mintUrl, '/v1/keys', keysetId) : joinUrls(mintUrl, '/v1/keys')
		});

		if (!isObj(data) || !Array.isArray(data.keysets)) {
			throw new Error('bad response');
		}

		return data;
	}
	/**
	 * Get the mints public keys
	 * @param keysetId optional param to get the keys for a specific keyset. If not specified, the keys from all active keysets are fetched
	 * @returns the mints public keys
	 */
	async getKeys(keysetId?: string, mintUrl?: string): Promise<MintActiveKeys> {
		const allKeys = await CashuMint.getKeys(
			mintUrl || this._mintUrl,
			keysetId,
			this._customRequest
		);
		return allKeys;
	}
	/**
	 * Get the mints keysets in no specific order
	 * @param mintUrl
	 * @param customRequest
	 * @returns all the mints past and current keysets.
	 */
	public static async getKeySets(
		mintUrl: string,
		customRequest?: typeof request
	): Promise<MintAllKeysets> {
		const requestInstance = customRequest || request;
		return requestInstance<MintAllKeysets>({ endpoint: joinUrls(mintUrl, '/v1/keysets') });
	}

	/**
	 * Get the mints keysets in no specific order
	 * @returns all the mints past and current keysets.
	 */
	async getKeySets(): Promise<MintAllKeysets> {
		return CashuMint.getKeySets(this._mintUrl, this._customRequest);
	}

	/**
	 * Checks if specific proofs have already been redeemed
	 * @param checkPayload
	 * @returns redeemed and unredeemed ordered list of booleans
	 */
	async check(checkPayload: CheckStatePayload): Promise<CheckStateResponse> {
		return CashuMint.check(this._mintUrl, checkPayload, this._customRequest);
	}

	public static async restore(
		mintUrl: string,
		restorePayload: PostRestorePayload,
		customRequest?: typeof request
	): Promise<PostRestoreResponse> {
		const requestInstance = customRequest || request;
		const data = await requestInstance<PostRestoreResponse>({
			endpoint: joinUrls(mintUrl, '/v1/restore'),
			method: 'POST',
			requestBody: restorePayload
		});

		if (!isObj(data) || !Array.isArray(data?.outputs) || !Array.isArray(data?.promises)) {
			throw new Error('bad response');
		}

		return data;
	}

	async restore(restorePayload: {
		outputs: Array<SerializedBlindedMessage>;
	}): Promise<PostRestoreResponse> {
		return CashuMint.restore(this._mintUrl, restorePayload, this._customRequest);
	}
}

export { CashuMint };
