import BitMatrix from '../../common/BitMatrix';
import { int } from '../../../customTypings';
/**
 * Aztec 2D code representation
 *
 * @author Rustam Abdullaev
 */
export default class AztecCode {
    private compact;
    private size;
    private layers;
    private codeWords;
    private matrix;
    /**
     * @return {@code true} if compact instead of full mode
     */
    isCompact(): boolean;
    setCompact(compact: boolean): void;
    /**
     * @return size in pixels (width and height)
     */
    getSize(): int;
    setSize(size: int): void;
    /**
     * @return number of levels
     */
    getLayers(): int;
    setLayers(layers: int): void;
    /**
     * @return number of data codewords
     */
    getCodeWords(): int;
    setCodeWords(codeWords: int): void;
    /**
     * @return the symbol image
     */
    getMatrix(): BitMatrix;
    setMatrix(matrix: BitMatrix): void;
}
