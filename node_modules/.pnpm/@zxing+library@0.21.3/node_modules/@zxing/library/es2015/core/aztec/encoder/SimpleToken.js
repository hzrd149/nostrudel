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
import Token from './Token';
import Integer from '../../util/Integer';
export default /*final*/ class SimpleToken extends Token {
    constructor(previous, value, bitCount) {
        super(previous);
        this.value = value;
        this.bitCount = bitCount;
    }
    /**
     * @Override
     */
    appendTo(bitArray, text) {
        bitArray.appendBits(this.value, this.bitCount);
    }
    add(value, bitCount) {
        return new SimpleToken(this, value, bitCount);
    }
    addBinaryShift(start, byteCount) {
        // no-op can't binary shift a simple token
        console.warn('addBinaryShift on SimpleToken, this simply returns a copy of this token');
        return new SimpleToken(this, start, byteCount);
    }
    /**
     * @Override
     */
    toString() {
        let value = this.value & ((1 << this.bitCount) - 1);
        value |= 1 << this.bitCount;
        return '<' + Integer.toBinaryString(value | (1 << this.bitCount)).substring(1) + '>';
    }
}
