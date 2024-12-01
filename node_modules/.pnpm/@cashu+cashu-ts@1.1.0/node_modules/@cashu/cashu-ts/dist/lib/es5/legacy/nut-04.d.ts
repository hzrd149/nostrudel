import type { MintQuoteResponse } from '../model/types/index.js';
export type MintQuoteResponsePaidDeprecated = {
    paid?: boolean;
};
export declare function handleMintQuoteResponseDeprecated(response: MintQuoteResponse & MintQuoteResponsePaidDeprecated): MintQuoteResponse;
