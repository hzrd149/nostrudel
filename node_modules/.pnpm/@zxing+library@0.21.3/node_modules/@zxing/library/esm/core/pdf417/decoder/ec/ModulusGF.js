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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// package com.google.zxing.pdf417.decoder.ec;
// import com.google.zxing.pdf417.PDF417Common;
import PDF417Common from '../../PDF417Common';
import ModulusPoly from './ModulusPoly';
import IllegalArgumentException from '../../../IllegalArgumentException';
import ModulusBase from './ModulusBase';
/**
 * <p>A field based on powers of a generator integer, modulo some modulus.</p>
 *
 * @author Sean Owen
 * @see com.google.zxing.common.reedsolomon.GenericGF
 */
var ModulusGF = /** @class */ (function (_super) {
    __extends(ModulusGF, _super);
    // private /*final*/ modulus: /*int*/ number;
    function ModulusGF(modulus, generator) {
        var _this = _super.call(this) || this;
        _this.modulus = modulus;
        _this.expTable = new Int32Array(modulus);
        _this.logTable = new Int32Array(modulus);
        var x = /*int*/ 1;
        for (var i /*int*/ = 0; i < modulus; i++) {
            _this.expTable[i] = x;
            x = (x * generator) % modulus;
        }
        for (var i /*int*/ = 0; i < modulus - 1; i++) {
            _this.logTable[_this.expTable[i]] = i;
        }
        // logTable[0] == 0 but this should never be used
        _this.zero = new ModulusPoly(_this, new Int32Array([0]));
        _this.one = new ModulusPoly(_this, new Int32Array([1]));
        return _this;
    }
    ModulusGF.prototype.getZero = function () {
        return this.zero;
    };
    ModulusGF.prototype.getOne = function () {
        return this.one;
    };
    ModulusGF.prototype.buildMonomial = function (degree, coefficient) {
        if (degree < 0) {
            throw new IllegalArgumentException();
        }
        if (coefficient === 0) {
            return this.zero;
        }
        var coefficients = new Int32Array(degree + 1);
        coefficients[0] = coefficient;
        return new ModulusPoly(this, coefficients);
    };
    ModulusGF.PDF417_GF = new ModulusGF(PDF417Common.NUMBER_OF_CODEWORDS, 3);
    return ModulusGF;
}(ModulusBase));
export default ModulusGF;
