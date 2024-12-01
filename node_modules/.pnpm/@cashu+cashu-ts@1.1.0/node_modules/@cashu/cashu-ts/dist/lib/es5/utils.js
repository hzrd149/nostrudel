"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultAmountPreference = exports.splitAmount = exports.hexToNumber = exports.getEncodedTokenV4 = exports.getEncodedToken = exports.getDecodedToken = exports.bytesToNumber = exports.bigIntStringify = exports.sanitizeUrl = exports.joinUrls = exports.checkResponse = exports.isObj = exports.sortProofsById = exports.deriveKeysetId = void 0;
var base64_js_1 = require("./base64.js");
var Constants_js_1 = require("./utils/Constants.js");
var utils_1 = require("@noble/curves/abstract/utils");
var sha256_1 = require("@noble/hashes/sha256");
var cbor_js_1 = require("./cbor.js");
function splitAmount(value, amountPreference) {
    var chunks = [];
    if (amountPreference) {
        chunks.push.apply(chunks, getPreference(value, amountPreference));
        value =
            value -
                chunks.reduce(function (curr, acc) {
                    return curr + acc;
                }, 0);
    }
    for (var i = 0; i < 32; i++) {
        var mask = 1 << i;
        if ((value & mask) !== 0) {
            chunks.push(Math.pow(2, i));
        }
    }
    return chunks;
}
exports.splitAmount = splitAmount;
function isPowerOfTwo(number) {
    return number && !(number & (number - 1));
}
function getPreference(amount, preferredAmounts) {
    var chunks = [];
    var accumulator = 0;
    preferredAmounts.forEach(function (pa) {
        if (!isPowerOfTwo(pa.amount)) {
            throw new Error('Provided amount preferences contain non-power-of-2 numbers. Use only ^2 numbers');
        }
        for (var i = 1; i <= pa.count; i++) {
            accumulator += pa.amount;
            if (accumulator > amount) {
                return;
            }
            chunks.push(pa.amount);
        }
    });
    return chunks;
}
function getDefaultAmountPreference(amount) {
    var amounts = splitAmount(amount);
    return amounts.map(function (a) {
        return { amount: a, count: 1 };
    });
}
exports.getDefaultAmountPreference = getDefaultAmountPreference;
function bytesToNumber(bytes) {
    return hexToNumber((0, utils_1.bytesToHex)(bytes));
}
exports.bytesToNumber = bytesToNumber;
function hexToNumber(hex) {
    return BigInt("0x".concat(hex));
}
exports.hexToNumber = hexToNumber;
//used for json serialization
function bigIntStringify(_key, value) {
    return typeof value === 'bigint' ? value.toString() : value;
}
exports.bigIntStringify = bigIntStringify;
/**
 * Helper function to encode a v3 cashu token
 * @param token
 * @returns
 */
function getEncodedToken(token) {
    return Constants_js_1.TOKEN_PREFIX + Constants_js_1.TOKEN_VERSION + (0, base64_js_1.encodeJsonToBase64)(token);
}
exports.getEncodedToken = getEncodedToken;
function getEncodedTokenV4(token) {
    var idMap = {};
    var mint = undefined;
    for (var i = 0; i < token.token.length; i++) {
        if (!mint) {
            mint = token.token[i].mint;
        }
        else {
            if (mint !== token.token[i].mint) {
                throw new Error('Multimint token can not be encoded as V4 token');
            }
        }
        for (var j = 0; j < token.token[i].proofs.length; j++) {
            var proof = token.token[i].proofs[j];
            if (idMap[proof.id]) {
                idMap[proof.id].push(proof);
            }
            else {
                idMap[proof.id] = [proof];
            }
        }
    }
    var tokenTemplate = {
        m: mint,
        u: token.unit || 'sat',
        t: Object.keys(idMap).map(function (id) { return ({
            i: (0, utils_1.hexToBytes)(id),
            p: idMap[id].map(function (p) { return ({ a: p.amount, s: p.secret, c: (0, utils_1.hexToBytes)(p.C) }); })
        }); })
    };
    if (token.memo) {
        tokenTemplate.d = token.memo;
    }
    var encodedData = (0, cbor_js_1.encodeCBOR)(tokenTemplate);
    var prefix = 'cashu';
    var version = 'B';
    var base64Data = (0, base64_js_1.encodeUint8toBase64Url)(encodedData);
    return prefix + version + base64Data;
}
exports.getEncodedTokenV4 = getEncodedTokenV4;
/**
 * Helper function to decode cashu tokens into object
 * @param token an encoded cashu token (cashuAey...)
 * @returns cashu token object
 */
function getDecodedToken(token) {
    // remove prefixes
    var uriPrefixes = ['web+cashu://', 'cashu://', 'cashu:', 'cashu'];
    uriPrefixes.forEach(function (prefix) {
        if (!token.startsWith(prefix)) {
            return;
        }
        token = token.slice(prefix.length);
    });
    return handleTokens(token);
}
exports.getDecodedToken = getDecodedToken;
/**
 * @param token
 * @returns
 */
function handleTokens(token) {
    var version = token.slice(0, 1);
    var encodedToken = token.slice(1);
    if (version === 'A') {
        return (0, base64_js_1.encodeBase64ToJson)(encodedToken);
    }
    else if (version === 'B') {
        var uInt8Token = (0, base64_js_1.encodeBase64toUint8)(encodedToken);
        var tokenData = (0, cbor_js_1.decodeCBOR)(uInt8Token);
        var mergedTokenEntry_1 = { mint: tokenData.m, proofs: [] };
        tokenData.t.forEach(function (tokenEntry) {
            return tokenEntry.p.forEach(function (p) {
                mergedTokenEntry_1.proofs.push({
                    secret: p.s,
                    C: (0, utils_1.bytesToHex)(p.c),
                    amount: p.a,
                    id: (0, utils_1.bytesToHex)(tokenEntry.i)
                });
            });
        });
        return { token: [mergedTokenEntry_1], memo: tokenData.d || '', unit: tokenData.u || 'sat' };
    }
    throw new Error('Token version is not supported');
}
/**
 * Returns the keyset id of a set of keys
 * @param keys keys object to derive keyset id from
 * @returns
 */
function deriveKeysetId(keys) {
    var pubkeysConcat = Object.entries(keys)
        .sort(function (a, b) { return +a[0] - +b[0]; })
        .map(function (_a) {
        var pubKey = _a[1];
        return (0, utils_1.hexToBytes)(pubKey);
    })
        .reduce(function (prev, curr) { return mergeUInt8Arrays(prev, curr); }, new Uint8Array());
    var hash = (0, sha256_1.sha256)(pubkeysConcat);
    var hashHex = Buffer.from(hash).toString('hex').slice(0, 14);
    return '00' + hashHex;
}
exports.deriveKeysetId = deriveKeysetId;
function mergeUInt8Arrays(a1, a2) {
    // sum of individual array lengths
    var mergedArray = new Uint8Array(a1.length + a2.length);
    mergedArray.set(a1);
    mergedArray.set(a2, a1.length);
    return mergedArray;
}
function sortProofsById(proofs) {
    return proofs.sort(function (a, b) { return a.id.localeCompare(b.id); });
}
exports.sortProofsById = sortProofsById;
function isObj(v) {
    return typeof v === 'object';
}
exports.isObj = isObj;
function checkResponse(data) {
    if (!isObj(data))
        return;
    if ('error' in data && data.error) {
        throw new Error(data.error);
    }
    if ('detail' in data && data.detail) {
        throw new Error(data.detail);
    }
}
exports.checkResponse = checkResponse;
function joinUrls() {
    var parts = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parts[_i] = arguments[_i];
    }
    return parts.map(function (part) { return part.replace(/(^\/+|\/+$)/g, ''); }).join('/');
}
exports.joinUrls = joinUrls;
function sanitizeUrl(url) {
    return url.replace(/\/$/, '');
}
exports.sanitizeUrl = sanitizeUrl;
