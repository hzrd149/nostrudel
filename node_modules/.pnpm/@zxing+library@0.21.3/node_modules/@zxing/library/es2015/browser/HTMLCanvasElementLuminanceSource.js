import InvertedLuminanceSource from '../core/InvertedLuminanceSource';
import LuminanceSource from '../core/LuminanceSource';
import IllegalArgumentException from '../core/IllegalArgumentException';
/**
 * @deprecated Moving to @zxing/browser
 */
export class HTMLCanvasElementLuminanceSource extends LuminanceSource {
    constructor(canvas, doAutoInvert = false) {
        super(canvas.width, canvas.height);
        this.canvas = canvas;
        this.tempCanvasElement = null;
        this.buffer = HTMLCanvasElementLuminanceSource.makeBufferFromCanvasImageData(canvas, doAutoInvert);
    }
    static makeBufferFromCanvasImageData(canvas, doAutoInvert = false) {
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        return HTMLCanvasElementLuminanceSource.toGrayscaleBuffer(imageData.data, canvas.width, canvas.height, doAutoInvert);
    }
    static toGrayscaleBuffer(imageBuffer, width, height, doAutoInvert = false) {
        const grayscaleBuffer = new Uint8ClampedArray(width * height);
        HTMLCanvasElementLuminanceSource.FRAME_INDEX = !HTMLCanvasElementLuminanceSource.FRAME_INDEX;
        if (HTMLCanvasElementLuminanceSource.FRAME_INDEX || !doAutoInvert) {
            for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += 4, j++) {
                let gray;
                const alpha = imageBuffer[i + 3];
                // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
                // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
                // barcode image. Force any such pixel to be white:
                if (alpha === 0) {
                    gray = 0xFF;
                }
                else {
                    const pixelR = imageBuffer[i];
                    const pixelG = imageBuffer[i + 1];
                    const pixelB = imageBuffer[i + 2];
                    // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
                    // (306*R) >> 10 is approximately equal to R*0.299, and so on.
                    // 0x200 >> 10 is 0.5, it implements rounding.
                    gray = (306 * pixelR +
                        601 * pixelG +
                        117 * pixelB +
                        0x200) >> 10;
                }
                grayscaleBuffer[j] = gray;
            }
        }
        else {
            for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += 4, j++) {
                let gray;
                const alpha = imageBuffer[i + 3];
                // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
                // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
                // barcode image. Force any such pixel to be white:
                if (alpha === 0) {
                    gray = 0xFF;
                }
                else {
                    const pixelR = imageBuffer[i];
                    const pixelG = imageBuffer[i + 1];
                    const pixelB = imageBuffer[i + 2];
                    // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
                    // (306*R) >> 10 is approximately equal to R*0.299, and so on.
                    // 0x200 >> 10 is 0.5, it implements rounding.
                    gray = (306 * pixelR +
                        601 * pixelG +
                        117 * pixelB +
                        0x200) >> 10;
                }
                grayscaleBuffer[j] = 0xFF - gray;
            }
        }
        return grayscaleBuffer;
    }
    getRow(y /*int*/, row) {
        if (y < 0 || y >= this.getHeight()) {
            throw new IllegalArgumentException('Requested row is outside the image: ' + y);
        }
        const width = this.getWidth();
        const start = y * width;
        if (row === null) {
            row = this.buffer.slice(start, start + width);
        }
        else {
            if (row.length < width) {
                row = new Uint8ClampedArray(width);
            }
            // The underlying raster of image consists of bytes with the luminance values
            // TODO: can avoid set/slice?
            row.set(this.buffer.slice(start, start + width));
        }
        return row;
    }
    getMatrix() {
        return this.buffer;
    }
    isCropSupported() {
        return true;
    }
    crop(left /*int*/, top /*int*/, width /*int*/, height /*int*/) {
        super.crop(left, top, width, height);
        return this;
    }
    /**
     * This is always true, since the image is a gray-scale image.
     *
     * @return true
     */
    isRotateSupported() {
        return true;
    }
    rotateCounterClockwise() {
        this.rotate(-90);
        return this;
    }
    rotateCounterClockwise45() {
        this.rotate(-45);
        return this;
    }
    getTempCanvasElement() {
        if (null === this.tempCanvasElement) {
            const tempCanvasElement = this.canvas.ownerDocument.createElement('canvas');
            tempCanvasElement.width = this.canvas.width;
            tempCanvasElement.height = this.canvas.height;
            this.tempCanvasElement = tempCanvasElement;
        }
        return this.tempCanvasElement;
    }
    rotate(angle) {
        const tempCanvasElement = this.getTempCanvasElement();
        const tempContext = tempCanvasElement.getContext('2d');
        const angleRadians = angle * HTMLCanvasElementLuminanceSource.DEGREE_TO_RADIANS;
        // Calculate and set new dimensions for temp canvas
        const width = this.canvas.width;
        const height = this.canvas.height;
        const newWidth = Math.ceil(Math.abs(Math.cos(angleRadians)) * width + Math.abs(Math.sin(angleRadians)) * height);
        const newHeight = Math.ceil(Math.abs(Math.sin(angleRadians)) * width + Math.abs(Math.cos(angleRadians)) * height);
        tempCanvasElement.width = newWidth;
        tempCanvasElement.height = newHeight;
        // Draw at center of temp canvas to prevent clipping of image data
        tempContext.translate(newWidth / 2, newHeight / 2);
        tempContext.rotate(angleRadians);
        tempContext.drawImage(this.canvas, width / -2, height / -2);
        this.buffer = HTMLCanvasElementLuminanceSource.makeBufferFromCanvasImageData(tempCanvasElement);
        return this;
    }
    invert() {
        return new InvertedLuminanceSource(this);
    }
}
HTMLCanvasElementLuminanceSource.DEGREE_TO_RADIANS = Math.PI / 180;
HTMLCanvasElementLuminanceSource.FRAME_INDEX = true;
