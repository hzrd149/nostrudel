import ResultPoint from '../../ResultPoint';
import BitMatrix from '../../common/BitMatrix';
/**
 * @author Guenther Grau
 */
export default class PDF417DetectorResult {
    private bits;
    private points;
    constructor(bits: BitMatrix, points: ResultPoint[][]);
    getBits(): BitMatrix;
    getPoints(): ResultPoint[][];
}
