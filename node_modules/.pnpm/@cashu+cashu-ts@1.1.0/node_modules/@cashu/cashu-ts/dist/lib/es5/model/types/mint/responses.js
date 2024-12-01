"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MintQuoteState = exports.MeltQuoteState = exports.CheckStateEnum = void 0;
/**
 * Enum for the state of a proof
 */
var CheckStateEnum;
(function (CheckStateEnum) {
    CheckStateEnum["UNSPENT"] = "UNSPENT";
    CheckStateEnum["PENDING"] = "PENDING";
    CheckStateEnum["SPENT"] = "SPENT";
})(CheckStateEnum = exports.CheckStateEnum || (exports.CheckStateEnum = {}));
var MeltQuoteState;
(function (MeltQuoteState) {
    MeltQuoteState["UNPAID"] = "UNPAID";
    MeltQuoteState["PENDING"] = "PENDING";
    MeltQuoteState["PAID"] = "PAID";
})(MeltQuoteState = exports.MeltQuoteState || (exports.MeltQuoteState = {}));
var MintQuoteState;
(function (MintQuoteState) {
    MintQuoteState["UNPAID"] = "UNPAID";
    MintQuoteState["PAID"] = "PAID";
    MintQuoteState["ISSUED"] = "ISSUED";
})(MintQuoteState = exports.MintQuoteState || (exports.MintQuoteState = {}));
