import { MintQuoteState } from '../model/types/index.js';
export function handleMintQuoteResponseDeprecated(response) {
    // if the response MeltQuoteResponse has a "paid" flag, we monkey patch it to the state enum
    if (!response.state) {
        console.warn("Field 'state' not found in MintQuoteResponse. Update NUT-04 of mint: https://github.com/cashubtc/nuts/pull/141)");
        if (typeof response.paid === 'boolean') {
            response.state = response.paid ? MintQuoteState.PAID : MintQuoteState.UNPAID;
        }
    }
    return response;
}
//# sourceMappingURL=nut-04.js.map