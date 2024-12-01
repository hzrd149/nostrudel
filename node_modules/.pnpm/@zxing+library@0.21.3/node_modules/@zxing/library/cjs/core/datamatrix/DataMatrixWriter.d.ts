import BarcodeFormat from '../BarcodeFormat';
import BitMatrix from '../common/BitMatrix';
import EncodeHintType from '../EncodeHintType';
import Writer from '../Writer';
export default class DataMatrixWriter implements Writer {
    encode(contents: string, format: BarcodeFormat, width: number, height: number, hints?: Map<EncodeHintType, unknown>): BitMatrix;
    /**
     * Encode the given symbol info to a bit matrix.
     *
     * @param placement  The DataMatrix placement.
     * @param symbolInfo The symbol info to encode.
     * @return The bit matrix generated.
     */
    private encodeLowLevel;
    /**
     * Convert the ByteMatrix to BitMatrix.
     *
     * @param reqHeight The requested height of the image (in pixels) with the Datamatrix code
     * @param reqWidth The requested width of the image (in pixels) with the Datamatrix code
     * @param matrix The input matrix.
     * @return The output matrix.
     */
    private convertByteMatrixToBitMatrix;
}
