import EncodeHintType from '../core/EncodeHintType';
/**
 * @deprecated Moving to @zxing/browser
 */
declare class BrowserQRCodeSvgWriter {
    private static readonly QUIET_ZONE_SIZE;
    /**
     * SVG markup NameSpace
     */
    private static readonly SVG_NS;
    /**
     * Writes and renders a QRCode SVG element.
     *
     * @param contents
     * @param width
     * @param height
     * @param hints
     */
    write(contents: string, width: number, height: number, hints?: Map<EncodeHintType, any>): SVGSVGElement;
    /**
     * Renders the result and then appends it to the DOM.
     */
    writeToDom(containerElement: string | HTMLElement, contents: string, width: number, height: number, hints?: Map<EncodeHintType, any>): void;
    /**
     * Note that the input matrix uses 0 == white, 1 == black.
     * The output matrix uses 0 == black, 255 == white (i.e. an 8 bit greyscale bitmap).
     */
    private renderResult;
    /**
     * Creates a SVG element.
     *
     * @param w SVG's width attribute
     * @param h SVG's height attribute
     */
    private createSVGElement;
    /**
     * Creates a SVG rect element.
     *
     * @param x Element's x coordinate
     * @param y Element's y coordinate
     * @param w Element's width attribute
     * @param h Element's height attribute
     */
    private createSvgRectElement;
}
export { BrowserQRCodeSvgWriter };
