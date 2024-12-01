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
import Charset from '../util/Charset';
import StandardCharsets from '../util/StandardCharsets';
import StringEncoding from '../util/StringEncoding';
import StringUtils from './StringUtils';
class CharsetEncoder {
    constructor(charset) {
        this.charset = charset;
        this.name = charset.name;
    }
    canEncode(c) {
        try {
            return StringEncoding.encode(c, this.charset) != null;
        }
        catch (ex) {
            return false;
        }
    }
}
export class ECIEncoderSet {
    /**
     * Constructs an encoder set
     *
     * @param stringToEncode the string that needs to be encoded
     * @param priorityCharset The preferred {@link Charset} or null.
     * @param fnc1 fnc1 denotes the character in the input that represents the FNC1 character or -1 for a non-GS1 bar
     * code. When specified, it is considered an error to pass it as argument to the methods canEncode() or encode().
     */
    constructor(stringToEncode, priorityCharset, fnc1) {
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
        ].map(name => new CharsetEncoder(Charset.forName(name)));
        this.encoders = [];
        const neededEncoders = [];
        // we always need the ISO-8859-1 encoder. It is the default encoding
        neededEncoders.push(new CharsetEncoder(StandardCharsets.ISO_8859_1));
        let needUnicodeEncoder = priorityCharset != null && priorityCharset.name.startsWith('UTF');
        // Walk over the input string and see if all characters can be encoded with the list of encoders
        for (let i = 0; i < stringToEncode.length; i++) {
            let canEncode = false;
            for (const encoder of neededEncoders) {
                const singleCharacter = stringToEncode.charAt(i);
                const c = singleCharacter.charCodeAt(0);
                if (c === fnc1 || encoder.canEncode(singleCharacter)) {
                    canEncode = true;
                    break;
                }
            }
            if (!canEncode) {
                // for the character at position i we don't yet have an encoder in the list
                for (const encoder of this.ENCODERS) {
                    if (encoder.canEncode(stringToEncode.charAt(i))) {
                        // Good, we found an encoder that can encode the character. We add him to the list and continue scanning
                        // the input
                        neededEncoders.push(encoder);
                        canEncode = true;
                        break;
                    }
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
            let index = 0;
            for (const encoder of neededEncoders) {
                this.encoders[index++] = encoder;
            }
            // this.encoders[index] = new CharsetEncoder(StandardCharsets.UTF_8);
            // this.encoders[index + 1] = new CharsetEncoder(StandardCharsets.UTF_16BE);
        }
        // Compute priorityEncoderIndex by looking up priorityCharset in encoders
        let priorityEncoderIndexValue = -1;
        if (priorityCharset != null) {
            for (let i = 0; i < this.encoders.length; i++) {
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
    length() {
        return this.encoders.length;
    }
    getCharsetName(index) {
        if (!(index < this.length())) {
            throw new Error('index must be less than length');
        }
        return this.encoders[index].name;
    }
    getCharset(index) {
        if (!(index < this.length())) {
            throw new Error('index must be less than length');
        }
        return this.encoders[index].charset;
    }
    getECIValue(encoderIndex) {
        return this.encoders[encoderIndex].charset.getValueIdentifier();
    }
    /*
     *  returns -1 if no priority charset was defined
     */
    getPriorityEncoderIndex() {
        return this.priorityEncoderIndex;
    }
    canEncode(c, encoderIndex) {
        if (!(encoderIndex < this.length())) {
            throw new Error('index must be less than length');
        }
        return true;
    }
    encode(c, encoderIndex) {
        if (!(encoderIndex < this.length())) {
            throw new Error('index must be less than length');
        }
        return StringEncoding.encode(StringUtils.getCharAt(c), this.encoders[encoderIndex].name);
    }
}
