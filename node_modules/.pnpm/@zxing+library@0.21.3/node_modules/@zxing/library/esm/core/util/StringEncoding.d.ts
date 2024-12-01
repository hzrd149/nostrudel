import CharacterSetECI from '../common/CharacterSetECI';
/**
 * Responsible for en/decoding strings.
 */
export default class StringEncoding {
    /**
     * Allows the user to set a custom decoding function
     * so more encoding formats the native ones can be supported.
     */
    static customDecoder: (bytes: Uint8Array, encodingName: string) => string;
    /**
     * Allows the user to set a custom encoding function
     * so more encoding formats the native ones can be supported.
     */
    static customEncoder: (s: string, encodingName: string) => Uint8Array;
    /**
     * Decodes some Uint8Array to a string format.
     */
    static decode(bytes: Uint8Array, encoding: string | CharacterSetECI): string;
    /**
     * Checks if the decoding method should use the fallback for decoding
     * once Node TextDecoder doesn't support all encoding formats.
     *
     * @param encodingName
     */
    private static shouldDecodeOnFallback;
    /**
     * Encodes some string into a Uint8Array.
     */
    static encode(s: string, encoding: string | CharacterSetECI): Uint8Array;
    private static isBrowser;
    /**
     * Returns the string value from some encoding character set.
     */
    static encodingName(encoding: string | CharacterSetECI): string;
    /**
     * Returns character set from some encoding character set.
     */
    static encodingCharacterSet(encoding: string | CharacterSetECI): CharacterSetECI;
    /**
     * Runs a fallback for the native decoding funcion.
     */
    private static decodeFallback;
    private static isDecodeFallbackSupported;
    /**
     * Runs a fallback for the native encoding funcion.
     *
     * @see https://stackoverflow.com/a/17192845/4367683
     */
    private static encodeFallback;
}
