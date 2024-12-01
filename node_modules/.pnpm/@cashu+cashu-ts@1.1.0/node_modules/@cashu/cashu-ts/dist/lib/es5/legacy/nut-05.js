"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMeltQuoteResponseDeprecated = void 0;
var index_js_1 = require("../model/types/index.js");
function handleMeltQuoteResponseDeprecated(response) {
    // if the response MeltQuoteResponse has a "paid" flag, we monkey patch it to the state enum
    if (!response.state) {
        console.warn("Field 'state' not found in MeltQuoteResponse. Update NUT-05 of mint: https://github.com/cashubtc/nuts/pull/136)");
        if (typeof response.paid === 'boolean') {
            response.state = response.paid ? index_js_1.MeltQuoteState.PAID : index_js_1.MeltQuoteState.UNPAID;
        }
    }
    return response;
}
exports.handleMeltQuoteResponseDeprecated = handleMeltQuoteResponseDeprecated;
