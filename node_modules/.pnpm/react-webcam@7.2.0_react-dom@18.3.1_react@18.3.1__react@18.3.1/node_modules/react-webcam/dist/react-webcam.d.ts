import * as React from "react";
interface ScreenshotDimensions {
    width: number;
    height: number;
}
interface ChildrenProps {
    getScreenshot: (screenshotDimensions?: ScreenshotDimensions) => string | null;
}
export declare type WebcamProps = Omit<React.HTMLProps<HTMLVideoElement>, "ref"> & {
    audio: boolean;
    audioConstraints?: MediaStreamConstraints["audio"];
    disablePictureInPicture: boolean;
    forceScreenshotSourceSize: boolean;
    imageSmoothing: boolean;
    mirrored: boolean;
    minScreenshotHeight?: number;
    minScreenshotWidth?: number;
    onUserMedia: (stream: MediaStream) => void;
    onUserMediaError: (error: string | DOMException) => void;
    screenshotFormat: "image/webp" | "image/png" | "image/jpeg";
    screenshotQuality: number;
    videoConstraints?: MediaStreamConstraints["video"];
    children?: (childrenProps: ChildrenProps) => JSX.Element;
};
interface WebcamState {
    hasUserMedia: boolean;
    src?: string;
}
export default class Webcam extends React.Component<WebcamProps, WebcamState> {
    static defaultProps: {
        audio: boolean;
        disablePictureInPicture: boolean;
        forceScreenshotSourceSize: boolean;
        imageSmoothing: boolean;
        mirrored: boolean;
        onUserMedia: () => undefined;
        onUserMediaError: () => undefined;
        screenshotFormat: string;
        screenshotQuality: number;
    };
    private canvas;
    private ctx;
    private requestUserMediaId;
    private unmounted;
    stream: MediaStream | null;
    video: HTMLVideoElement | null;
    constructor(props: WebcamProps);
    componentDidMount(): void;
    componentDidUpdate(nextProps: WebcamProps): void;
    componentWillUnmount(): void;
    private static stopMediaStream;
    private stopAndCleanup;
    getScreenshot(screenshotDimensions?: ScreenshotDimensions): string | null;
    getCanvas(screenshotDimensions?: ScreenshotDimensions): HTMLCanvasElement | null;
    private requestUserMedia;
    private handleUserMedia;
    render(): JSX.Element;
}
export {};
