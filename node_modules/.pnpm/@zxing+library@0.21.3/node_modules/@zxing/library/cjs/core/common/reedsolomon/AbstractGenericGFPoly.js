"use strict";
/*
 * Copyright 2007 ZXing authors
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
Object.defineProperty(exports, "__esModule", { value: true });
/*namespace com.google.zxing.common.reedsolomon {*/
// import GenericGF from './GenericGF';
var AbstractGenericGF_1 = require("./AbstractGenericGF");
/**
 * <p>Represents a polynomial whose coefficients are elements of a GF.
 * Instances of this class are immutable.</p>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code are an indirect
 * port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 */
var AbstractGenericGFPoly = /** @class */ (function () {
    function AbstractGenericGFPoly() {
    }
    AbstractGenericGFPoly.prototype.getCoefficients = function () {
        return this.coefficients;
    };
    /**
     * @return degree of this polynomial
     */
    AbstractGenericGFPoly.prototype.getDegree = function () {
        return this.coefficients.length - 1;
    };
    /**
     * @return true iff this polynomial is the monomial "0"
     */
    AbstractGenericGFPoly.prototype.isZero = function () {
        return this.coefficients[0] === 0;
    };
    /**
     * @return coefficient of x^degree term in this polynomial
     */
    AbstractGenericGFPoly.prototype.getCoefficient = function (degree /*int*/) {
        return this.coefficients[this.coefficients.length - 1 - degree];
    };
    /**
     * @return evaluation of this polynomial at a given point
     */
    AbstractGenericGFPoly.prototype.evaluateAt = function (a /*int*/) {
        if (a === 0) {
            // Just return the x^0 coefficient
            return this.getCoefficient(0);
        }
        var coefficients = this.coefficients;
        var result;
        if (a === 1) {
            // Just the sum of the coefficients
            result = 0;
            for (var i = 0, length_1 = coefficients.length; i !== length_1; i++) {
                var coefficient = coefficients[i];
                result = AbstractGenericGF_1.default.addOrSubtract(result, coefficient);
            }
            return result;
        }
        result = coefficients[0];
        var size = coefficients.length;
        var field = this.field;
        for (var i = 1; i < size; i++) {
            result = AbstractGenericGF_1.default.addOrSubtract(field.multiply(a, result), coefficients[i]);
        }
        return result;
    };
    /*@Override*/
    AbstractGenericGFPoly.prototype.toString = function () {
        var result = '';
        for (var degree = this.getDegree(); degree >= 0; degree--) {
            var coefficient = this.getCoefficient(degree);
            if (coefficient !== 0) {
                if (coefficient < 0) {
                    result += ' - ';
                    coefficient = -coefficient;
                }
                else {
                    if (result.length > 0) {
                        result += ' + ';
                    }
                }
                if (degree === 0 || coefficient !== 1) {
                    var alphaPower = this.field.log(coefficient);
                    if (alphaPower === 0) {
                        result += '1';
                    }
                    else if (alphaPower === 1) {
                        result += 'a';
                    }
                    else {
                        result += 'a^';
                        result += alphaPower;
                    }
                }
                if (degree !== 0) {
                    if (degree === 1) {
                        result += 'x';
                    }
                    else {
                        result += 'x^';
                        result += degree;
                    }
                }
            }
        }
        return result;
    };
    return AbstractGenericGFPoly;
}());
exports.default = AbstractGenericGFPoly;
