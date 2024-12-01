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
// package com.google.zxing.aztec.encoder;
// import java.util.Deque;
// import java.util.LinkedList;
// import com.google.zxing.common.BitArray;
import BitArray from '../../common/BitArray';
import * as TokenHelpers from './TokenHelpers';
import * as C from './EncoderConstants';
import * as LatchTable from './LatchTable';
import * as ShiftTable from './ShiftTable';
import StringUtils from '../../common/StringUtils';
/**
 * State represents all information about a sequence necessary to generate the current output.
 * Note that a state is immutable.
 */
export default /*final*/ class State {
    constructor(token, mode, binaryBytes, bitCount) {
        this.token = token;
        this.mode = mode;
        this.binaryShiftByteCount = binaryBytes;
        this.bitCount = bitCount;
        // Make sure we match the token
        // int binaryShiftBitCount = (binaryShiftByteCount * 8) +
        //    (binaryShiftByteCount === 0 ? 0 :
        //     binaryShiftByteCount <= 31 ? 10 :
        //     binaryShiftByteCount <= 62 ? 20 : 21);
        // assert this.bitCount === token.getTotalBitCount() + binaryShiftBitCount;
    }
    getMode() {
        return this.mode;
    }
    getToken() {
        return this.token;
    }
    getBinaryShiftByteCount() {
        return this.binaryShiftByteCount;
    }
    getBitCount() {
        return this.bitCount;
    }
    // Create a new state representing this state with a latch to a (not
    // necessary different) mode, and then a code.
    latchAndAppend(mode, value) {
        // assert binaryShiftByteCount === 0;
        let bitCount = this.bitCount;
        let token = this.token;
        if (mode !== this.mode) {
            let latch = LatchTable.LATCH_TABLE[this.mode][mode];
            token = TokenHelpers.add(token, latch & 0xffff, latch >> 16);
            bitCount += latch >> 16;
        }
        let latchModeBitCount = mode === C.MODE_DIGIT ? 4 : 5;
        token = TokenHelpers.add(token, value, latchModeBitCount);
        return new State(token, mode, 0, bitCount + latchModeBitCount);
    }
    // Create a new state representing this state, with a temporary shift
    // to a different mode to output a single value.
    shiftAndAppend(mode, value) {
        // assert binaryShiftByteCount === 0 && this.mode !== mode;
        let token = this.token;
        let thisModeBitCount = this.mode === C.MODE_DIGIT ? 4 : 5;
        // Shifts exist only to UPPER and PUNCT, both with tokens size 5.
        token = TokenHelpers.add(token, ShiftTable.SHIFT_TABLE[this.mode][mode], thisModeBitCount);
        token = TokenHelpers.add(token, value, 5);
        return new State(token, this.mode, 0, this.bitCount + thisModeBitCount + 5);
    }
    // Create a new state representing this state, but an additional character
    // output in Binary Shift mode.
    addBinaryShiftChar(index) {
        let token = this.token;
        let mode = this.mode;
        let bitCount = this.bitCount;
        if (this.mode === C.MODE_PUNCT || this.mode === C.MODE_DIGIT) {
            // assert binaryShiftByteCount === 0;
            let latch = LatchTable.LATCH_TABLE[mode][C.MODE_UPPER];
            token = TokenHelpers.add(token, latch & 0xffff, latch >> 16);
            bitCount += latch >> 16;
            mode = C.MODE_UPPER;
        }
        let deltaBitCount = this.binaryShiftByteCount === 0 || this.binaryShiftByteCount === 31
            ? 18
            : this.binaryShiftByteCount === 62
                ? 9
                : 8;
        let result = new State(token, mode, this.binaryShiftByteCount + 1, bitCount + deltaBitCount);
        if (result.binaryShiftByteCount === 2047 + 31) {
            // The string is as long as it's allowed to be.  We should end it.
            result = result.endBinaryShift(index + 1);
        }
        return result;
    }
    // Create the state identical to this one, but we are no longer in
    // Binary Shift mode.
    endBinaryShift(index) {
        if (this.binaryShiftByteCount === 0) {
            return this;
        }
        let token = this.token;
        token = TokenHelpers.addBinaryShift(token, index - this.binaryShiftByteCount, this.binaryShiftByteCount);
        // assert token.getTotalBitCount() === this.bitCount;
        return new State(token, this.mode, 0, this.bitCount);
    }
    // Returns true if "this" state is better (equal: or) to be in than "that"
    // state under all possible circumstances.
    isBetterThanOrEqualTo(other) {
        let newModeBitCount = this.bitCount + (LatchTable.LATCH_TABLE[this.mode][other.mode] >> 16);
        if (this.binaryShiftByteCount < other.binaryShiftByteCount) {
            // add additional B/S encoding cost of other, if any
            newModeBitCount +=
                State.calculateBinaryShiftCost(other) -
                    State.calculateBinaryShiftCost(this);
        }
        else if (this.binaryShiftByteCount > other.binaryShiftByteCount &&
            other.binaryShiftByteCount > 0) {
            // maximum possible additional cost (it: h)
            newModeBitCount += 10;
        }
        return newModeBitCount <= other.bitCount;
    }
    toBitArray(text) {
        // Reverse the tokens, so that they are in the order that they should
        // be output
        let symbols = [];
        for (let token = this.endBinaryShift(text.length).token; token !== null; token = token.getPrevious()) {
            symbols.unshift(token);
        }
        let bitArray = new BitArray();
        // Add each token to the result.
        for (const symbol of symbols) {
            symbol.appendTo(bitArray, text);
        }
        // assert bitArray.getSize() === this.bitCount;
        return bitArray;
    }
    /**
     * @Override
     */
    toString() {
        return StringUtils.format('%s bits=%d bytes=%d', C.MODE_NAMES[this.mode], this.bitCount, this.binaryShiftByteCount);
    }
    static calculateBinaryShiftCost(state) {
        if (state.binaryShiftByteCount > 62) {
            return 21; // B/S with extended length
        }
        if (state.binaryShiftByteCount > 31) {
            return 20; // two B/S
        }
        if (state.binaryShiftByteCount > 0) {
            return 10; // one B/S
        }
        return 0;
    }
}
State.INITIAL_STATE = new State(C.EMPTY_TOKEN, C.MODE_UPPER, 0, 0);
