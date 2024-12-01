"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyProof = exports.createNewMintKeys = exports.getPubKeyFromPrivKey = exports.createBlindSignature = void 0;
const secp256k1_1 = require("@noble/curves/secp256k1");
const utils_js_1 = require("../util/utils.js");
const index_js_1 = require("../common/index.js");
const bip32_1 = require("@scure/bip32");
const DERIVATION_PATH = "m/0'/0'/0'";
function createBlindSignature(B_, privateKey, amount, id) {
    const C_ = B_.multiply((0, utils_js_1.bytesToNumber)(privateKey));
    return { C_, amount, id };
}
exports.createBlindSignature = createBlindSignature;
function getPubKeyFromPrivKey(privKey) {
    return secp256k1_1.secp256k1.getPublicKey(privKey, true);
}
exports.getPubKeyFromPrivKey = getPubKeyFromPrivKey;
function createNewMintKeys(pow2height, seed) {
    let counter = 0n;
    const pubKeys = {};
    const privKeys = {};
    let masterKey;
    if (seed) {
        masterKey = bip32_1.HDKey.fromMasterSeed(seed);
    }
    while (counter < pow2height) {
        const index = (2n ** counter).toString();
        if (masterKey) {
            const k = masterKey.derive(`${DERIVATION_PATH}/${counter}`).privateKey;
            if (k) {
                privKeys[index] = k;
            }
            else {
                throw new Error(`Could not derive Private key from: ${DERIVATION_PATH}/${counter}`);
            }
        }
        else {
            privKeys[index] = (0, index_js_1.createRandomPrivateKey)();
        }
        pubKeys[index] = getPubKeyFromPrivKey(privKeys[index]);
        counter++;
    }
    const keysetId = (0, index_js_1.deriveKeysetId)(pubKeys);
    return { pubKeys, privKeys, keysetId };
}
exports.createNewMintKeys = createNewMintKeys;
function verifyProof(proof, privKey) {
    const Y = (0, index_js_1.hashToCurve)(proof.secret);
    const aY = Y.multiply((0, utils_js_1.bytesToNumber)(privKey));
    return aY.equals(proof.C);
}
exports.verifyProof = verifyProof;
//# sourceMappingURL=index.js.map