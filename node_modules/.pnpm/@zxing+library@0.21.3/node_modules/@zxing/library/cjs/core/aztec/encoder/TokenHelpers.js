"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add = exports.addBinaryShift = void 0;
var SimpleToken_1 = require("./SimpleToken");
var BinaryShiftToken_1 = require("./BinaryShiftToken");
function addBinaryShift(token, start, byteCount) {
    // int bitCount = (byteCount * 8) + (byteCount <= 31 ? 10 : byteCount <= 62 ? 20 : 21);
    return new BinaryShiftToken_1.default(token, start, byteCount);
}
exports.addBinaryShift = addBinaryShift;
function add(token, value, bitCount) {
    return new SimpleToken_1.default(token, value, bitCount);
}
exports.add = add;
