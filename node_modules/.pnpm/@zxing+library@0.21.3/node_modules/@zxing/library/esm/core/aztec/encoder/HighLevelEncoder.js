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
// import java.util.Collection;
// import java.util.Collections;
import Collections from '../../util/Collections';
// import java.util.Comparator;
// import java.util.Iterator;
// import java.util.LinkedList;
import State from './State';
import * as C from './EncoderConstants';
import * as CharMap from './CharMap';
import * as ShiftTable from './ShiftTable';
import StringUtils from '../../common/StringUtils';
/**
 * This produces nearly optimal encodings of text into the first-level of
 * encoding used by Aztec code.
 *
 * It uses a dynamic algorithm.  For each prefix of the string, it determines
 * a set of encodings that could lead to this prefix.  We repeatedly add a
 * character and generate a new set of optimal encodings until we have read
 * through the entire input.
 *
 * @author Frank Yellin
 * @author Rustam Abdullaev
 */
var HighLevelEncoder = /** @class */ (function () {
    function HighLevelEncoder(text) {
        this.text = text;
    }
    /**
     * @return text represented by this encoder encoded as a {@link BitArray}
     */
    HighLevelEncoder.prototype.encode = function () {
        var spaceCharCode = StringUtils.getCharCode(' ');
        var lineBreakCharCode = StringUtils.getCharCode('\n');
        var states = Collections.singletonList(State.INITIAL_STATE);
        for (var index = 0; index < this.text.length; index++) {
            var pairCode = void 0;
            var nextChar = index + 1 < this.text.length ? this.text[index + 1] : 0;
            switch (this.text[index]) {
                case StringUtils.getCharCode('\r'):
                    pairCode = nextChar === lineBreakCharCode ? 2 : 0;
                    break;
                case StringUtils.getCharCode('.'):
                    pairCode = nextChar === spaceCharCode ? 3 : 0;
                    break;
                case StringUtils.getCharCode(','):
                    pairCode = nextChar === spaceCharCode ? 4 : 0;
                    break;
                case StringUtils.getCharCode(':'):
                    pairCode = nextChar === spaceCharCode ? 5 : 0;
                    break;
                default:
                    pairCode = 0;
            }
            if (pairCode > 0) {
                // We have one of the four special PUNCT pairs.  Treat them specially.
                // Get a new set of states for the two new characters.
                states = HighLevelEncoder.updateStateListForPair(states, index, pairCode);
                index++;
            }
            else {
                // Get a new set of states for the new character.
                states = this.updateStateListForChar(states, index);
            }
        }
        // We are left with a set of states.  Find the shortest one.
        var minState = Collections.min(states, function (a, b) {
            return a.getBitCount() - b.getBitCount();
        });
        // Convert it to a bit array, and return.
        return minState.toBitArray(this.text);
    };
    // We update a set of states for a new character by updating each state
    // for the new character, merging the results, and then removing the
    // non-optimal states.
    HighLevelEncoder.prototype.updateStateListForChar = function (states, index) {
        var e_1, _a;
        var result = [];
        try {
            for (var states_1 = __values(states), states_1_1 = states_1.next(); !states_1_1.done; states_1_1 = states_1.next()) {
                var state = states_1_1.value /*State*/;
                this.updateStateForChar(state, index, result);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (states_1_1 && !states_1_1.done && (_a = states_1.return)) _a.call(states_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return HighLevelEncoder.simplifyStates(result);
    };
    // Return a set of states that represent the possible ways of updating this
    // state for the next character.  The resulting set of states are added to
    // the "result" list.
    HighLevelEncoder.prototype.updateStateForChar = function (state, index, result) {
        var ch = (this.text[index] & 0xff);
        var charInCurrentTable = CharMap.CHAR_MAP[state.getMode()][ch] > 0;
        var stateNoBinary = null;
        for (var mode /*int*/ = 0; mode <= C.MODE_PUNCT; mode++) {
            var charInMode = CharMap.CHAR_MAP[mode][ch];
            if (charInMode > 0) {
                if (stateNoBinary == null) {
                    // Only create stateNoBinary the first time it's required.
                    stateNoBinary = state.endBinaryShift(index);
                }
                // Try generating the character by latching to its mode
                if (!charInCurrentTable ||
                    mode === state.getMode() ||
                    mode === C.MODE_DIGIT) {
                    // If the character is in the current table, we don't want to latch to
                    // any other mode except possibly digit (which uses only 4 bits).  Any
                    // other latch would be equally successful *after* this character, and
                    // so wouldn't save any bits.
                    var latchState = stateNoBinary.latchAndAppend(mode, charInMode);
                    result.push(latchState);
                }
                // Try generating the character by switching to its mode.
                if (!charInCurrentTable &&
                    ShiftTable.SHIFT_TABLE[state.getMode()][mode] >= 0) {
                    // It never makes sense to temporarily shift to another mode if the
                    // character exists in the current mode.  That can never save bits.
                    var shiftState = stateNoBinary.shiftAndAppend(mode, charInMode);
                    result.push(shiftState);
                }
            }
        }
        if (state.getBinaryShiftByteCount() > 0 ||
            CharMap.CHAR_MAP[state.getMode()][ch] === 0) {
            // It's never worthwhile to go into binary shift mode if you're not already
            // in binary shift mode, and the character exists in your current mode.
            // That can never save bits over just outputting the char in the current mode.
            var binaryState = state.addBinaryShiftChar(index);
            result.push(binaryState);
        }
    };
    HighLevelEncoder.updateStateListForPair = function (states, index, pairCode) {
        var e_2, _a;
        var result = [];
        try {
            for (var states_2 = __values(states), states_2_1 = states_2.next(); !states_2_1.done; states_2_1 = states_2.next()) {
                var state = states_2_1.value /*State*/;
                this.updateStateForPair(state, index, pairCode, result);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (states_2_1 && !states_2_1.done && (_a = states_2.return)) _a.call(states_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return this.simplifyStates(result);
    };
    HighLevelEncoder.updateStateForPair = function (state, index, pairCode, result) {
        var stateNoBinary = state.endBinaryShift(index);
        // Possibility 1.  Latch to C.MODE_PUNCT, and then append this code
        result.push(stateNoBinary.latchAndAppend(C.MODE_PUNCT, pairCode));
        if (state.getMode() !== C.MODE_PUNCT) {
            // Possibility 2.  Shift to C.MODE_PUNCT, and then append this code.
            // Every state except C.MODE_PUNCT (handled above) can shift
            result.push(stateNoBinary.shiftAndAppend(C.MODE_PUNCT, pairCode));
        }
        if (pairCode === 3 || pairCode === 4) {
            // both characters are in DIGITS.  Sometimes better to just add two digits
            var digitState = stateNoBinary
                .latchAndAppend(C.MODE_DIGIT, 16 - pairCode) // period or comma in DIGIT
                .latchAndAppend(C.MODE_DIGIT, 1); // space in DIGIT
            result.push(digitState);
        }
        if (state.getBinaryShiftByteCount() > 0) {
            // It only makes sense to do the characters as binary if we're already
            // in binary mode.
            var binaryState = state
                .addBinaryShiftChar(index)
                .addBinaryShiftChar(index + 1);
            result.push(binaryState);
        }
    };
    HighLevelEncoder.simplifyStates = function (states) {
        var e_3, _a, e_4, _b;
        var result = [];
        try {
            for (var states_3 = __values(states), states_3_1 = states_3.next(); !states_3_1.done; states_3_1 = states_3.next()) {
                var newState = states_3_1.value;
                var add = true;
                var _loop_1 = function (oldState) {
                    if (oldState.isBetterThanOrEqualTo(newState)) {
                        add = false;
                        return "break";
                    }
                    if (newState.isBetterThanOrEqualTo(oldState)) {
                        // iterator.remove();
                        result = result.filter(function (x) { return x !== oldState; }); // remove old state
                    }
                };
                try {
                    for (var result_1 = (e_4 = void 0, __values(result)), result_1_1 = result_1.next(); !result_1_1.done; result_1_1 = result_1.next()) {
                        var oldState = result_1_1.value;
                        var state_1 = _loop_1(oldState);
                        if (state_1 === "break")
                            break;
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (result_1_1 && !result_1_1.done && (_b = result_1.return)) _b.call(result_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                if (add) {
                    result.push(newState);
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (states_3_1 && !states_3_1.done && (_a = states_3.return)) _a.call(states_3);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return result;
    };
    return HighLevelEncoder;
}());
export default HighLevelEncoder;
