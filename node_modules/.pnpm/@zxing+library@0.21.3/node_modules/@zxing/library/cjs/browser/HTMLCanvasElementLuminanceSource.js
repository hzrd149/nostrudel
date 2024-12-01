"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLCanvasElementLuminanceSource = void 0;
var InvertedLuminanceSource_1 = require("../core/InvertedLuminanceSource");
var LuminanceSource_1 = require("../core/LuminanceSource");
var IllegalArgumentException_1 = require("../core/IllegalArgumentException");
/**
 * @deprecated Moving to @zxing/browser
 */
var HTMLCanvasElementLuminanceSource = /** @class */ (function (_super) {
    __extends(HTMLCanvasElementLuminanceSource, _super);
    function HTMLCanvasElementLuminanceSource(canvas, doAutoInvert) {
        if (doAutoInvert === void 0) { doAutoInvert = false; }
        var _this = _super.call(this, canvas.width, canvas.height) || this;
        _this.canvas = canvas;
        _this.tempCanvasElement = null;
        _this.buffer = HTMLCanvasElementLuminanceSource.makeBufferFromCanvasImageData(canvas, doAutoInvert);
        return _this;
    }
    HTMLCanvasElementLuminanceSource.makeBufferFromCanvasImageData = function (canvas, doAutoInvert) {
        if (doAutoInvert === void 0) { doAutoInvert = false; }
        var imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        return HTMLCanvasElementLuminanceSource.toGrayscaleBuffer(imageData.data, canvas.width, canvas.height, doAutoInvert);
    };
    HTMLCanvasElementLuminanceSource.toGrayscaleBuffer = function (imageBuffer, width, height, doAutoInvert) {
        if (doAutoInvert === void 0) { doAutoInvert = false; }
        var grayscaleBuffer = new Uint8ClampedArray(width * height);
        HTMLCanvasElementLuminanceSource.FRAME_INDEX = !HTMLCanvasElementLuminanceSource.FRAME_INDEX;
        if (HTMLCanvasElementLuminanceSource.FRAME_INDEX || !doAutoInvert) {
            for (var i = 0, j = 0, length_1 = imageBuffer.length; i < length_1; i += 4, j++) {
                var gray = void 0;
                var alpha = imageBuffer[i + 3];
                // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
                // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
                // barcode image. Force any such pixel to be white:
                if (alpha === 0) {
                    gray = 0xFF;
                }
                else {
                    var pixelR = imageBuffer[i];
                    var pixelG = imageBuffer[i + 1];
                    var pixelB = imageBuffer[i + 2];
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
            for (var i = 0, j = 0, length_2 = imageBuffer.length; i < length_2; i += 4, j++) {
                var gray = void 0;
                var alpha = imageBuffer[i + 3];
                // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
                // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
                // barcode image. Force any such pixel to be white:
                if (alpha === 0) {
                    gray = 0xFF;
                }
                else {
                    var pixelR = imageBuffer[i];
                    var pixelG = imageBuffer[i + 1];
                    var pixelB = imageBuffer[i + 2];
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
    };
    HTMLCanvasElementLuminanceSource.prototype.getRow = function (y /*int*/, row) {
        if (y < 0 || y >= this.getHeight()) {
            throw new IllegalArgumentException_1.default('Requested row is outside the image: ' + y);
        }
        var width = this.getWidth();
        var start = y * width;
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
    };
    HTMLCanvasElementLuminanceSource.prototype.getMatrix = function () {
        return this.buffer;
    };
    HTMLCanvasElementLuminanceSource.prototype.isCropSupported = function () {
        return true;
    };
    HTMLCanvasElementLuminanceSource.prototype.crop = function (left /*int*/, top /*int*/, width /*int*/, height /*int*/) {
        _super.prototype.crop.call(this, left, top, width, height);
        return this;
    };
    /**
     * This is always true, since the image is a gray-scale image.
     *
     * @return true
     */
    HTMLCanvasElementLuminanceSource.prototype.isRotateSupported = function () {
        return true;
    };
    HTMLCanvasElementLuminanceSource.prototype.rotateCounterClockwise = function () {
        this.rotate(-90);
        return this;
    };
    HTMLCanvasElementLuminanceSource.prototype.rotateCounterClockwise45 = function () {
        this.rotate(-45);
        return this;
    };
    HTMLCanvasElementLuminanceSource.prototype.getTempCanvasElement = function () {
        if (null === this.tempCanvasElement) {
            var tempCanvasElement = this.canvas.ownerDocument.createElement('canvas');
            tempCanvasElement.width = this.canvas.width;
            tempCanvasElement.height = this.canvas.height;
            this.tempCanvasElement = tempCanvasElement;
        }
        return this.tempCanvasElement;
    };
    HTMLCanvasElementLuminanceSource.prototype.rotate = function (angle) {
        var tempCanvasElement = this.getTempCanvasElement();
        var tempContext = tempCanvasElement.getContext('2d');
        var angleRadians = angle * HTMLCanvasElementLuminanceSource.DEGREE_TO_RADIANS;
        // Calculate and set new dimensions for temp canvas
        var width = this.canvas.width;
        var height = this.canvas.height;
        var newWidth = Math.ceil(Math.abs(Math.cos(angleRadians)) * width + Math.abs(Math.sin(angleRadians)) * height);
        var newHeight = Math.ceil(Math.abs(Math.sin(angleRadians)) * width + Math.abs(Math.cos(angleRadians)) * height);
        tempCanvasElement.width = newWidth;
        tempCanvasElement.height = newHeight;
        // Draw at center of temp canvas to prevent clipping of image data
        tempContext.translate(newWidth / 2, newHeight / 2);
        tempContext.rotate(angleRadians);
        tempContext.drawImage(this.canvas, width / -2, height / -2);
        this.buffer = HTMLCanvasElementLuminanceSource.makeBufferFromCanvasImageData(tempCanvasElement);
        return this;
    };
    HTMLCanvasElementLuminanceSource.prototype.invert = function () {
        return new InvertedLuminanceSource_1.default(this);
    };
    HTMLCanvasElementLuminanceSource.DEGREE_TO_RADIANS = Math.PI / 180;
    HTMLCanvasElementLuminanceSource.FRAME_INDEX = true;
    return HTMLCanvasElementLuminanceSource;
}(LuminanceSource_1.default));
exports.HTMLCanvasElementLuminanceSource = HTMLCanvasElementLuminanceSource;
