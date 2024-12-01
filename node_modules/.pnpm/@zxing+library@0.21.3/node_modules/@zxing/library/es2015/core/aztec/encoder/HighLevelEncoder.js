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
export default /*public final*/ class HighLevelEncoder {
    constructor(text) {
        this.text = text;
    }
    /**
     * @return text represented by this encoder encoded as a {@link BitArray}
     */
    encode() {
        const spaceCharCode = StringUtils.getCharCode(' ');
        const lineBreakCharCode = StringUtils.getCharCode('\n');
        let states = Collections.singletonList(State.INITIAL_STATE);
        for (let index = 0; index < this.text.length; index++) {
            let pairCode;
            let nextChar = index + 1 < this.text.length ? this.text[index + 1] : 0;
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
        const minState = Collections.min(states, (a, b) => {
            return a.getBitCount() - b.getBitCount();
        });
        // Convert it to a bit array, and return.
        return minState.toBitArray(this.text);
    }
    // We update a set of states for a new character by updating each state
    // for the new character, merging the results, and then removing the
    // non-optimal states.
    updateStateListForChar(states, index) {
        const result = [];
        for (let state /*State*/ of states) {
            this.updateStateForChar(state, index, result);
        }
        return HighLevelEncoder.simplifyStates(result);
    }
    // Return a set of states that represent the possible ways of updating this
    // state for the next character.  The resulting set of states are added to
    // the "result" list.
    updateStateForChar(state, index, result) {
        let ch = (this.text[index] & 0xff);
        let charInCurrentTable = CharMap.CHAR_MAP[state.getMode()][ch] > 0;
        let stateNoBinary = null;
        for (let mode /*int*/ = 0; mode <= C.MODE_PUNCT; mode++) {
            let charInMode = CharMap.CHAR_MAP[mode][ch];
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
                    const latchState = stateNoBinary.latchAndAppend(mode, charInMode);
                    result.push(latchState);
                }
                // Try generating the character by switching to its mode.
                if (!charInCurrentTable &&
                    ShiftTable.SHIFT_TABLE[state.getMode()][mode] >= 0) {
                    // It never makes sense to temporarily shift to another mode if the
                    // character exists in the current mode.  That can never save bits.
                    const shiftState = stateNoBinary.shiftAndAppend(mode, charInMode);
                    result.push(shiftState);
                }
            }
        }
        if (state.getBinaryShiftByteCount() > 0 ||
            CharMap.CHAR_MAP[state.getMode()][ch] === 0) {
            // It's never worthwhile to go into binary shift mode if you're not already
            // in binary shift mode, and the character exists in your current mode.
            // That can never save bits over just outputting the char in the current mode.
            let binaryState = state.addBinaryShiftChar(index);
            result.push(binaryState);
        }
    }
    static updateStateListForPair(states, index, pairCode) {
        const result = [];
        for (let state /*State*/ of states) {
            this.updateStateForPair(state, index, pairCode, result);
        }
        return this.simplifyStates(result);
    }
    static updateStateForPair(state, index, pairCode, result) {
        let stateNoBinary = state.endBinaryShift(index);
        // Possibility 1.  Latch to C.MODE_PUNCT, and then append this code
        result.push(stateNoBinary.latchAndAppend(C.MODE_PUNCT, pairCode));
        if (state.getMode() !== C.MODE_PUNCT) {
            // Possibility 2.  Shift to C.MODE_PUNCT, and then append this code.
            // Every state except C.MODE_PUNCT (handled above) can shift
            result.push(stateNoBinary.shiftAndAppend(C.MODE_PUNCT, pairCode));
        }
        if (pairCode === 3 || pairCode === 4) {
            // both characters are in DIGITS.  Sometimes better to just add two digits
            let digitState = stateNoBinary
                .latchAndAppend(C.MODE_DIGIT, 16 - pairCode) // period or comma in DIGIT
                .latchAndAppend(C.MODE_DIGIT, 1); // space in DIGIT
            result.push(digitState);
        }
        if (state.getBinaryShiftByteCount() > 0) {
            // It only makes sense to do the characters as binary if we're already
            // in binary mode.
            let binaryState = state
                .addBinaryShiftChar(index)
                .addBinaryShiftChar(index + 1);
            result.push(binaryState);
        }
    }
    static simplifyStates(states) {
        let result = [];
        for (const newState of states) {
            let add = true;
            for (const oldState of result) {
                if (oldState.isBetterThanOrEqualTo(newState)) {
                    add = false;
                    break;
                }
                if (newState.isBetterThanOrEqualTo(oldState)) {
                    // iterator.remove();
                    result = result.filter(x => x !== oldState); // remove old state
                }
            }
            if (add) {
                result.push(newState);
            }
        }
        return result;
    }
}
