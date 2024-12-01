import GenericGF from './GenericGF';
/**
 * <p>Implements Reed-Solomon encoding, as the name implies.</p>
 *
 * @author Sean Owen
 * @author William Rucklidge
 */
export default class ReedSolomonEncoder {
    private field;
    private cachedGenerators;
    /**
     * A reed solomon error-correcting encoding constructor is created by
     * passing as Galois Field with of size equal to the number of code
     * words (symbols) in the alphabet (the number of values in each
     * element of arrays that are encoded/decoded).
     * @param field A galois field with a number of elements equal to the size
     * of the alphabet of symbols to encode.
     */
    constructor(field: GenericGF);
    private buildGenerator;
    /**
     * <p>Encode a sequence of code words (symbols) using Reed-Solomon to allow decoders
     * to detect and correct errors that may have been introduced when the resulting
     * data is stored or transmitted.</p>
     *
     * @param toEncode array used for both and output. Caller initializes the array with
     * the code words (symbols) to be encoded followed by empty elements allocated to make
     * space for error-correction code words in the encoded output. The array contains
     * the encdoded output when encode returns. Code words are encoded as numbers from
     * 0 to n-1, where n is the number of possible code words (symbols), as determined
     * by the size of the Galois Field passed in the constructor of this object.
     * @param ecBytes the number of elements reserved in the array (first parameter)
     * to store error-correction code words. Thus, the number of code words (symbols)
     * to encode in the first parameter is thus toEncode.length - ecBytes.
     * Note, the use of "bytes" in the name of this parameter is misleading, as there may
     * be more or fewer than 256 symbols being encoded, as determined by the number of
     * elements in the Galois Field passed as a constructor to this object.
     * @throws IllegalArgumentException thrown in response to validation errros.
     */
    encode(toEncode: Int32Array, ecBytes: number): void;
}
