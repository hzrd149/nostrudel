import type { MeltQuoteResponse } from '../model/types/index.js';
export type MeltQuoteResponsePaidDeprecated = {
    paid?: boolean;
};
export declare function handleMeltQuoteResponseDeprecated(response: MeltQuoteResponse & MeltQuoteResponsePaidDeprecated): MeltQuoteResponse;
