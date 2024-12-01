import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import OneDReader from './OneDReader';
import Result from '../Result';
/**
 * <p>Decodes CodaBar barcodes. </p>
 *
 * @author Evan @dodobelieve
 * @see CodaBarReader
 */
export default class CodaBarReader extends OneDReader {
    private readonly CODA_BAR_CHAR_SET;
    decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
    /**
     * converts bit array to valid data array(lengths of black bits and white bits)
     * @param row bit array to convert
     */
    private getValidRowData;
    /**
     * decode codabar code
     * @param row row to cecode
     */
    private codaBarDecodeRow;
    /**
     * check if the string is a CodaBar string
     * @param src string to determine
     */
    private validCodaBarString;
}
