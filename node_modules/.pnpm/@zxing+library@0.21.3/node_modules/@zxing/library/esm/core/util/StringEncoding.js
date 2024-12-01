import UnsupportedOperationException from '../UnsupportedOperationException';
import CharacterSetECI from '../common/CharacterSetECI';
/**
 * Responsible for en/decoding strings.
 */
var StringEncoding = /** @class */ (function () {
    function StringEncoding() {
    }
    /**
     * Decodes some Uint8Array to a string format.
     */
    StringEncoding.decode = function (bytes, encoding) {
        var encodingName = this.encodingName(encoding);
        if (this.customDecoder) {
            return this.customDecoder(bytes, encodingName);
        }
        // Increases browser support.
        if (typeof TextDecoder === 'undefined' || this.shouldDecodeOnFallback(encodingName)) {
            return this.decodeFallback(bytes, encodingName);
        }
        return new TextDecoder(encodingName).decode(bytes);
    };
    /**
     * Checks if the decoding method should use the fallback for decoding
     * once Node TextDecoder doesn't support all encoding formats.
     *
     * @param encodingName
     */
    StringEncoding.shouldDecodeOnFallback = function (encodingName) {
        return !StringEncoding.isBrowser() && encodingName === 'ISO-8859-1';
    };
    /**
     * Encodes some string into a Uint8Array.
     */
    StringEncoding.encode = function (s, encoding) {
        var encodingName = this.encodingName(encoding);
        if (this.customEncoder) {
            return this.customEncoder(s, encodingName);
        }
        // Increases browser support.
        if (typeof TextEncoder === 'undefined') {
            return this.encodeFallback(s);
        }
        // TextEncoder only encodes to UTF8 by default as specified by encoding.spec.whatwg.org
        return new TextEncoder().encode(s);
    };
    StringEncoding.isBrowser = function () {
        return (typeof window !== 'undefined' && {}.toString.call(window) === '[object Window]');
    };
    /**
     * Returns the string value from some encoding character set.
     */
    StringEncoding.encodingName = function (encoding) {
        return typeof encoding === 'string'
            ? encoding
            : encoding.getName();
    };
    /**
     * Returns character set from some encoding character set.
     */
    StringEncoding.encodingCharacterSet = function (encoding) {
        if (encoding instanceof CharacterSetECI) {
            return encoding;
        }
        return CharacterSetECI.getCharacterSetECIByName(encoding);
    };
    /**
     * Runs a fallback for the native decoding funcion.
     */
    StringEncoding.decodeFallback = function (bytes, encoding) {
        var characterSet = this.encodingCharacterSet(encoding);
        if (StringEncoding.isDecodeFallbackSupported(characterSet)) {
            var s = '';
            for (var i = 0, length_1 = bytes.length; i < length_1; i++) {
                var h = bytes[i].toString(16);
                if (h.length < 2) {
                    h = '0' + h;
                }
                s += '%' + h;
            }
            return decodeURIComponent(s);
        }
        if (characterSet.equals(CharacterSetECI.UnicodeBigUnmarked)) {
            return String.fromCharCode.apply(null, new Uint16Array(bytes.buffer));
        }
        throw new UnsupportedOperationException("Encoding " + this.encodingName(encoding) + " not supported by fallback.");
    };
    StringEncoding.isDecodeFallbackSupported = function (characterSet) {
        return characterSet.equals(CharacterSetECI.UTF8) ||
            characterSet.equals(CharacterSetECI.ISO8859_1) ||
            characterSet.equals(CharacterSetECI.ASCII);
    };
    /**
     * Runs a fallback for the native encoding funcion.
     *
     * @see https://stackoverflow.com/a/17192845/4367683
     */
    StringEncoding.encodeFallback = function (s) {
        var encodedURIstring = btoa(unescape(encodeURIComponent(s)));
        var charList = encodedURIstring.split('');
        var uintArray = [];
        for (var i = 0; i < charList.length; i++) {
            uintArray.push(charList[i].charCodeAt(0));
        }
        return new Uint8Array(uintArray);
    };
    return StringEncoding;
}());
export default StringEncoding;
