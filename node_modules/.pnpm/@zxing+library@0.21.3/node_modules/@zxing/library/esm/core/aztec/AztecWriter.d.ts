import BarcodeFormat from '../BarcodeFormat';
import EncodeHintType from '../EncodeHintType';
import Writer from '../Writer';
import BitMatrix from '../common/BitMatrix';
import { int } from '../../customTypings';
/**
 * Renders an Aztec code as a {@link BitMatrix}.
 */
export default class AztecWriter implements Writer {
    encode(contents: string, format: BarcodeFormat, width: int, height: int): BitMatrix;
    encodeWithHints(contents: string, format: BarcodeFormat, width: int, height: int, hints: Map<EncodeHintType, any>): BitMatrix;
    private static encodeLayers;
    private static renderResult;
}
