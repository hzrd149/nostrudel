import EncodeHintType from '../core/EncodeHintType';
/**
 * @deprecated Moving to @zxing/browser
 */
declare abstract class BrowserSvgCodeWriter {
    /**
     * Default quiet zone in pixels.
     */
    private static readonly QUIET_ZONE_SIZE;
    /**
     * SVG markup NameSpace
     */
    private static readonly SVG_NS;
    /**
     * A HTML container element for the image.
     */
    private containerElement;
    /**
     * Constructs. 😉
     */
    constructor(containerElement: string | HTMLElement);
    /**
     * Writes the QR code to a SVG and renders it in the container.
     */
    write(contents: string, width: number, height: number, hints?: Map<EncodeHintType, any>): SVGSVGElement;
    /**
     * Encodes the content to a Barcode type.
     */
    private encode;
    /**
     * Renders the SVG in the container.
     *
     * @note the input matrix uses 0 == white, 1 == black. The output matrix uses 0 == black, 255 == white (i.e. an 8 bit greyscale bitmap).
     */
    private renderResult;
    /**
     * Creates a SVG element.
     */
    protected createSVGElement(w: number, h: number): SVGSVGElement;
    /**
     * Creates a SVG rect.
     */
    protected createSvgPathPlaceholderElement(w: number, h: number): SVGPathElement;
    /**
     * Creates a SVG rect.
     */
    protected createSvgRectElement(x: number, y: number, w: number, h: number): SVGRectElement;
}
export { BrowserSvgCodeWriter };
