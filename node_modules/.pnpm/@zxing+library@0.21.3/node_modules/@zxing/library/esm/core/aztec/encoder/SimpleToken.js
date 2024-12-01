/*
* Copyright 2013 ZXing authors
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
import Token from './Token';
import Integer from '../../util/Integer';
var SimpleToken = /** @class */ (function (_super) {
    __extends(SimpleToken, _super);
    function SimpleToken(previous, value, bitCount) {
        var _this = _super.call(this, previous) || this;
        _this.value = value;
        _this.bitCount = bitCount;
        return _this;
    }
    /**
     * @Override
     */
    SimpleToken.prototype.appendTo = function (bitArray, text) {
        bitArray.appendBits(this.value, this.bitCount);
    };
    SimpleToken.prototype.add = function (value, bitCount) {
        return new SimpleToken(this, value, bitCount);
    };
    SimpleToken.prototype.addBinaryShift = function (start, byteCount) {
        // no-op can't binary shift a simple token
        console.warn('addBinaryShift on SimpleToken, this simply returns a copy of this token');
        return new SimpleToken(this, start, byteCount);
    };
    /**
     * @Override
     */
    SimpleToken.prototype.toString = function () {
        var value = this.value & ((1 << this.bitCount) - 1);
        value |= 1 << this.bitCount;
        return '<' + Integer.toBinaryString(value | (1 << this.bitCount)).substring(1) + '>';
    };
    return SimpleToken;
}(Token));
export default SimpleToken;
