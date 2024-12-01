import Reader from '../Reader';
import Result from '../Result';
import BinaryBitmap from '../BinaryBitmap';
import DecodeHintType from '../DecodeHintType';
/**
 * This implementation can detect and decode Aztec codes in an image.
 *
 * @author David Olivier
 */
export default class AztecReader implements Reader {
    /**
     * Locates and decodes a Data Matrix code in an image.
     *
     * @return a String representing the content encoded by the Data Matrix code
     * @throws NotFoundException if a Data Matrix code cannot be found
     * @throws FormatException if a Data Matrix code cannot be decoded
     */
    decode(image: BinaryBitmap, hints?: Map<DecodeHintType, any> | null): Result;
    private reportFoundResultPoints;
    reset(): void;
}
