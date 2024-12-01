"use strict";
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
// package com.google.zxing.aztec.encoder;
// import java.util.Deque;
// import java.util.LinkedList;
// import com.google.zxing.common.BitArray;
var BitArray_1 = require("../../common/BitArray");
var TokenHelpers = require("./TokenHelpers");
var C = require("./EncoderConstants");
var LatchTable = require("./LatchTable");
var ShiftTable = require("./ShiftTable");
var StringUtils_1 = require("../../common/StringUtils");
/**
 * State represents all information about a sequence necessary to generate the current output.
 * Note that a state is immutable.
 */
var State = /** @class */ (function () {
    function State(token, mode, binaryBytes, bitCount) {
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
    State.prototype.getMode = function () {
        return this.mode;
    };
    State.prototype.getToken = function () {
        return this.token;
    };
    State.prototype.getBinaryShiftByteCount = function () {
        return this.binaryShiftByteCount;
    };
    State.prototype.getBitCount = function () {
        return this.bitCount;
    };
    // Create a new state representing this state with a latch to a (not
    // necessary different) mode, and then a code.
    State.prototype.latchAndAppend = function (mode, value) {
        // assert binaryShiftByteCount === 0;
        var bitCount = this.bitCount;
        var token = this.token;
        if (mode !== this.mode) {
            var latch = LatchTable.LATCH_TABLE[this.mode][mode];
            token = TokenHelpers.add(token, latch & 0xffff, latch >> 16);
            bitCount += latch >> 16;
        }
        var latchModeBitCount = mode === C.MODE_DIGIT ? 4 : 5;
        token = TokenHelpers.add(token, value, latchModeBitCount);
        return new State(token, mode, 0, bitCount + latchModeBitCount);
    };
    // Create a new state representing this state, with a temporary shift
    // to a different mode to output a single value.
    State.prototype.shiftAndAppend = function (mode, value) {
        // assert binaryShiftByteCount === 0 && this.mode !== mode;
        var token = this.token;
        var thisModeBitCount = this.mode === C.MODE_DIGIT ? 4 : 5;
        // Shifts exist only to UPPER and PUNCT, both with tokens size 5.
        token = TokenHelpers.add(token, ShiftTable.SHIFT_TABLE[this.mode][mode], thisModeBitCount);
        token = TokenHelpers.add(token, value, 5);
        return new State(token, this.mode, 0, this.bitCount + thisModeBitCount + 5);
    };
    // Create a new state representing this state, but an additional character
    // output in Binary Shift mode.
    State.prototype.addBinaryShiftChar = function (index) {
        var token = this.token;
        var mode = this.mode;
        var bitCount = this.bitCount;
        if (this.mode === C.MODE_PUNCT || this.mode === C.MODE_DIGIT) {
            // assert binaryShiftByteCount === 0;
            var latch = LatchTable.LATCH_TABLE[mode][C.MODE_UPPER];
            token = TokenHelpers.add(token, latch & 0xffff, latch >> 16);
            bitCount += latch >> 16;
            mode = C.MODE_UPPER;
        }
        var deltaBitCount = this.binaryShiftByteCount === 0 || this.binaryShiftByteCount === 31
            ? 18
            : this.binaryShiftByteCount === 62
                ? 9
                : 8;
        var result = new State(token, mode, this.binaryShiftByteCount + 1, bitCount + deltaBitCount);
        if (result.binaryShiftByteCount === 2047 + 31) {
            // The string is as long as it's allowed to be.  We should end it.
            result = result.endBinaryShift(index + 1);
        }
        return result;
    };
    // Create the state identical to this one, but we are no longer in
    // Binary Shift mode.
    State.prototype.endBinaryShift = function (index) {
        if (this.binaryShiftByteCount === 0) {
            return this;
        }
        var token = this.token;
        token = TokenHelpers.addBinaryShift(token, index - this.binaryShiftByteCount, this.binaryShiftByteCount);
        // assert token.getTotalBitCount() === this.bitCount;
        return new State(token, this.mode, 0, this.bitCount);
    };
    // Returns true if "this" state is better (equal: or) to be in than "that"
    // state under all possible circumstances.
    State.prototype.isBetterThanOrEqualTo = function (other) {
        var newModeBitCount = this.bitCount + (LatchTable.LATCH_TABLE[this.mode][other.mode] >> 16);
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
    };
    State.prototype.toBitArray = function (text) {
        var e_1, _a;
        // Reverse the tokens, so that they are in the order that they should
        // be output
        var symbols = [];
        for (var token = this.endBinaryShift(text.length).token; token !== null; token = token.getPrevious()) {
            symbols.unshift(token);
        }
        var bitArray = new BitArray_1.default();
        try {
            // Add each token to the result.
            for (var symbols_1 = __values(symbols), symbols_1_1 = symbols_1.next(); !symbols_1_1.done; symbols_1_1 = symbols_1.next()) {
                var symbol = symbols_1_1.value;
                symbol.appendTo(bitArray, text);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (symbols_1_1 && !symbols_1_1.done && (_a = symbols_1.return)) _a.call(symbols_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // assert bitArray.getSize() === this.bitCount;
        return bitArray;
    };
    /**
     * @Override
     */
    State.prototype.toString = function () {
        return StringUtils_1.default.format('%s bits=%d bytes=%d', C.MODE_NAMES[this.mode], this.bitCount, this.binaryShiftByteCount);
    };
    State.calculateBinaryShiftCost = function (state) {
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
    };
    State.INITIAL_STATE = new State(C.EMPTY_TOKEN, C.MODE_UPPER, 0, 0);
    return State;
}());
exports.default = State;
