import BinaryBitmap from '../BinaryBitmap';
import DecodeHintType from '../DecodeHintType';
import Result from '../Result';
/**
 * Implementation of this interface attempt to read several barcodes from one image.
 *
 * @see com.google.zxing.Reader
 * @author Sean Owen
 */
export default interface MultipleBarcodeReader {
    /**
     * @throws NotFoundException
     */
    decodeMultiple(image: BinaryBitmap): Result[];
    /**
     * @throws NotFoundException
     */
    decodeMultiple(image: BinaryBitmap, hints: Map<DecodeHintType, any>): Result[];
}
