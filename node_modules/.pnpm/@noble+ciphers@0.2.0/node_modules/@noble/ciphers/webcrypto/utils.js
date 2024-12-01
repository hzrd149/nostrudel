"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebcryptoSubtle = exports.randomBytes = void 0;
// We use WebCrypto aka globalThis.crypto, which exists in browsers and node.js 16+.
// node.js versions earlier than v19 don't declare it in global scope.
// For node.js, package.js on#exports field mapping rewrites import
// from `crypto` to `cryptoNode`, which imports native module.
// Makes the utils un-importable in browsers without a bundler.
// Once node.js 18 is deprecated, we can just drop the import.
const crypto_1 = require("@noble/ciphers/webcrypto/crypto");
/**
 * Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
 */
function randomBytes(bytesLength = 32) {
    if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === 'function') {
        return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
    }
    throw new Error('crypto.getRandomValues must be defined');
}
exports.randomBytes = randomBytes;
function getWebcryptoSubtle() {
    if (crypto_1.crypto && typeof crypto_1.crypto.subtle === 'object' && crypto_1.crypto.subtle != null) {
        return crypto_1.crypto.subtle;
    }
    throw new Error('crypto.subtle must be defined');
}
exports.getWebcryptoSubtle = getWebcryptoSubtle;
//# sourceMappingURL=utils.js.map