import ResultPoint from '../../ResultPoint';
import AztecDetectorResult from '../AztecDetectorResult';
import BitMatrix from '../../common/BitMatrix';
export declare class Point {
    private x;
    private y;
    toResultPoint(): ResultPoint;
    constructor(x: number, y: number);
    getX(): number;
    getY(): number;
}
/**
 * Encapsulates logic that can detect an Aztec Code in an image, even if the Aztec Code
 * is rotated or skewed, or partially obscured.
 *
 * @author David Olivier
 * @author Frank Yellin
 */
export default class Detector {
    private EXPECTED_CORNER_BITS;
    private image;
    private compact;
    private nbLayers;
    private nbDataBlocks;
    private nbCenterLayers;
    private shift;
    constructor(image: BitMatrix);
    detect(): AztecDetectorResult;
    /**
     * Detects an Aztec Code in an image.
     *
     * @param isMirror if true, image is a mirror-image of original
     * @return {@link AztecDetectorResult} encapsulating results of detecting an Aztec Code
     * @throws NotFoundException if no Aztec Code can be found
     */
    detectMirror(isMirror: boolean): AztecDetectorResult;
    /**
     * Extracts the number of data layers and data blocks from the layer around the bull's eye.
     *
     * @param bullsEyeCorners the array of bull's eye corners
     * @throws NotFoundException in case of too many errors or invalid parameters
     */
    private extractParameters;
    private getRotation;
    /**
     * Corrects the parameter bits using Reed-Solomon algorithm.
     *
     * @param parameterData parameter bits
     * @param compact true if this is a compact Aztec code
     * @throws NotFoundException if the array contains too many errors
     */
    private getCorrectedParameterData;
    /**
     * Finds the corners of a bull-eye centered on the passed point.
     * This returns the centers of the diagonal points just outside the bull's eye
     * Returns [topRight, bottomRight, bottomLeft, topLeft]
     *
     * @param pCenter Center point
     * @return The corners of the bull-eye
     * @throws NotFoundException If no valid bull-eye can be found
     */
    private getBullsEyeCorners;
    /**
     * Finds a candidate center point of an Aztec code from an image
     *
     * @return the center point
     */
    private getMatrixCenter;
    /**
     * Gets the Aztec code corners from the bull's eye corners and the parameters.
     *
     * @param bullsEyeCorners the array of bull's eye corners
     * @return the array of aztec code corners
     */
    private getMatrixCornerPoints;
    /**
     * Creates a BitMatrix by sampling the provided image.
     * topLeft, topRight, bottomRight, and bottomLeft are the centers of the squares on the
     * diagonal just outside the bull's eye.
     */
    private sampleGrid;
    /**
     * Samples a line.
     *
     * @param p1   start point (inclusive)
     * @param p2   end point (exclusive)
     * @param size number of bits
     * @return the array of bits as an int (first bit is high-order bit of result)
     */
    private sampleLine;
    /**
     * @return true if the border of the rectangle passed in parameter is compound of white points only
     *         or black points only
     */
    private isWhiteOrBlackRectangle;
    /**
     * Gets the color of a segment
     *
     * @return 1 if segment more than 90% black, -1 if segment is more than 90% white, 0 else
     */
    private getColor;
    /**
     * Gets the coordinate of the first point with a different color in the given direction
     */
    private getFirstDifferent;
    /**
     * Expand the square represented by the corner points by pushing out equally in all directions
     *
     * @param cornerPoints the corners of the square, which has the bull's eye at its center
     * @param oldSide the original length of the side of the square in the target bit matrix
     * @param newSide the new length of the size of the square in the target bit matrix
     * @return the corners of the expanded square
     */
    private expandSquare;
    private isValid;
    private isValidPoint;
    private distancePoint;
    private distanceResultPoint;
    private getDimension;
}
