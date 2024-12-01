/**
 * Set of CharsetEncoders for a given input string
 *
 * Invariants:
 * - The list contains only encoders from CharacterSetECI (list is shorter then the list of encoders available on
 *   the platform for which ECI values are defined).
 * - The list contains encoders at least one encoder for every character in the input.
 * - The first encoder in the list is always the ISO-8859-1 encoder even of no character in the input can be encoded
 *       by it.
 * - If the input contains a character that is not in ISO-8859-1 then the last two entries in the list will be the
 *   UTF-8 encoder and the UTF-16BE encoder.
 *
 * @author Alex Geller
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
import Charset from '../util/Charset';
import StandardCharsets from '../util/StandardCharsets';
import StringEncoding from '../util/StringEncoding';
import StringUtils from './StringUtils';
var CharsetEncoder = /** @class */ (function () {
    function CharsetEncoder(charset) {
        this.charset = charset;
        this.name = charset.name;
    }
    CharsetEncoder.prototype.canEncode = function (c) {
        try {
            return StringEncoding.encode(c, this.charset) != null;
        }
        catch (ex) {
            return false;
        }
    };
    return CharsetEncoder;
}());
var ECIEncoderSet = /** @class */ (function () {
    /**
     * Constructs an encoder set
     *
     * @param stringToEncode the string that needs to be encoded
     * @param priorityCharset The preferred {@link Charset} or null.
     * @param fnc1 fnc1 denotes the character in the input that represents the FNC1 character or -1 for a non-GS1 bar
     * code. When specified, it is considered an error to pass it as argument to the methods canEncode() or encode().
     */
    function ECIEncoderSet(stringToEncode, priorityCharset, fnc1) {
        var e_1, _a, e_2, _b, e_3, _c;
        this.ENCODERS = [
            'IBM437',
            'ISO-8859-2',
            'ISO-8859-3',
            'ISO-8859-4',
            'ISO-8859-5',
            'ISO-8859-6',
            'ISO-8859-7',
            'ISO-8859-8',
            'ISO-8859-9',
            'ISO-8859-10',
            'ISO-8859-11',
            'ISO-8859-13',
            'ISO-8859-14',
            'ISO-8859-15',
            'ISO-8859-16',
            'windows-1250',
            'windows-1251',
            'windows-1252',
            'windows-1256',
            'Shift_JIS',
        ].map(function (name) { return new CharsetEncoder(Charset.forName(name)); });
        this.encoders = [];
        var neededEncoders = [];
        // we always need the ISO-8859-1 encoder. It is the default encoding
        neededEncoders.push(new CharsetEncoder(StandardCharsets.ISO_8859_1));
        var needUnicodeEncoder = priorityCharset != null && priorityCharset.name.startsWith('UTF');
        // Walk over the input string and see if all characters can be encoded with the list of encoders
        for (var i = 0; i < stringToEncode.length; i++) {
            var canEncode = false;
            try {
                for (var neededEncoders_1 = (e_1 = void 0, __values(neededEncoders)), neededEncoders_1_1 = neededEncoders_1.next(); !neededEncoders_1_1.done; neededEncoders_1_1 = neededEncoders_1.next()) {
                    var encoder = neededEncoders_1_1.value;
                    var singleCharacter = stringToEncode.charAt(i);
                    var c = singleCharacter.charCodeAt(0);
                    if (c === fnc1 || encoder.canEncode(singleCharacter)) {
                        canEncode = true;
                        break;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (neededEncoders_1_1 && !neededEncoders_1_1.done && (_a = neededEncoders_1.return)) _a.call(neededEncoders_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (!canEncode) {
                try {
                    // for the character at position i we don't yet have an encoder in the list
                    for (var _d = (e_2 = void 0, __values(this.ENCODERS)), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var encoder = _e.value;
                        if (encoder.canEncode(stringToEncode.charAt(i))) {
                            // Good, we found an encoder that can encode the character. We add him to the list and continue scanning
                            // the input
                            neededEncoders.push(encoder);
                            canEncode = true;
                            break;
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            if (!canEncode) {
                // The character is not encodeable by any of the single byte encoders so we remember that we will need a
                // Unicode encoder.
                needUnicodeEncoder = true;
            }
        }
        if (neededEncoders.length === 1 && !needUnicodeEncoder) {
            // the entire input can be encoded by the ISO-8859-1 encoder
            this.encoders = [neededEncoders[0]];
        }
        else {
            // we need more than one single byte encoder or we need a Unicode encoder.
            // In this case we append a UTF-8 and UTF-16 encoder to the list
            this.encoders = [];
            var index = 0;
            try {
                for (var neededEncoders_2 = __values(neededEncoders), neededEncoders_2_1 = neededEncoders_2.next(); !neededEncoders_2_1.done; neededEncoders_2_1 = neededEncoders_2.next()) {
                    var encoder = neededEncoders_2_1.value;
                    this.encoders[index++] = encoder;
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (neededEncoders_2_1 && !neededEncoders_2_1.done && (_c = neededEncoders_2.return)) _c.call(neededEncoders_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            // this.encoders[index] = new CharsetEncoder(StandardCharsets.UTF_8);
            // this.encoders[index + 1] = new CharsetEncoder(StandardCharsets.UTF_16BE);
        }
        // Compute priorityEncoderIndex by looking up priorityCharset in encoders
        var priorityEncoderIndexValue = -1;
        if (priorityCharset != null) {
            for (var i = 0; i < this.encoders.length; i++) {
                if (this.encoders[i] != null &&
                    priorityCharset.name === this.encoders[i].name) {
                    priorityEncoderIndexValue = i;
                    break;
                }
            }
        }
        this.priorityEncoderIndex = priorityEncoderIndexValue;
        // invariants
        // if(this?.encoders?.[0].name !== StandardCharsets.ISO_8859_1)){
        // throw new Error("ISO-8859-1 must be the first encoder");
        // }
    }
    ECIEncoderSet.prototype.length = function () {
        return this.encoders.length;
    };
    ECIEncoderSet.prototype.getCharsetName = function (index) {
        if (!(index < this.length())) {
            throw new Error('index must be less than length');
        }
        return this.encoders[index].name;
    };
    ECIEncoderSet.prototype.getCharset = function (index) {
        if (!(index < this.length())) {
            throw new Error('index must be less than length');
        }
        return this.encoders[index].charset;
    };
    ECIEncoderSet.prototype.getECIValue = function (encoderIndex) {
        return this.encoders[encoderIndex].charset.getValueIdentifier();
    };
    /*
     *  returns -1 if no priority charset was defined
     */
    ECIEncoderSet.prototype.getPriorityEncoderIndex = function () {
        return this.priorityEncoderIndex;
    };
    ECIEncoderSet.prototype.canEncode = function (c, encoderIndex) {
        if (!(encoderIndex < this.length())) {
            throw new Error('index must be less than length');
        }
        return true;
    };
    ECIEncoderSet.prototype.encode = function (c, encoderIndex) {
        if (!(encoderIndex < this.length())) {
            throw new Error('index must be less than length');
        }
        return StringEncoding.encode(StringUtils.getCharAt(c), this.encoders[encoderIndex].name);
    };
    return ECIEncoderSet;
}());
export { ECIEncoderSet };
