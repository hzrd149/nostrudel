import { int } from '../../../customTypings';
/**
 * @author Guenther Grau
 */
export default class Codeword {
    private static BARCODE_ROW_UNKNOWN;
    private startX;
    private endX;
    private bucket;
    private value;
    private rowNumber;
    constructor(startX: int, endX: int, bucket: int, value: int);
    hasValidRowNumber(): boolean;
    isValidRowNumber(rowNumber: int): boolean;
    setRowNumberAsRowIndicatorColumn(): void;
    getWidth(): int;
    getStartX(): int;
    getEndX(): int;
    getBucket(): int;
    getValue(): int;
    getRowNumber(): int;
    setRowNumber(rowNumber: int): void;
    toString(): string;
}
