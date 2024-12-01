"use strict";
/*
* Copyright 2012 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
// package com.google.zxing.pdf417.decoder.ec;
// import com.google.zxing.ChecksumException;
var ChecksumException_1 = require("../../../ChecksumException");
var ModulusPoly_1 = require("./ModulusPoly");
var ModulusGF_1 = require("./ModulusGF");
/**
 * <p>PDF417 error correction implementation.</p>
 *
 * <p>This <a href="http://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction#Example">example</a>
 * is quite useful in understanding the algorithm.</p>
 *
 * @author Sean Owen
 * @see com.google.zxing.common.reedsolomon.ReedSolomonDecoder
 */
var ErrorCorrection = /** @class */ (function () {
    function ErrorCorrection() {
        this.field = ModulusGF_1.default.PDF417_GF;
    }
    /**
     * @param received received codewords
     * @param numECCodewords number of those codewords used for EC
     * @param erasures location of erasures
     * @return number of errors
     * @throws ChecksumException if errors cannot be corrected, maybe because of too many errors
     */
    ErrorCorrection.prototype.decode = function (received, numECCodewords, erasures) {
        var e_1, _a;
        var poly = new ModulusPoly_1.default(this.field, received);
        var S = new Int32Array(numECCodewords);
        var error = false;
        for (var i /*int*/ = numECCodewords; i > 0; i--) {
            var evaluation = poly.evaluateAt(this.field.exp(i));
            S[numECCodewords - i] = evaluation;
            if (evaluation !== 0) {
                error = true;
            }
        }
        if (!error) {
            return 0;
        }
        var knownErrors = this.field.getOne();
        if (erasures != null) {
            try {
                for (var erasures_1 = __values(erasures), erasures_1_1 = erasures_1.next(); !erasures_1_1.done; erasures_1_1 = erasures_1.next()) {
                    var erasure = erasures_1_1.value;
                    var b = this.field.exp(received.length - 1 - erasure);
                    // Add (1 - bx) term:
                    var term = new ModulusPoly_1.default(this.field, new Int32Array([this.field.subtract(0, b), 1]));
                    knownErrors = knownErrors.multiply(term);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (erasures_1_1 && !erasures_1_1.done && (_a = erasures_1.return)) _a.call(erasures_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        var syndrome = new ModulusPoly_1.default(this.field, S);
        // syndrome = syndrome.multiply(knownErrors);
        var sigmaOmega = this.runEuclideanAlgorithm(this.field.buildMonomial(numECCodewords, 1), syndrome, numECCodewords);
        var sigma = sigmaOmega[0];
        var omega = sigmaOmega[1];
        // sigma = sigma.multiply(knownErrors);
        var errorLocations = this.findErrorLocations(sigma);
        var errorMagnitudes = this.findErrorMagnitudes(omega, sigma, errorLocations);
        for (var i /*int*/ = 0; i < errorLocations.length; i++) {
            var position = received.length - 1 - this.field.log(errorLocations[i]);
            if (position < 0) {
                throw ChecksumException_1.default.getChecksumInstance();
            }
            received[position] = this.field.subtract(received[position], errorMagnitudes[i]);
        }
        return errorLocations.length;
    };
    /**
     *
     * @param ModulusPoly
     * @param a
     * @param ModulusPoly
     * @param b
     * @param int
     * @param R
     * @throws ChecksumException
     */
    ErrorCorrection.prototype.runEuclideanAlgorithm = function (a, b, R) {
        // Assume a's degree is >= b's
        if (a.getDegree() < b.getDegree()) {
            var temp = a;
            a = b;
            b = temp;
        }
        var rLast = a;
        var r = b;
        var tLast = this.field.getZero();
        var t = this.field.getOne();
        // Run Euclidean algorithm until r's degree is less than R/2
        while (r.getDegree() >= Math.round(R / 2)) {
            var rLastLast = rLast;
            var tLastLast = tLast;
            rLast = r;
            tLast = t;
            // Divide rLastLast by rLast, with quotient in q and remainder in r
            if (rLast.isZero()) {
                // Oops, Euclidean algorithm already terminated?
                throw ChecksumException_1.default.getChecksumInstance();
            }
            r = rLastLast;
            var q = this.field.getZero();
            var denominatorLeadingTerm = rLast.getCoefficient(rLast.getDegree());
            var dltInverse = this.field.inverse(denominatorLeadingTerm);
            while (r.getDegree() >= rLast.getDegree() && !r.isZero()) {
                var degreeDiff = r.getDegree() - rLast.getDegree();
                var scale = this.field.multiply(r.getCoefficient(r.getDegree()), dltInverse);
                q = q.add(this.field.buildMonomial(degreeDiff, scale));
                r = r.subtract(rLast.multiplyByMonomial(degreeDiff, scale));
            }
            t = q.multiply(tLast).subtract(tLastLast).negative();
        }
        var sigmaTildeAtZero = t.getCoefficient(0);
        if (sigmaTildeAtZero === 0) {
            throw ChecksumException_1.default.getChecksumInstance();
        }
        var inverse = this.field.inverse(sigmaTildeAtZero);
        var sigma = t.multiply(inverse);
        var omega = r.multiply(inverse);
        return [sigma, omega];
    };
    /**
     *
     * @param errorLocator
     * @throws ChecksumException
     */
    ErrorCorrection.prototype.findErrorLocations = function (errorLocator) {
        // This is a direct application of Chien's search
        var numErrors = errorLocator.getDegree();
        var result = new Int32Array(numErrors);
        var e = 0;
        for (var i /*int*/ = 1; i < this.field.getSize() && e < numErrors; i++) {
            if (errorLocator.evaluateAt(i) === 0) {
                result[e] = this.field.inverse(i);
                e++;
            }
        }
        if (e !== numErrors) {
            throw ChecksumException_1.default.getChecksumInstance();
        }
        return result;
    };
    ErrorCorrection.prototype.findErrorMagnitudes = function (errorEvaluator, errorLocator, errorLocations) {
        var errorLocatorDegree = errorLocator.getDegree();
        var formalDerivativeCoefficients = new Int32Array(errorLocatorDegree);
        for (var i /*int*/ = 1; i <= errorLocatorDegree; i++) {
            formalDerivativeCoefficients[errorLocatorDegree - i] =
                this.field.multiply(i, errorLocator.getCoefficient(i));
        }
        var formalDerivative = new ModulusPoly_1.default(this.field, formalDerivativeCoefficients);
        // This is directly applying Forney's Formula
        var s = errorLocations.length;
        var result = new Int32Array(s);
        for (var i /*int*/ = 0; i < s; i++) {
            var xiInverse = this.field.inverse(errorLocations[i]);
            var numerator = this.field.subtract(0, errorEvaluator.evaluateAt(xiInverse));
            var denominator = this.field.inverse(formalDerivative.evaluateAt(xiInverse));
            result[i] = this.field.multiply(numerator, denominator);
        }
        return result;
    };
    return ErrorCorrection;
}());
exports.default = ErrorCorrection;
