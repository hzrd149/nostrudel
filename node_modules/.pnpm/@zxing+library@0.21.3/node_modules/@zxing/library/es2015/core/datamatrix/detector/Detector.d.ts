import BitMatrix from '../../common/BitMatrix';
import DetectorResult from '../../common/DetectorResult';
/**
 * <p>Encapsulates logic that can detect a Data Matrix Code in an image, even if the Data Matrix Code
 * is rotated or skewed, or partially obscured.</p>
 *
 * @author Sean Owen
 */
export default class Detector {
    private image;
    private rectangleDetector;
    constructor(image: BitMatrix);
    /**
     * <p>Detects a Data Matrix Code in an image.</p>
     *
     * @return {@link DetectorResult} encapsulating results of detecting a Data Matrix Code
     * @throws NotFoundException if no Data Matrix Code can be found
     */
    detect(): DetectorResult;
    private static shiftPoint;
    private static moveAway;
    /**
     * Detect a solid side which has minimum transition.
     */
    private detectSolid1;
    /**
     * Detect a second solid side next to first solid side.
     */
    private detectSolid2;
    /**
     * Calculates the corner position of the white top right module.
     */
    private correctTopRight;
    /**
     * Shift the edge points to the module center.
     */
    private shiftToModuleCenter;
    private isValid;
    private static sampleGrid;
    /**
     * Counts the number of black/white transitions between two points, using something like Bresenham's algorithm.
     */
    private transitionsBetween;
}
