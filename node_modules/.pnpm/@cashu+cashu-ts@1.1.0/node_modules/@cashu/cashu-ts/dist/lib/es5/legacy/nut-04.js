"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMintQuoteResponseDeprecated = void 0;
var index_js_1 = require("../model/types/index.js");
function handleMintQuoteResponseDeprecated(response) {
    // if the response MeltQuoteResponse has a "paid" flag, we monkey patch it to the state enum
    if (!response.state) {
        console.warn("Field 'state' not found in MintQuoteResponse. Update NUT-04 of mint: https://github.com/cashubtc/nuts/pull/141)");
        if (typeof response.paid === 'boolean') {
            response.state = response.paid ? index_js_1.MintQuoteState.PAID : index_js_1.MintQuoteState.UNPAID;
        }
    }
    return response;
}
exports.handleMintQuoteResponseDeprecated = handleMintQuoteResponseDeprecated;
