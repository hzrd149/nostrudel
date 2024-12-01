import BarcodeMetadata from './BarcodeMetadata';
import BoundingBox from './BoundingBox';
import DetectionResultColumn from './DetectionResultColumn';
/**
 * @author Guenther Grau
 */
export default class DetectionResultRowIndicatorColumn extends DetectionResultColumn {
    private _isLeft;
    constructor(boundingBox: BoundingBox, isLeft: boolean);
    private setRowNumbers;
    adjustCompleteIndicatorColumnRowNumbers(barcodeMetadata: BarcodeMetadata): void;
    getRowHeights(): Int32Array;
    private adjustIncompleteIndicatorColumnRowNumbers;
    getBarcodeMetadata(): BarcodeMetadata;
    private removeIncorrectCodewords;
    isLeft(): boolean;
    toString(): string;
}
