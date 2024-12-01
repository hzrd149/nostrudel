import ResultPoint from '../ResultPoint';
import BitMatrix from '../common/BitMatrix';
import DetectorResult from '../common/DetectorResult';
/**
 * <p>Extends {@link DetectorResult} with more information specific to the Aztec format,
 * like the number of layers and whether it's compact.</p>
 *
 * @author Sean Owen
 */
export default class AztecDetectorResult extends DetectorResult {
    private compact;
    private nbDatablocks;
    private nbLayers;
    constructor(bits: BitMatrix, points: ResultPoint[], compact: boolean, nbDatablocks: number, nbLayers: number);
    getNbLayers(): number;
    getNbDatablocks(): number;
    isCompact(): boolean;
}
