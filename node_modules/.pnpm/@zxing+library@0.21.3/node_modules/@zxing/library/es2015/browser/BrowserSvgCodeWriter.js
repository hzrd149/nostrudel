import EncodeHintType from '../core/EncodeHintType';
import Encoder from '../core/qrcode/encoder/Encoder';
import ErrorCorrectionLevel from '../core/qrcode/decoder/ErrorCorrectionLevel';
import IllegalArgumentException from '../core/IllegalArgumentException';
import IllegalStateException from '../core/IllegalStateException';
/**
 * @deprecated Moving to @zxing/browser
 */
class BrowserSvgCodeWriter {
    /**
     * Constructs. 😉
     */
    constructor(containerElement) {
        if (typeof containerElement === 'string') {
            this.containerElement = document.getElementById(containerElement);
        }
        else {
            this.containerElement = containerElement;
        }
    }
    /**
     * Writes the QR code to a SVG and renders it in the container.
     */
    write(contents, width, height, hints = null) {
        if (contents.length === 0) {
            throw new IllegalArgumentException('Found empty contents');
        }
        if (width < 0 || height < 0) {
            throw new IllegalArgumentException('Requested dimensions are too small: ' + width + 'x' + height);
        }
        let quietZone = hints && hints.get(EncodeHintType.MARGIN) !== undefined
            ? Number.parseInt(hints.get(EncodeHintType.MARGIN).toString(), 10)
            : BrowserSvgCodeWriter.QUIET_ZONE_SIZE;
        const code = this.encode(hints, contents);
        return this.renderResult(code, width, height, quietZone);
    }
    /**
     * Encodes the content to a Barcode type.
     */
    encode(hints, contents) {
        let errorCorrectionLevel = ErrorCorrectionLevel.L;
        if (hints && hints.get(EncodeHintType.ERROR_CORRECTION) !== undefined) {
            errorCorrectionLevel = ErrorCorrectionLevel.fromString(hints.get(EncodeHintType.ERROR_CORRECTION).toString());
        }
        const code = Encoder.encode(contents, errorCorrectionLevel, hints);
        return code;
    }
    /**
     * Renders the SVG in the container.
     *
     * @note the input matrix uses 0 == white, 1 == black. The output matrix uses 0 == black, 255 == white (i.e. an 8 bit greyscale bitmap).
     */
    renderResult(code, width /*int*/, height /*int*/, quietZone /*int*/) {
        // if (this.format && format != this.format) {
        //   throw new IllegalArgumentException("Can only encode QR_CODE, but got " + format)
        // }
        const input = code.getMatrix();
        if (input === null) {
            throw new IllegalStateException();
        }
        const inputWidth = input.getWidth();
        const inputHeight = input.getHeight();
        const qrWidth = inputWidth + (quietZone * 2);
        const qrHeight = inputHeight + (quietZone * 2);
        const outputWidth = Math.max(width, qrWidth);
        const outputHeight = Math.max(height, qrHeight);
        const multiple = Math.min(Math.floor(outputWidth / qrWidth), Math.floor(outputHeight / qrHeight));
        // Padding includes both the quiet zone and the extra white pixels to accommodate the requested
        // dimensions. For example, if input is 25x25 the QR will be 33x33 including the quiet zone.
        // If the requested size is 200x160, the multiple will be 4, for a QR of 132x132. These will
        // handle all the padding from 100x100 (the actual QR) up to 200x160.
        const leftPadding = Math.floor((outputWidth - (inputWidth * multiple)) / 2);
        const topPadding = Math.floor((outputHeight - (inputHeight * multiple)) / 2);
        const svgElement = this.createSVGElement(outputWidth, outputHeight);
        const placeholder = this.createSvgPathPlaceholderElement(width, height);
        svgElement.append(placeholder);
        this.containerElement.appendChild(svgElement);
        // 2D loop
        for (let inputY = 0, outputY = topPadding; inputY < inputHeight; inputY++, outputY += multiple) {
            // Write the contents of this row of the barcode
            for (let inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
                if (input.get(inputX, inputY) === 1) {
                    const svgRectElement = this.createSvgRectElement(outputX, outputY, multiple, multiple);
                    svgElement.appendChild(svgRectElement);
                }
            }
        }
        return svgElement;
    }
    /**
     * Creates a SVG element.
     */
    createSVGElement(w, h) {
        const el = document.createElementNS(BrowserSvgCodeWriter.SVG_NS, 'svg');
        el.setAttributeNS(null, 'width', h.toString());
        el.setAttributeNS(null, 'height', w.toString());
        return el;
    }
    /**
     * Creates a SVG rect.
     */
    createSvgPathPlaceholderElement(w, h) {
        const el = document.createElementNS(BrowserSvgCodeWriter.SVG_NS, 'path');
        el.setAttributeNS(null, 'd', `M0 0h${w}v${h}H0z`);
        el.setAttributeNS(null, 'fill', 'none');
        return el;
    }
    /**
     * Creates a SVG rect.
     */
    createSvgRectElement(x, y, w, h) {
        const el = document.createElementNS(BrowserSvgCodeWriter.SVG_NS, 'rect');
        el.setAttributeNS(null, 'x', x.toString());
        el.setAttributeNS(null, 'y', y.toString());
        el.setAttributeNS(null, 'height', w.toString());
        el.setAttributeNS(null, 'width', h.toString());
        el.setAttributeNS(null, 'fill', '#000000');
        return el;
    }
}
/**
 * Default quiet zone in pixels.
 */
BrowserSvgCodeWriter.QUIET_ZONE_SIZE = 4;
/**
 * SVG markup NameSpace
 */
BrowserSvgCodeWriter.SVG_NS = 'http://www.w3.org/2000/svg';
export { BrowserSvgCodeWriter };
