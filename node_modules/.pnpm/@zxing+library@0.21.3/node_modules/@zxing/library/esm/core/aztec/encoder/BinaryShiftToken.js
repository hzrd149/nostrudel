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
import SimpleToken from './SimpleToken';
var BinaryShiftToken = /** @class */ (function (_super) {
    __extends(BinaryShiftToken, _super);
    function BinaryShiftToken(previous, binaryShiftStart, binaryShiftByteCount) {
        var _this = _super.call(this, previous, 0, 0) || this;
        _this.binaryShiftStart = binaryShiftStart;
        _this.binaryShiftByteCount = binaryShiftByteCount;
        return _this;
    }
    /**
     * @Override
     */
    BinaryShiftToken.prototype.appendTo = function (bitArray, text) {
        for (var i = 0; i < this.binaryShiftByteCount; i++) {
            if (i === 0 || (i === 31 && this.binaryShiftByteCount <= 62)) {
                // We need a header before the first character, and before
                // character 31 when the total byte code is <= 62
                bitArray.appendBits(31, 5); // BINARY_SHIFT
                if (this.binaryShiftByteCount > 62) {
                    bitArray.appendBits(this.binaryShiftByteCount - 31, 16);
                }
                else if (i === 0) {
                    // 1 <= binaryShiftByteCode <= 62
                    bitArray.appendBits(Math.min(this.binaryShiftByteCount, 31), 5);
                }
                else {
                    // 32 <= binaryShiftCount <= 62 and i == 31
                    bitArray.appendBits(this.binaryShiftByteCount - 31, 5);
                }
            }
            bitArray.appendBits(text[this.binaryShiftStart + i], 8);
        }
    };
    BinaryShiftToken.prototype.addBinaryShift = function (start, byteCount) {
        // int bitCount = (byteCount * 8) + (byteCount <= 31 ? 10 : byteCount <= 62 ? 20 : 21);
        return new BinaryShiftToken(this, start, byteCount);
    };
    /**
     * @Override
     */
    BinaryShiftToken.prototype.toString = function () {
        return '<' + this.binaryShiftStart + '::' + (this.binaryShiftStart + this.binaryShiftByteCount - 1) + '>';
    };
    return BinaryShiftToken;
}(SimpleToken));
export default BinaryShiftToken;
