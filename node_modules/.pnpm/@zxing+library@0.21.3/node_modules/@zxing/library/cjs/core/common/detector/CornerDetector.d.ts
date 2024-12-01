import ResultPoint from '../../ResultPoint';
import BitMatrix from '../../common/BitMatrix';
/**
 * @author Mariusz Dąbrowski
 */
export default class CornerDetector {
    private image;
    private height;
    private width;
    private leftInit;
    private rightInit;
    private downInit;
    private upInit;
    private targetMatrixSize;
    /**
     * @throws NotFoundException if image is too small to accommodate {@code initSize}
     */
    constructor(image: BitMatrix, initSize: number, x: number, y: number, targetMatrixSize: number);
    /**
     * @throws NotFoundException if no Data Matrix Code can be found
     */
    detect(): ResultPoint[];
    private findCorners;
    private getCornerFromArea;
    /**
     * Determines whether a segment contains a black point
     *
     * @param a          min value of the scanned coordinate
     * @param b          max value of the scanned coordinate
     * @param fixed      value of fixed coordinate
     * @param horizontal set to true if scan must be horizontal, false if vertical
     * @return true if a black point has been found, else false.
     */
    private containsBlackPoint;
}
