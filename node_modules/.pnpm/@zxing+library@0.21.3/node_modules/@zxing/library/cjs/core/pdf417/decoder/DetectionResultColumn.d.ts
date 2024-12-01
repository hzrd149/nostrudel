import Codeword from './Codeword';
import BoundingBox from './BoundingBox';
import { int } from '../../../customTypings';
/**
 * @author Guenther Grau
 */
export default class DetectionResultColumn {
    private static MAX_NEARBY_DISTANCE;
    private boundingBox;
    private codewords;
    constructor(boundingBox: BoundingBox);
    getCodewordNearby(imageRow: int): Codeword;
    imageRowToCodewordIndex(imageRow: int): int;
    setCodeword(imageRow: int, codeword: Codeword): void;
    getCodeword(imageRow: int): Codeword;
    getBoundingBox(): BoundingBox;
    getCodewords(): Codeword[];
    toString(): string;
}
