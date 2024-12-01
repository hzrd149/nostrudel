"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimalECIInput = void 0;
var ECIEncoderSet_1 = require("./ECIEncoderSet");
var Integer_1 = require("../util/Integer");
var StringBuilder_1 = require("../util/StringBuilder");
var COST_PER_ECI = 3; // approximated (latch + 2 codewords)
var MinimalECIInput = /** @class */ (function () {
    /**
     * Constructs a minimal input
     *
     * @param stringToEncode the character string to encode
     * @param priorityCharset The preferred {@link Charset}. When the value of the argument is null, the algorithm
     *   chooses charsets that leads to a minimal representation. Otherwise the algorithm will use the priority
     *   charset to encode any character in the input that can be encoded by it if the charset is among the
     *   supported charsets.
     * @param fnc1 denotes the character in the input that represents the FNC1 character or -1 if this is not GS1
     *   input.
     */
    function MinimalECIInput(stringToEncode, priorityCharset, fnc1) {
        this.fnc1 = fnc1;
        var encoderSet = new ECIEncoderSet_1.ECIEncoderSet(stringToEncode, priorityCharset, fnc1);
        if (encoderSet.length() === 1) {
            // optimization for the case when all can be encoded without ECI in ISO-8859-1
            for (var i = 0; i < this.bytes.length; i++) {
                var c = stringToEncode.charAt(i).charCodeAt(0);
                this.bytes[i] = c === fnc1 ? 1000 : c;
            }
        }
        else {
            this.bytes = this.encodeMinimally(stringToEncode, encoderSet, fnc1);
        }
    }
    MinimalECIInput.prototype.getFNC1Character = function () {
        return this.fnc1;
    };
    /**
     * Returns the length of this input.  The length is the number
     * of {@code byte}s, FNC1 characters or ECIs in the sequence.
     *
     * @return  the number of {@code char}s in this sequence
     */
    MinimalECIInput.prototype.length = function () {
        return this.bytes.length;
    };
    MinimalECIInput.prototype.haveNCharacters = function (index, n) {
        if (index + n - 1 >= this.bytes.length) {
            return false;
        }
        for (var i = 0; i < n; i++) {
            if (this.isECI(index + i)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Returns the {@code byte} value at the specified index.  An index ranges from zero
     * to {@code length() - 1}.  The first {@code byte} value of the sequence is at
     * index zero, the next at index one, and so on, as for array
     * indexing.
     *
     * @param   index the index of the {@code byte} value to be returned
     *
     * @return  the specified {@code byte} value as character or the FNC1 character
     *
     * @throws  IndexOutOfBoundsException
     *          if the {@code index} argument is negative or not less than
     *          {@code length()}
     * @throws  IllegalArgumentException
     *          if the value at the {@code index} argument is an ECI (@see #isECI)
     */
    MinimalECIInput.prototype.charAt = function (index) {
        if (index < 0 || index >= this.length()) {
            throw new Error('' + index);
        }
        if (this.isECI(index)) {
            throw new Error('value at ' + index + ' is not a character but an ECI');
        }
        return this.isFNC1(index) ? this.fnc1 : this.bytes[index];
    };
    /**
     * Returns a {@code CharSequence} that is a subsequence of this sequence.
     * The subsequence starts with the {@code char} value at the specified index and
     * ends with the {@code char} value at index {@code end - 1}.  The length
     * (in {@code char}s) of the
     * returned sequence is {@code end - start}, so if {@code start == end}
     * then an empty sequence is returned.
     *
     * @param   start   the start index, inclusive
     * @param   end     the end index, exclusive
     *
     * @return  the specified subsequence
     *
     * @throws  IndexOutOfBoundsException
     *          if {@code start} or {@code end} are negative,
     *          if {@code end} is greater than {@code length()},
     *          or if {@code start} is greater than {@code end}
     * @throws  IllegalArgumentException
     *          if a value in the range {@code start}-{@code end} is an ECI (@see #isECI)
     */
    MinimalECIInput.prototype.subSequence = function (start, end) {
        if (start < 0 || start > end || end > this.length()) {
            throw new Error('' + start);
        }
        var result = new StringBuilder_1.default();
        for (var i = start; i < end; i++) {
            if (this.isECI(i)) {
                throw new Error('value at ' + i + ' is not a character but an ECI');
            }
            result.append(this.charAt(i));
        }
        return result.toString();
    };
    /**
     * Determines if a value is an ECI
     *
     * @param   index the index of the value
     *
     * @return  true if the value at position {@code index} is an ECI
     *
     * @throws  IndexOutOfBoundsException
     *          if the {@code index} argument is negative or not less than
     *          {@code length()}
     */
    MinimalECIInput.prototype.isECI = function (index) {
        if (index < 0 || index >= this.length()) {
            throw new Error('' + index);
        }
        return this.bytes[index] > 255 && this.bytes[index] <= 999;
    };
    /**
     * Determines if a value is the FNC1 character
     *
     * @param   index the index of the value
     *
     * @return  true if the value at position {@code index} is the FNC1 character
     *
     * @throws  IndexOutOfBoundsException
     *          if the {@code index} argument is negative or not less than
     *          {@code length()}
     */
    MinimalECIInput.prototype.isFNC1 = function (index) {
        if (index < 0 || index >= this.length()) {
            throw new Error('' + index);
        }
        return this.bytes[index] === 1000;
    };
    /**
     * Returns the {@code int} ECI value at the specified index.  An index ranges from zero
     * to {@code length() - 1}.  The first {@code byte} value of the sequence is at
     * index zero, the next at index one, and so on, as for array
     * indexing.
     *
     * @param   index the index of the {@code int} value to be returned
     *
     * @return  the specified {@code int} ECI value.
     *          The ECI specified the encoding of all bytes with a higher index until the
     *          next ECI or until the end of the input if no other ECI follows.
     *
     * @throws  IndexOutOfBoundsException
     *          if the {@code index} argument is negative or not less than
     *          {@code length()}
     * @throws  IllegalArgumentException
     *          if the value at the {@code index} argument is not an ECI (@see #isECI)
     */
    MinimalECIInput.prototype.getECIValue = function (index) {
        if (index < 0 || index >= this.length()) {
            throw new Error('' + index);
        }
        if (!this.isECI(index)) {
            throw new Error('value at ' + index + ' is not an ECI but a character');
        }
        return this.bytes[index] - 256;
    };
    MinimalECIInput.prototype.addEdge = function (edges, to, edge) {
        if (edges[to][edge.encoderIndex] == null ||
            edges[to][edge.encoderIndex].cachedTotalSize > edge.cachedTotalSize) {
            edges[to][edge.encoderIndex] = edge;
        }
    };
    MinimalECIInput.prototype.addEdges = function (stringToEncode, encoderSet, edges, from, previous, fnc1) {
        var ch = stringToEncode.charAt(from).charCodeAt(0);
        var start = 0;
        var end = encoderSet.length();
        if (encoderSet.getPriorityEncoderIndex() >= 0 &&
            (ch === fnc1 ||
                encoderSet.canEncode(ch, encoderSet.getPriorityEncoderIndex()))) {
            start = encoderSet.getPriorityEncoderIndex();
            end = start + 1;
        }
        for (var i = start; i < end; i++) {
            if (ch === fnc1 || encoderSet.canEncode(ch, i)) {
                this.addEdge(edges, from + 1, new InputEdge(ch, encoderSet, i, previous, fnc1));
            }
        }
    };
    MinimalECIInput.prototype.encodeMinimally = function (stringToEncode, encoderSet, fnc1) {
        var inputLength = stringToEncode.length;
        // Array that represents vertices. There is a vertex for every character and encoding.
        var edges = new InputEdge[inputLength + 1][encoderSet.length()]();
        this.addEdges(stringToEncode, encoderSet, edges, 0, null, fnc1);
        for (var i = 1; i <= inputLength; i++) {
            for (var j = 0; j < encoderSet.length(); j++) {
                if (edges[i][j] != null && i < inputLength) {
                    this.addEdges(stringToEncode, encoderSet, edges, i, edges[i][j], fnc1);
                }
            }
            // optimize memory by removing edges that have been passed.
            for (var j = 0; j < encoderSet.length(); j++) {
                edges[i - 1][j] = null;
            }
        }
        var minimalJ = -1;
        var minimalSize = Integer_1.default.MAX_VALUE;
        for (var j = 0; j < encoderSet.length(); j++) {
            if (edges[inputLength][j] != null) {
                var edge = edges[inputLength][j];
                if (edge.cachedTotalSize < minimalSize) {
                    minimalSize = edge.cachedTotalSize;
                    minimalJ = j;
                }
            }
        }
        if (minimalJ < 0) {
            throw new Error('Failed to encode "' + stringToEncode + '"');
        }
        var intsAL = [];
        var current = edges[inputLength][minimalJ];
        while (current != null) {
            if (current.isFNC1()) {
                intsAL.unshift(1000);
            }
            else {
                var bytes = encoderSet.encode(current.c, current.encoderIndex);
                for (var i = bytes.length - 1; i >= 0; i--) {
                    intsAL.unshift(bytes[i] & 0xff);
                }
            }
            var previousEncoderIndex = current.previous === null ? 0 : current.previous.encoderIndex;
            if (previousEncoderIndex !== current.encoderIndex) {
                intsAL.unshift(256 + encoderSet.getECIValue(current.encoderIndex));
            }
            current = current.previous;
        }
        var ints = [];
        for (var i = 0; i < ints.length; i++) {
            ints[i] = intsAL[i];
        }
        return ints;
    };
    return MinimalECIInput;
}());
exports.MinimalECIInput = MinimalECIInput;
var InputEdge = /** @class */ (function () {
    function InputEdge(c, encoderSet, encoderIndex, previous, fnc1) {
        this.c = c;
        this.encoderSet = encoderSet;
        this.encoderIndex = encoderIndex;
        this.previous = previous;
        this.fnc1 = fnc1;
        this.c = c === fnc1 ? 1000 : c;
        var size = this.isFNC1() ? 1 : encoderSet.encode(c, encoderIndex).length;
        var previousEncoderIndex = previous === null ? 0 : previous.encoderIndex;
        if (previousEncoderIndex !== encoderIndex) {
            size += COST_PER_ECI;
        }
        if (previous != null) {
            size += previous.cachedTotalSize;
        }
        this.cachedTotalSize = size;
    }
    InputEdge.prototype.isFNC1 = function () {
        return this.c === 1000;
    };
    return InputEdge;
}());
