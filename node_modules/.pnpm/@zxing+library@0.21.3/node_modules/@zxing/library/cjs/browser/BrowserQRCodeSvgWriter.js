"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserQRCodeSvgWriter = void 0;
var EncodeHintType_1 = require("../core/EncodeHintType");
var Encoder_1 = require("../core/qrcode/encoder/Encoder");
var ErrorCorrectionLevel_1 = require("../core/qrcode/decoder/ErrorCorrectionLevel");
var IllegalArgumentException_1 = require("../core/IllegalArgumentException");
var IllegalStateException_1 = require("../core/IllegalStateException");
/**
 * @deprecated Moving to @zxing/browser
 */
var BrowserQRCodeSvgWriter = /** @class */ (function () {
    function BrowserQRCodeSvgWriter() {
    }
    /**
     * Writes and renders a QRCode SVG element.
     *
     * @param contents
     * @param width
     * @param height
     * @param hints
     */
    BrowserQRCodeSvgWriter.prototype.write = function (contents, width, height, hints) {
        if (hints === void 0) { hints = null; }
        if (contents.length === 0) {
            throw new IllegalArgumentException_1.default('Found empty contents');
        }
        // if (format != BarcodeFormat.QR_CODE) {
        //   throw new IllegalArgumentException("Can only encode QR_CODE, but got " + format)
        // }
        if (width < 0 || height < 0) {
            throw new IllegalArgumentException_1.default('Requested dimensions are too small: ' + width + 'x' + height);
        }
        var errorCorrectionLevel = ErrorCorrectionLevel_1.default.L;
        var quietZone = BrowserQRCodeSvgWriter.QUIET_ZONE_SIZE;
        if (hints !== null) {
            if (undefined !== hints.get(EncodeHintType_1.default.ERROR_CORRECTION)) {
                errorCorrectionLevel = ErrorCorrectionLevel_1.default.fromString(hints.get(EncodeHintType_1.default.ERROR_CORRECTION).toString());
            }
            if (undefined !== hints.get(EncodeHintType_1.default.MARGIN)) {
                quietZone = Number.parseInt(hints.get(EncodeHintType_1.default.MARGIN).toString(), 10);
            }
        }
        var code = Encoder_1.default.encode(contents, errorCorrectionLevel, hints);
        return this.renderResult(code, width, height, quietZone);
    };
    /**
     * Renders the result and then appends it to the DOM.
     */
    BrowserQRCodeSvgWriter.prototype.writeToDom = function (containerElement, contents, width, height, hints) {
        if (hints === void 0) { hints = null; }
        if (typeof containerElement === 'string') {
            containerElement = document.querySelector(containerElement);
        }
        var svgElement = this.write(contents, width, height, hints);
        if (containerElement)
            containerElement.appendChild(svgElement);
    };
    /**
     * Note that the input matrix uses 0 == white, 1 == black.
     * The output matrix uses 0 == black, 255 == white (i.e. an 8 bit greyscale bitmap).
     */
    BrowserQRCodeSvgWriter.prototype.renderResult = function (code, width /*int*/, height /*int*/, quietZone /*int*/) {
        var input = code.getMatrix();
        if (input === null) {
            throw new IllegalStateException_1.default();
        }
        var inputWidth = input.getWidth();
        var inputHeight = input.getHeight();
        var qrWidth = inputWidth + (quietZone * 2);
        var qrHeight = inputHeight + (quietZone * 2);
        var outputWidth = Math.max(width, qrWidth);
        var outputHeight = Math.max(height, qrHeight);
        var multiple = Math.min(Math.floor(outputWidth / qrWidth), Math.floor(outputHeight / qrHeight));
        // Padding includes both the quiet zone and the extra white pixels to accommodate the requested
        // dimensions. For example, if input is 25x25 the QR will be 33x33 including the quiet zone.
        // If the requested size is 200x160, the multiple will be 4, for a QR of 132x132. These will
        // handle all the padding from 100x100 (the actual QR) up to 200x160.
        var leftPadding = Math.floor((outputWidth - (inputWidth * multiple)) / 2);
        var topPadding = Math.floor((outputHeight - (inputHeight * multiple)) / 2);
        var svgElement = this.createSVGElement(outputWidth, outputHeight);
        for (var inputY = 0, outputY = topPadding; inputY < inputHeight; inputY++, outputY += multiple) {
            // Write the contents of this row of the barcode
            for (var inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
                if (input.get(inputX, inputY) === 1) {
                    var svgRectElement = this.createSvgRectElement(outputX, outputY, multiple, multiple);
                    svgElement.appendChild(svgRectElement);
                }
            }
        }
        return svgElement;
    };
    /**
     * Creates a SVG element.
     *
     * @param w SVG's width attribute
     * @param h SVG's height attribute
     */
    BrowserQRCodeSvgWriter.prototype.createSVGElement = function (w, h) {
        var svgElement = document.createElementNS(BrowserQRCodeSvgWriter.SVG_NS, 'svg');
        svgElement.setAttributeNS(null, 'height', w.toString());
        svgElement.setAttributeNS(null, 'width', h.toString());
        return svgElement;
    };
    /**
     * Creates a SVG rect element.
     *
     * @param x Element's x coordinate
     * @param y Element's y coordinate
     * @param w Element's width attribute
     * @param h Element's height attribute
     */
    BrowserQRCodeSvgWriter.prototype.createSvgRectElement = function (x, y, w, h) {
        var rect = document.createElementNS(BrowserQRCodeSvgWriter.SVG_NS, 'rect');
        rect.setAttributeNS(null, 'x', x.toString());
        rect.setAttributeNS(null, 'y', y.toString());
        rect.setAttributeNS(null, 'height', w.toString());
        rect.setAttributeNS(null, 'width', h.toString());
        rect.setAttributeNS(null, 'fill', '#000000');
        return rect;
    };
    BrowserQRCodeSvgWriter.QUIET_ZONE_SIZE = 4;
    /**
     * SVG markup NameSpace
     */
    BrowserQRCodeSvgWriter.SVG_NS = 'http://www.w3.org/2000/svg';
    return BrowserQRCodeSvgWriter;
}());
exports.BrowserQRCodeSvgWriter = BrowserQRCodeSvgWriter;
