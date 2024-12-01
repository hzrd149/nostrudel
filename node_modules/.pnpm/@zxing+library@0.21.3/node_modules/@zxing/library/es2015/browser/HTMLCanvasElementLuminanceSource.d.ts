import LuminanceSource from '../core/LuminanceSource';
/**
 * @deprecated Moving to @zxing/browser
 */
export declare class HTMLCanvasElementLuminanceSource extends LuminanceSource {
    private canvas;
    private buffer;
    private static DEGREE_TO_RADIANS;
    private static FRAME_INDEX;
    private tempCanvasElement;
    constructor(canvas: HTMLCanvasElement, doAutoInvert?: boolean);
    private static makeBufferFromCanvasImageData;
    private static toGrayscaleBuffer;
    getRow(y: number, row: Uint8ClampedArray): Uint8ClampedArray;
    getMatrix(): Uint8ClampedArray;
    isCropSupported(): boolean;
    crop(left: number, top: number, width: number, height: number): LuminanceSource;
    /**
     * This is always true, since the image is a gray-scale image.
     *
     * @return true
     */
    isRotateSupported(): boolean;
    rotateCounterClockwise(): LuminanceSource;
    rotateCounterClockwise45(): LuminanceSource;
    private getTempCanvasElement;
    private rotate;
    invert(): LuminanceSource;
}
