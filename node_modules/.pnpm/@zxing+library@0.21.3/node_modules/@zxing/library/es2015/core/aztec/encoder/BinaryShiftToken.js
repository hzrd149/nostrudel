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
import SimpleToken from './SimpleToken';
export default /*final*/ class BinaryShiftToken extends SimpleToken {
    constructor(previous, binaryShiftStart, binaryShiftByteCount) {
        super(previous, 0, 0);
        this.binaryShiftStart = binaryShiftStart;
        this.binaryShiftByteCount = binaryShiftByteCount;
    }
    /**
     * @Override
     */
    appendTo(bitArray, text) {
        for (let i = 0; i < this.binaryShiftByteCount; i++) {
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
    }
    addBinaryShift(start, byteCount) {
        // int bitCount = (byteCount * 8) + (byteCount <= 31 ? 10 : byteCount <= 62 ? 20 : 21);
        return new BinaryShiftToken(this, start, byteCount);
    }
    /**
     * @Override
     */
    toString() {
        return '<' + this.binaryShiftStart + '::' + (this.binaryShiftStart + this.binaryShiftByteCount - 1) + '>';
    }
}
