import type { MeltQuoteResponse } from '../model/types/index.js';
import { MeltQuoteState } from '../model/types/index.js';

export type MeltQuoteResponsePaidDeprecated = {
	paid?: boolean;
};

export function handleMeltQuoteResponseDeprecated(
	response: MeltQuoteResponse & MeltQuoteResponsePaidDeprecated
): MeltQuoteResponse {
	// if the response MeltQuoteResponse has a "paid" flag, we monkey patch it to the state enum
	if (!response.state) {
		console.warn(
			"Field 'state' not found in MeltQuoteResponse. Update NUT-05 of mint: https://github.com/cashubtc/nuts/pull/136)"
		);
		if (typeof response.paid === 'boolean') {
			response.state = response.paid ? MeltQuoteState.PAID : MeltQuoteState.UNPAID;
		}
	}
	return response;
}
