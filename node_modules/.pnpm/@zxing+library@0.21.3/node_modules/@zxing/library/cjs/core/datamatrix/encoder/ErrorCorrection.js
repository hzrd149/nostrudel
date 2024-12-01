"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StringBuilder_1 = require("../../util/StringBuilder");
var constants_1 = require("./constants");
/**
 * Error Correction Code for ECC200.
 */
var ErrorCorrection = /** @class */ (function () {
    function ErrorCorrection() {
    }
    /**
     * Creates the ECC200 error correction for an encoded message.
     *
     * @param codewords  the codewords
     * @param symbolInfo information about the symbol to be encoded
     * @return the codewords with interleaved error correction.
     */
    ErrorCorrection.encodeECC200 = function (codewords, symbolInfo) {
        if (codewords.length !== symbolInfo.getDataCapacity()) {
            throw new Error('The number of codewords does not match the selected symbol');
        }
        var sb = new StringBuilder_1.default();
        sb.append(codewords);
        var blockCount = symbolInfo.getInterleavedBlockCount();
        if (blockCount === 1) {
            var ecc = this.createECCBlock(codewords, symbolInfo.getErrorCodewords());
            sb.append(ecc);
        }
        else {
            // sb.setLength(sb.capacity());
            var dataSizes = [];
            var errorSizes = [];
            for (var i = 0; i < blockCount; i++) {
                dataSizes[i] = symbolInfo.getDataLengthForInterleavedBlock(i + 1);
                errorSizes[i] = symbolInfo.getErrorLengthForInterleavedBlock(i + 1);
            }
            for (var block = 0; block < blockCount; block++) {
                var temp = new StringBuilder_1.default();
                for (var d = block; d < symbolInfo.getDataCapacity(); d += blockCount) {
                    temp.append(codewords.charAt(d));
                }
                var ecc = this.createECCBlock(temp.toString(), errorSizes[block]);
                var pos = 0;
                for (var e = block; e < errorSizes[block] * blockCount; e += blockCount) {
                    sb.setCharAt(symbolInfo.getDataCapacity() + e, ecc.charAt(pos++));
                }
            }
        }
        return sb.toString();
    };
    ErrorCorrection.createECCBlock = function (codewords, numECWords) {
        var table = -1;
        for (var i = 0; i < constants_1.FACTOR_SETS.length; i++) {
            if (constants_1.FACTOR_SETS[i] === numECWords) {
                table = i;
                break;
            }
        }
        if (table < 0) {
            throw new Error('Illegal number of error correction codewords specified: ' + numECWords);
        }
        var poly = constants_1.FACTORS[table];
        var ecc = [];
        for (var i = 0; i < numECWords; i++) {
            ecc[i] = 0;
        }
        for (var i = 0; i < codewords.length; i++) {
            var m = ecc[numECWords - 1] ^ codewords.charAt(i).charCodeAt(0);
            for (var k = numECWords - 1; k > 0; k--) {
                if (m !== 0 && poly[k] !== 0) {
                    ecc[k] = ecc[k - 1] ^ constants_1.ALOG[(constants_1.LOG[m] + constants_1.LOG[poly[k]]) % 255];
                }
                else {
                    ecc[k] = ecc[k - 1];
                }
            }
            if (m !== 0 && poly[0] !== 0) {
                ecc[0] = constants_1.ALOG[(constants_1.LOG[m] + constants_1.LOG[poly[0]]) % 255];
            }
            else {
                ecc[0] = 0;
            }
        }
        var eccReversed = [];
        for (var i = 0; i < numECWords; i++) {
            eccReversed[i] = ecc[numECWords - i - 1];
        }
        return eccReversed.map(function (c) { return String.fromCharCode(c); }).join('');
    };
    return ErrorCorrection;
}());
exports.default = ErrorCorrection;
