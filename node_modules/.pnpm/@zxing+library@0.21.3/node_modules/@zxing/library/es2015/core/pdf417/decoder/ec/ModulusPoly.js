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
// package com.google.zxing.pdf417.decoder.ec;
import IllegalArgumentException from '../../../IllegalArgumentException';
import System from '../../../util/System';
import StringBuilder from '../../../util/StringBuilder';
/**
 * @author Sean Owen
 * @see com.google.zxing.common.reedsolomon.GenericGFPoly
 */
export default /*final*/ class ModulusPoly {
    constructor(field, coefficients) {
        if (coefficients.length === 0) {
            throw new IllegalArgumentException();
        }
        this.field = field;
        let coefficientsLength = /*int*/ coefficients.length;
        if (coefficientsLength > 1 && coefficients[0] === 0) {
            // Leading term must be non-zero for anything except the constant polynomial "0"
            let firstNonZero = /*int*/ 1;
            while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
                firstNonZero++;
            }
            if (firstNonZero === coefficientsLength) {
                this.coefficients = new Int32Array([0]);
            }
            else {
                this.coefficients = new Int32Array(coefficientsLength - firstNonZero);
                System.arraycopy(coefficients, firstNonZero, this.coefficients, 0, this.coefficients.length);
            }
        }
        else {
            this.coefficients = coefficients;
        }
    }
    getCoefficients() {
        return this.coefficients;
    }
    /**
     * @return degree of this polynomial
     */
    getDegree() {
        return this.coefficients.length - 1;
    }
    /**
     * @return true iff this polynomial is the monomial "0"
     */
    isZero() {
        return this.coefficients[0] === 0;
    }
    /**
     * @return coefficient of x^degree term in this polynomial
     */
    getCoefficient(degree) {
        return this.coefficients[this.coefficients.length - 1 - degree];
    }
    /**
     * @return evaluation of this polynomial at a given point
     */
    evaluateAt(a) {
        if (a === 0) {
            // Just return the x^0 coefficient
            return this.getCoefficient(0);
        }
        if (a === 1) {
            // Just the sum of the coefficients
            let sum = /*int*/ 0;
            for (let coefficient /*int*/ of this.coefficients) {
                sum = this.field.add(sum, coefficient);
            }
            return sum;
        }
        let result = /*int*/ this.coefficients[0];
        let size = /*int*/ this.coefficients.length;
        for (let i /*int*/ = 1; i < size; i++) {
            result = this.field.add(this.field.multiply(a, result), this.coefficients[i]);
        }
        return result;
    }
    add(other) {
        if (!this.field.equals(other.field)) {
            throw new IllegalArgumentException('ModulusPolys do not have same ModulusGF field');
        }
        if (this.isZero()) {
            return other;
        }
        if (other.isZero()) {
            return this;
        }
        let smallerCoefficients = this.coefficients;
        let largerCoefficients = other.coefficients;
        if (smallerCoefficients.length > largerCoefficients.length) {
            let temp = smallerCoefficients;
            smallerCoefficients = largerCoefficients;
            largerCoefficients = temp;
        }
        let sumDiff = new Int32Array(largerCoefficients.length);
        let lengthDiff = /*int*/ largerCoefficients.length - smallerCoefficients.length;
        // Copy high-order terms only found in higher-degree polynomial's coefficients
        System.arraycopy(largerCoefficients, 0, sumDiff, 0, lengthDiff);
        for (let i /*int*/ = lengthDiff; i < largerCoefficients.length; i++) {
            sumDiff[i] = this.field.add(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
        }
        return new ModulusPoly(this.field, sumDiff);
    }
    subtract(other) {
        if (!this.field.equals(other.field)) {
            throw new IllegalArgumentException('ModulusPolys do not have same ModulusGF field');
        }
        if (other.isZero()) {
            return this;
        }
        return this.add(other.negative());
    }
    multiply(other) {
        if (other instanceof ModulusPoly) {
            return this.multiplyOther(other);
        }
        return this.multiplyScalar(other);
    }
    multiplyOther(other) {
        if (!this.field.equals(other.field)) {
            throw new IllegalArgumentException('ModulusPolys do not have same ModulusGF field');
        }
        if (this.isZero() || other.isZero()) {
            // return this.field.getZero();
            return new ModulusPoly(this.field, new Int32Array([0]));
        }
        let aCoefficients = this.coefficients;
        let aLength = /*int*/ aCoefficients.length;
        let bCoefficients = other.coefficients;
        let bLength = /*int*/ bCoefficients.length;
        let product = new Int32Array(aLength + bLength - 1);
        for (let i /*int*/ = 0; i < aLength; i++) {
            let aCoeff = /*int*/ aCoefficients[i];
            for (let j /*int*/ = 0; j < bLength; j++) {
                product[i + j] = this.field.add(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
            }
        }
        return new ModulusPoly(this.field, product);
    }
    negative() {
        let size = /*int*/ this.coefficients.length;
        let negativeCoefficients = new Int32Array(size);
        for (let i /*int*/ = 0; i < size; i++) {
            negativeCoefficients[i] = this.field.subtract(0, this.coefficients[i]);
        }
        return new ModulusPoly(this.field, negativeCoefficients);
    }
    multiplyScalar(scalar) {
        if (scalar === 0) {
            return new ModulusPoly(this.field, new Int32Array([0]));
        }
        if (scalar === 1) {
            return this;
        }
        let size = /*int*/ this.coefficients.length;
        let product = new Int32Array(size);
        for (let i /*int*/ = 0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], scalar);
        }
        return new ModulusPoly(this.field, product);
    }
    multiplyByMonomial(degree, coefficient) {
        if (degree < 0) {
            throw new IllegalArgumentException();
        }
        if (coefficient === 0) {
            return new ModulusPoly(this.field, new Int32Array([0]));
        }
        let size = /*int*/ this.coefficients.length;
        let product = new Int32Array(size + degree);
        for (let i /*int*/ = 0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], coefficient);
        }
        return new ModulusPoly(this.field, product);
    }
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
    toString() {
        let result = new StringBuilder( /*8 * this.getDegree()*/); // dynamic string size in JS
        for (let degree /*int*/ = this.getDegree(); degree >= 0; degree--) {
            let coefficient = /*int*/ this.getCoefficient(degree);
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
    }
}
