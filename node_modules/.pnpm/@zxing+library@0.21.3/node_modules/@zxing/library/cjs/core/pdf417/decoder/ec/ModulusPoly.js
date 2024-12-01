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
var IllegalArgumentException_1 = require("../../../IllegalArgumentException");
var System_1 = require("../../../util/System");
var StringBuilder_1 = require("../../../util/StringBuilder");
/**
 * @author Sean Owen
 * @see com.google.zxing.common.reedsolomon.GenericGFPoly
 */
var ModulusPoly = /** @class */ (function () {
    function ModulusPoly(field, coefficients) {
        if (coefficients.length === 0) {
            throw new IllegalArgumentException_1.default();
        }
        this.field = field;
        var coefficientsLength = /*int*/ coefficients.length;
        if (coefficientsLength > 1 && coefficients[0] === 0) {
            // Leading term must be non-zero for anything except the constant polynomial "0"
            var firstNonZero = /*int*/ 1;
            while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
                firstNonZero++;
            }
            if (firstNonZero === coefficientsLength) {
                this.coefficients = new Int32Array([0]);
            }
            else {
                this.coefficients = new Int32Array(coefficientsLength - firstNonZero);
                System_1.default.arraycopy(coefficients, firstNonZero, this.coefficients, 0, this.coefficients.length);
            }
        }
        else {
            this.coefficients = coefficients;
        }
    }
    ModulusPoly.prototype.getCoefficients = function () {
        return this.coefficients;
    };
    /**
     * @return degree of this polynomial
     */
    ModulusPoly.prototype.getDegree = function () {
        return this.coefficients.length - 1;
    };
    /**
     * @return true iff this polynomial is the monomial "0"
     */
    ModulusPoly.prototype.isZero = function () {
        return this.coefficients[0] === 0;
    };
    /**
     * @return coefficient of x^degree term in this polynomial
     */
    ModulusPoly.prototype.getCoefficient = function (degree) {
        return this.coefficients[this.coefficients.length - 1 - degree];
    };
    /**
     * @return evaluation of this polynomial at a given point
     */
    ModulusPoly.prototype.evaluateAt = function (a) {
        var e_1, _a;
        if (a === 0) {
            // Just return the x^0 coefficient
            return this.getCoefficient(0);
        }
        if (a === 1) {
            // Just the sum of the coefficients
            var sum = /*int*/ 0;
            try {
                for (var _b = __values(this.coefficients), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var coefficient = _c.value /*int*/;
                    sum = this.field.add(sum, coefficient);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return sum;
        }
        var result = /*int*/ this.coefficients[0];
        var size = /*int*/ this.coefficients.length;
        for (var i /*int*/ = 1; i < size; i++) {
            result = this.field.add(this.field.multiply(a, result), this.coefficients[i]);
        }
        return result;
    };
    ModulusPoly.prototype.add = function (other) {
        if (!this.field.equals(other.field)) {
            throw new IllegalArgumentException_1.default('ModulusPolys do not have same ModulusGF field');
        }
        if (this.isZero()) {
            return other;
        }
        if (other.isZero()) {
            return this;
        }
        var smallerCoefficients = this.coefficients;
        var largerCoefficients = other.coefficients;
        if (smallerCoefficients.length > largerCoefficients.length) {
            var temp = smallerCoefficients;
            smallerCoefficients = largerCoefficients;
            largerCoefficients = temp;
        }
        var sumDiff = new Int32Array(largerCoefficients.length);
        var lengthDiff = /*int*/ largerCoefficients.length - smallerCoefficients.length;
        // Copy high-order terms only found in higher-degree polynomial's coefficients
        System_1.default.arraycopy(largerCoefficients, 0, sumDiff, 0, lengthDiff);
        for (var i /*int*/ = lengthDiff; i < largerCoefficients.length; i++) {
            sumDiff[i] = this.field.add(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
        }
        return new ModulusPoly(this.field, sumDiff);
    };
    ModulusPoly.prototype.subtract = function (other) {
        if (!this.field.equals(other.field)) {
            throw new IllegalArgumentException_1.default('ModulusPolys do not have same ModulusGF field');
        }
        if (other.isZero()) {
            return this;
        }
        return this.add(other.negative());
    };
    ModulusPoly.prototype.multiply = function (other) {
        if (other instanceof ModulusPoly) {
            return this.multiplyOther(other);
        }
        return this.multiplyScalar(other);
    };
    ModulusPoly.prototype.multiplyOther = function (other) {
        if (!this.field.equals(other.field)) {
            throw new IllegalArgumentException_1.default('ModulusPolys do not have same ModulusGF field');
        }
        if (this.isZero() || other.isZero()) {
            // return this.field.getZero();
            return new ModulusPoly(this.field, new Int32Array([0]));
        }
        var aCoefficients = this.coefficients;
        var aLength = /*int*/ aCoefficients.length;
        var bCoefficients = other.coefficients;
        var bLength = /*int*/ bCoefficients.length;
        var product = new Int32Array(aLength + bLength - 1);
        for (var i /*int*/ = 0; i < aLength; i++) {
            var aCoeff = /*int*/ aCoefficients[i];
            for (var j /*int*/ = 0; j < bLength; j++) {
                product[i + j] = this.field.add(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
            }
        }
        return new ModulusPoly(this.field, product);
    };
    ModulusPoly.prototype.negative = function () {
        var size = /*int*/ this.coefficients.length;
        var negativeCoefficients = new Int32Array(size);
        for (var i /*int*/ = 0; i < size; i++) {
            negativeCoefficients[i] = this.field.subtract(0, this.coefficients[i]);
        }
        return new ModulusPoly(this.field, negativeCoefficients);
    };
    ModulusPoly.prototype.multiplyScalar = function (scalar) {
        if (scalar === 0) {
            return new ModulusPoly(this.field, new Int32Array([0]));
        }
        if (scalar === 1) {
            return this;
        }
        var size = /*int*/ this.coefficients.length;
        var product = new Int32Array(size);
        for (var i /*int*/ = 0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], scalar);
        }
        return new ModulusPoly(this.field, product);
    };
    ModulusPoly.prototype.multiplyByMonomial = function (degree, coefficient) {
        if (degree < 0) {
            throw new IllegalArgumentException_1.default();
        }
        if (coefficient === 0) {
            return new ModulusPoly(this.field, new Int32Array([0]));
        }
        var size = /*int*/ this.coefficients.length;
        var product = new Int32Array(size + degree);
        for (var i /*int*/ = 0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], coefficient);
        }
        return new ModulusPoly(this.field, product);
    };
    /*
    ModulusPoly[] divide(other: ModulusPoly) {
      if (!field.equals(other.field)) {
        throw new IllegalArgumentException("ModulusPolys do not have same ModulusGF field");
      }
      if (other.isZero()) {
        throw new IllegalArgumentException("Divide by 0");
      }
  
      let quotient: ModulusPoly = field.getZero();
      let remainder: ModulusPoly = this;
  
      let denominatorLeadingTerm: /*int/ number = other.getCoefficient(other.getDegree());
      let inverseDenominatorLeadingTerm: /*int/ number = field.inverse(denominatorLeadingTerm);
  
      while (remainder.getDegree() >= other.getDegree() && !remainder.isZero()) {
        let degreeDifference: /*int/ number = remainder.getDegree() - other.getDegree();
        let scale: /*int/ number = field.multiply(remainder.getCoefficient(remainder.getDegree()), inverseDenominatorLeadingTerm);
        let term: ModulusPoly = other.multiplyByMonomial(degreeDifference, scale);
        let iterationQuotient: ModulusPoly = field.buildMonomial(degreeDifference, scale);
        quotient = quotient.add(iterationQuotient);
        remainder = remainder.subtract(term);
      }
  
      return new ModulusPoly[] { quotient, remainder };
    }
    */
    // @Override
    ModulusPoly.prototype.toString = function () {
        var result = new StringBuilder_1.default( /*8 * this.getDegree()*/); // dynamic string size in JS
        for (var degree /*int*/ = this.getDegree(); degree >= 0; degree--) {
            var coefficient = /*int*/ this.getCoefficient(degree);
            if (coefficient !== 0) {
                if (coefficient < 0) {
                    result.append(' - ');
                    coefficient = -coefficient;
                }
                else {
                    if (result.length() > 0) {
                        result.append(' + ');
                    }
                }
                if (degree === 0 || coefficient !== 1) {
                    result.append(coefficient);
                }
                if (degree !== 0) {
                    if (degree === 1) {
                        result.append('x');
                    }
                    else {
                        result.append('x^');
                        result.append(degree);
                    }
                }
            }
        }
        return result.toString();
    };
    return ModulusPoly;
}());
exports.default = ModulusPoly;
