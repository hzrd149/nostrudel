var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { MeltQuoteState } from './model/types/index.js';
import request from './request.js';
import { isObj, joinUrls, sanitizeUrl } from './utils.js';
import { handleMeltQuoteResponseDeprecated } from './legacy/nut-05.js';
import { handleMintQuoteResponseDeprecated } from './legacy/nut-04.js';
import { handleMintInfoContactFieldDeprecated } from './legacy/nut-06.js';
/**
 * Class represents Cashu Mint API. This class contains Lower level functions that are implemented by CashuWallet.
 */
var CashuMint = /** @class */ (function () {
    /**
     * @param _mintUrl requires mint URL to create this object
     * @param _customRequest if passed, use custom request implementation for network communication with the mint
     */
    function CashuMint(_mintUrl, _customRequest) {
        this._mintUrl = _mintUrl;
        this._customRequest = _customRequest;
        this._mintUrl = sanitizeUrl(_mintUrl);
        this._customRequest = _customRequest;
    }
    Object.defineProperty(CashuMint.prototype, "mintUrl", {
        get: function () {
            return this._mintUrl;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * fetches mints info at the /info endpoint
     * @param mintUrl
     * @param customRequest
     */
    CashuMint.getInfo = function (mintUrl, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/info')
                            })];
                    case 1:
                        response = _a.sent();
                        data = handleMintInfoContactFieldDeprecated(response);
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * fetches mints info at the /info endpoint
     */
    CashuMint.prototype.getInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.getInfo(this._mintUrl, this._customRequest)];
            });
        });
    };
    /**
     * Performs a swap operation with ecash inputs and outputs.
     * @param mintUrl
     * @param swapPayload payload containing inputs and outputs
     * @param customRequest
     * @returns signed outputs
     */
    CashuMint.split = function (mintUrl, swapPayload, customRequest) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/swap'),
                                method: 'POST',
                                requestBody: swapPayload
                            })];
                    case 1:
                        data = _b.sent();
                        if (!isObj(data) || !Array.isArray(data === null || data === void 0 ? void 0 : data.signatures)) {
                            throw new Error((_a = data.detail) !== null && _a !== void 0 ? _a : 'bad response');
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Performs a swap operation with ecash inputs and outputs.
     * @param swapPayload payload containing inputs and outputs
     * @returns signed outputs
     */
    CashuMint.prototype.split = function (swapPayload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.split(this._mintUrl, swapPayload, this._customRequest)];
            });
        });
    };
    /**
     * Requests a new mint quote from the mint.
     * @param mintUrl
     * @param mintQuotePayload Payload for creating a new mint quote
     * @param customRequest
     * @returns the mint will create and return a new mint quote containing a payment request for the specified amount and unit
     */
    CashuMint.createMintQuote = function (mintUrl, mintQuotePayload, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/mint/quote/bolt11'),
                                method: 'POST',
                                requestBody: mintQuotePayload
                            })];
                    case 1:
                        response = _a.sent();
                        data = handleMintQuoteResponseDeprecated(response);
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Requests a new mint quote from the mint.
     * @param mintQuotePayload Payload for creating a new mint quote
     * @returns the mint will create and return a new mint quote containing a payment request for the specified amount and unit
     */
    CashuMint.prototype.createMintQuote = function (mintQuotePayload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.createMintQuote(this._mintUrl, mintQuotePayload, this._customRequest)];
            });
        });
    };
    /**
     * Gets an existing mint quote from the mint.
     * @param mintUrl
     * @param quote Quote ID
     * @param customRequest
     * @returns the mint will create and return a Lightning invoice for the specified amount
     */
    CashuMint.checkMintQuote = function (mintUrl, quote, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/mint/quote/bolt11', quote),
                                method: 'GET'
                            })];
                    case 1:
                        response = _a.sent();
                        data = handleMintQuoteResponseDeprecated(response);
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Gets an existing mint quote from the mint.
     * @param quote Quote ID
     * @returns the mint will create and return a Lightning invoice for the specified amount
     */
    CashuMint.prototype.checkMintQuote = function (quote) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.checkMintQuote(this._mintUrl, quote, this._customRequest)];
            });
        });
    };
    /**
     * Mints new tokens by requesting blind signatures on the provided outputs.
     * @param mintUrl
     * @param mintPayload Payload containing the outputs to get blind signatures on
     * @param customRequest
     * @returns serialized blinded signatures
     */
    CashuMint.mint = function (mintUrl, mintPayload, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/mint/bolt11'),
                                method: 'POST',
                                requestBody: mintPayload
                            })];
                    case 1:
                        data = _a.sent();
                        if (!isObj(data) || !Array.isArray(data === null || data === void 0 ? void 0 : data.signatures)) {
                            throw new Error('bad response');
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Mints new tokens by requesting blind signatures on the provided outputs.
     * @param mintPayload Payload containing the outputs to get blind signatures on
     * @returns serialized blinded signatures
     */
    CashuMint.prototype.mint = function (mintPayload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.mint(this._mintUrl, mintPayload, this._customRequest)];
            });
        });
    };
    /**
     * Requests a new melt quote from the mint.
     * @param mintUrl
     * @param MeltQuotePayload
     * @returns
     */
    CashuMint.createMeltQuote = function (mintUrl, meltQuotePayload, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/melt/quote/bolt11'),
                                method: 'POST',
                                requestBody: meltQuotePayload
                            })];
                    case 1:
                        response = _a.sent();
                        data = handleMeltQuoteResponseDeprecated(response);
                        if (!isObj(data) ||
                            typeof (data === null || data === void 0 ? void 0 : data.amount) !== 'number' ||
                            typeof (data === null || data === void 0 ? void 0 : data.fee_reserve) !== 'number' ||
                            typeof (data === null || data === void 0 ? void 0 : data.quote) !== 'string') {
                            throw new Error('bad response');
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Requests a new melt quote from the mint.
     * @param MeltQuotePayload
     * @returns
     */
    CashuMint.prototype.createMeltQuote = function (meltQuotePayload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.createMeltQuote(this._mintUrl, meltQuotePayload, this._customRequest)];
            });
        });
    };
    /**
     * Gets an existing melt quote.
     * @param mintUrl
     * @param quote Quote ID
     * @returns
     */
    CashuMint.checkMeltQuote = function (mintUrl, quote, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/melt/quote/bolt11', quote),
                                method: 'GET'
                            })];
                    case 1:
                        response = _a.sent();
                        data = handleMeltQuoteResponseDeprecated(response);
                        if (!isObj(data) ||
                            typeof (data === null || data === void 0 ? void 0 : data.amount) !== 'number' ||
                            typeof (data === null || data === void 0 ? void 0 : data.fee_reserve) !== 'number' ||
                            typeof (data === null || data === void 0 ? void 0 : data.quote) !== 'string' ||
                            typeof (data === null || data === void 0 ? void 0 : data.state) !== 'string' ||
                            !Object.values(MeltQuoteState).includes(data.state)) {
                            throw new Error('bad response');
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Gets an existing melt quote.
     * @param quote Quote ID
     * @returns
     */
    CashuMint.prototype.checkMeltQuote = function (quote) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.checkMeltQuote(this._mintUrl, quote, this._customRequest)];
            });
        });
    };
    /**
     * Requests the mint to pay for a Bolt11 payment request by providing ecash as inputs to be spent. The inputs contain the amount and the fee_reserves for a Lightning payment. The payload can also contain blank outputs in order to receive back overpaid Lightning fees.
     * @param mintUrl
     * @param meltPayload
     * @param customRequest
     * @returns
     */
    CashuMint.melt = function (mintUrl, meltPayload, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/melt/bolt11'),
                                method: 'POST',
                                requestBody: meltPayload
                            })];
                    case 1:
                        response = _a.sent();
                        data = handleMeltQuoteResponseDeprecated(response);
                        if (!isObj(data) ||
                            typeof (data === null || data === void 0 ? void 0 : data.state) !== 'string' ||
                            !Object.values(MeltQuoteState).includes(data.state)) {
                            throw new Error('bad response');
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Ask mint to perform a melt operation. This pays a lightning invoice and destroys tokens matching its amount + fees
     * @param meltPayload
     * @returns
     */
    CashuMint.prototype.melt = function (meltPayload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.melt(this._mintUrl, meltPayload, this._customRequest)];
            });
        });
    };
    /**
     * Checks if specific proofs have already been redeemed
     * @param mintUrl
     * @param checkPayload
     * @param customRequest
     * @returns redeemed and unredeemed ordered list of booleans
     */
    CashuMint.check = function (mintUrl, checkPayload, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/checkstate'),
                                method: 'POST',
                                requestBody: checkPayload
                            })];
                    case 1:
                        data = _a.sent();
                        if (!isObj(data) || !Array.isArray(data === null || data === void 0 ? void 0 : data.states)) {
                            throw new Error('bad response');
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Get the mints public keys
     * @param mintUrl
     * @param keysetId optional param to get the keys for a specific keyset. If not specified, the keys from all active keysets are fetched
     * @param customRequest
     * @returns
     */
    CashuMint.getKeys = function (mintUrl, keysetId, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // backwards compatibility for base64 encoded keyset ids
                        if (keysetId) {
                            // make the keysetId url safe
                            keysetId = keysetId.replace(/\//g, '_').replace(/\+/g, '-');
                        }
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: keysetId ? joinUrls(mintUrl, '/v1/keys', keysetId) : joinUrls(mintUrl, '/v1/keys')
                            })];
                    case 1:
                        data = _a.sent();
                        if (!isObj(data) || !Array.isArray(data.keysets)) {
                            throw new Error('bad response');
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Get the mints public keys
     * @param keysetId optional param to get the keys for a specific keyset. If not specified, the keys from all active keysets are fetched
     * @returns the mints public keys
     */
    CashuMint.prototype.getKeys = function (keysetId, mintUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var allKeys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, CashuMint.getKeys(mintUrl || this._mintUrl, keysetId, this._customRequest)];
                    case 1:
                        allKeys = _a.sent();
                        return [2 /*return*/, allKeys];
                }
            });
        });
    };
    /**
     * Get the mints keysets in no specific order
     * @param mintUrl
     * @param customRequest
     * @returns all the mints past and current keysets.
     */
    CashuMint.getKeySets = function (mintUrl, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance;
            return __generator(this, function (_a) {
                requestInstance = customRequest || request;
                return [2 /*return*/, requestInstance({ endpoint: joinUrls(mintUrl, '/v1/keysets') })];
            });
        });
    };
    /**
     * Get the mints keysets in no specific order
     * @returns all the mints past and current keysets.
     */
    CashuMint.prototype.getKeySets = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.getKeySets(this._mintUrl, this._customRequest)];
            });
        });
    };
    /**
     * Checks if specific proofs have already been redeemed
     * @param checkPayload
     * @returns redeemed and unredeemed ordered list of booleans
     */
    CashuMint.prototype.check = function (checkPayload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.check(this._mintUrl, checkPayload, this._customRequest)];
            });
        });
    };
    CashuMint.restore = function (mintUrl, restorePayload, customRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var requestInstance, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestInstance = customRequest || request;
                        return [4 /*yield*/, requestInstance({
                                endpoint: joinUrls(mintUrl, '/v1/restore'),
                                method: 'POST',
                                requestBody: restorePayload
                            })];
                    case 1:
                        data = _a.sent();
                        if (!isObj(data) || !Array.isArray(data === null || data === void 0 ? void 0 : data.outputs) || !Array.isArray(data === null || data === void 0 ? void 0 : data.promises)) {
                            throw new Error('bad response');
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    CashuMint.prototype.restore = function (restorePayload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, CashuMint.restore(this._mintUrl, restorePayload, this._customRequest)];
            });
        });
    };
    return CashuMint;
}());
export { CashuMint };
//# sourceMappingURL=CashuMint.js.map