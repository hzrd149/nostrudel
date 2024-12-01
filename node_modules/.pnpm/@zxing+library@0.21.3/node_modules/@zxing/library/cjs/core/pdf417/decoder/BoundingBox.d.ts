import ResultPoint from '../../ResultPoint';
import BitMatrix from '../../common/BitMatrix';
import { int } from '../../../customTypings';
/**
 * @author Guenther Grau
 */
export default class BoundingBox {
    private image;
    private topLeft;
    private bottomLeft;
    private topRight;
    private bottomRight;
    private minX;
    private maxX;
    private minY;
    private maxY;
    constructor(image: BitMatrix | BoundingBox, topLeft?: ResultPoint, bottomLeft?: ResultPoint, topRight?: ResultPoint, bottomRight?: ResultPoint);
    /**
     *
     * @param image
     * @param topLeft
     * @param bottomLeft
     * @param topRight
     * @param bottomRight
     *
     * @throws NotFoundException
     */
    private constructor_1;
    private constructor_2;
    /**
     * @throws NotFoundException
     */
    static merge(leftBox: BoundingBox, rightBox: BoundingBox): BoundingBox;
    /**
     * @throws NotFoundException
     */
    addMissingRows(missingStartRows: int, missingEndRows: int, isLeft: boolean): BoundingBox;
    getMinX(): int;
    getMaxX(): int;
    getMinY(): int;
    getMaxY(): int;
    getTopLeft(): ResultPoint;
    getTopRight(): ResultPoint;
    getBottomLeft(): ResultPoint;
    getBottomRight(): ResultPoint;
}
