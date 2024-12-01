"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeBase64toUint8 = exports.hexToNumber = exports.bytesToNumber = void 0;
const utils_1 = require("@noble/curves/abstract/utils");
const buffer_1 = require("buffer/");
function bytesToNumber(bytes) {
    return hexToNumber((0, utils_1.bytesToHex)(bytes));
}
exports.bytesToNumber = bytesToNumber;
function hexToNumber(hex) {
    return BigInt(`0x${hex}`);
}
exports.hexToNumber = hexToNumber;
function encodeBase64toUint8(base64String) {
    return buffer_1.Buffer.from(base64String, 'base64');
}
exports.encodeBase64toUint8 = encodeBase64toUint8;
//# sourceMappingURL=utils.js.map