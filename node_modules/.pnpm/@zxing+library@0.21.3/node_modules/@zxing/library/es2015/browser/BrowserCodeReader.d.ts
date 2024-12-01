import BinaryBitmap from '../core/BinaryBitmap';
import DecodeHintType from '../core/DecodeHintType';
import Reader from '../core/Reader';
import Result from '../core/Result';
import { DecodeContinuouslyCallback } from './DecodeContinuouslyCallback';
import { HTMLVisualMediaElement } from './HTMLVisualMediaElement';
import { VideoInputDevice } from './VideoInputDevice';
/**
 * @deprecated Moving to @zxing/browser
 *
 * Base class for browser code reader.
 */
export declare class BrowserCodeReader {
    protected readonly reader: Reader;
    protected timeBetweenScansMillis: number;
    protected _hints?: Map<DecodeHintType, any>;
    /**
     * If navigator is present.
     */
    get hasNavigator(): boolean;
    /**
     * If mediaDevices under navigator is supported.
     */
    get isMediaDevicesSuported(): boolean;
    /**
     * If enumerateDevices under navigator is supported.
     */
    get canEnumerateDevices(): boolean;
    /**
     * This will break the loop.
     */
    private _stopContinuousDecode;
    /**
     * This will break the loop.
     */
    private _stopAsyncDecode;
    /**
     * Delay time between decode attempts made by the scanner.
     */
    protected _timeBetweenDecodingAttempts: number;
    /** Time between two decoding tries in milli seconds. */
    get timeBetweenDecodingAttempts(): number;
    /**
     * Change the time span the decoder waits between two decoding tries.
     *
     * @param {number} millis Time between two decoding tries in milli seconds.
     */
    set timeBetweenDecodingAttempts(millis: number);
    /**
     * The HTML canvas element, used to draw the video or image's frame for decoding.
     */
    protected captureCanvas: HTMLCanvasElement;
    /**
     * The HTML canvas element context.
     */
    protected captureCanvasContext: CanvasRenderingContext2D;
    /**
     * The HTML image element, used as a fallback for the video element when decoding.
     */
    protected imageElement: HTMLImageElement;
    /**
     * Should contain the current registered listener for image loading,
     * used to unregister that listener when needed.
     */
    protected imageLoadedListener: EventListener;
    /**
     * The stream output from camera.
     */
    protected stream: MediaStream;
    /**
     * The HTML video element, used to display the camera stream.
     */
    protected videoElement: HTMLVideoElement;
    /**
     * Should contain the current registered listener for video loaded-metadata,
     * used to unregister that listener when needed.
     */
    protected videoCanPlayListener: EventListener;
    /**
     * Should contain the current registered listener for video play-ended,
     * used to unregister that listener when needed.
     */
    protected videoEndedListener: EventListener;
    /**
     * Should contain the current registered listener for video playing,
     * used to unregister that listener when needed.
     */
    protected videoPlayingEventListener: EventListener;
    /**
     * Sets the hints.
     */
    set hints(hints: Map<DecodeHintType, any>);
    /**
     * Sets the hints.
     */
    get hints(): Map<DecodeHintType, any>;
    /**
     * Creates an instance of BrowserCodeReader.
     * @param {Reader} reader The reader instance to decode the barcode
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent successful decode tries
     *
     * @memberOf BrowserCodeReader
     */
    constructor(reader: Reader, timeBetweenScansMillis?: number, _hints?: Map<DecodeHintType, any>);
    /**
     * Lists all the available video input devices.
     */
    listVideoInputDevices(): Promise<MediaDeviceInfo[]>;
    /**
     * Obtain the list of available devices with type 'videoinput'.
     *
     * @returns {Promise<VideoInputDevice[]>} an array of available video input devices
     *
     * @memberOf BrowserCodeReader
     *
     * @deprecated Use `listVideoInputDevices` instead.
     */
    getVideoInputDevices(): Promise<VideoInputDevice[]>;
    /**
     * Let's you find a device using it's Id.
     */
    findDeviceById(deviceId: string): Promise<MediaDeviceInfo>;
    /**
     * Decodes the barcode from the device specified by deviceId while showing the video in the specified video element.
     *
     * @param deviceId the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param video the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns The decoding result.
     *
     * @memberOf BrowserCodeReader
     *
     * @deprecated Use `decodeOnceFromVideoDevice` instead.
     */
    decodeFromInputVideoDevice(deviceId?: string, videoSource?: string | HTMLVideoElement): Promise<Result>;
    /**
     * In one attempt, tries to decode the barcode from the device specified by deviceId while showing the video in the specified video element.
     *
     * @param deviceId the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param video the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeOnceFromVideoDevice(deviceId?: string, videoSource?: string | HTMLVideoElement): Promise<Result>;
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param constraints the media stream constraints to get s valid media stream to decode from
     * @param video the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeOnceFromConstraints(constraints: MediaStreamConstraints, videoSource?: string | HTMLVideoElement): Promise<Result>;
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeOnceFromStream(stream: MediaStream, videoSource?: string | HTMLVideoElement): Promise<Result>;
    /**
     * Continuously decodes the barcode from the device specified by device while showing the video in the specified video element.
     *
     * @param {string|null} [deviceId] the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param {string|HTMLVideoElement|null} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<void>}
     *
     * @memberOf BrowserCodeReader
     *
     * @deprecated Use `decodeFromVideoDevice` instead.
     */
    decodeFromInputVideoDeviceContinuously(deviceId: string | null, videoSource: string | HTMLVideoElement | null, callbackFn: DecodeContinuouslyCallback): Promise<void>;
    /**
     * Continuously tries to decode the barcode from the device specified by device while showing the video in the specified video element.
     *
     * @param {string|null} [deviceId] the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param {string|HTMLVideoElement|null} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<void>}
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromVideoDevice(deviceId: string | null, videoSource: string | HTMLVideoElement | null, callbackFn: DecodeContinuouslyCallback): Promise<void>;
    /**
     * Continuously tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromConstraints(constraints: MediaStreamConstraints, videoSource: string | HTMLVideoElement, callbackFn: DecodeContinuouslyCallback): Promise<void>;
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromStream(stream: MediaStream, videoSource: string | HTMLVideoElement, callbackFn: DecodeContinuouslyCallback): Promise<void>;
    /**
     * Breaks the decoding loop.
     */
    stopAsyncDecode(): void;
    /**
     * Breaks the decoding loop.
     */
    stopContinuousDecode(): void;
    /**
     * Sets the new stream and request a new decoding-with-delay.
     *
     * @param stream The stream to be shown in the video element.
     * @param decodeFn A callback for the decode method.
     */
    protected attachStreamToVideo(stream: MediaStream, videoSource: string | HTMLVideoElement): Promise<HTMLVideoElement>;
    /**
     *
     * @param videoElement
     */
    protected playVideoOnLoadAsync(videoElement: HTMLVideoElement): Promise<void>;
    /**
     * Binds listeners and callbacks to the videoElement.
     *
     * @param element
     * @param callbackFn
     */
    protected playVideoOnLoad(element: HTMLVideoElement, callbackFn: EventListener): void;
    /**
     * Checks if the given video element is currently playing.
     */
    isVideoPlaying(video: HTMLVideoElement): boolean;
    /**
     * Just tries to play the video and logs any errors.
     * The play call is only made is the video is not already playing.
     */
    tryPlayVideo(videoElement: HTMLVideoElement): Promise<void>;
    /**
     * Searches and validates a media element.
     */
    getMediaElement(mediaElementId: string, type: string): HTMLVisualMediaElement;
    /**
     * Decodes the barcode from an image.
     *
     * @param {(string|HTMLImageElement)} [source] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [url]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromImage(source?: string | HTMLImageElement, url?: string): Promise<Result>;
    /**
     * Decodes the barcode from a video.
     *
     * @param {(string|HTMLImageElement)} [source] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [url]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromVideo(source?: string | HTMLVideoElement, url?: string): Promise<Result>;
    /**
     * Decodes continuously the barcode from a video.
     *
     * @param {(string|HTMLImageElement)} [source] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [url]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     *
     * @experimental
     */
    decodeFromVideoContinuously(source: string | HTMLVideoElement | null, url: string | null, callbackFn: DecodeContinuouslyCallback): Promise<void>;
    /**
     * Decodes something from an image HTML element.
     */
    decodeFromImageElement(source: string | HTMLImageElement): Promise<Result>;
    /**
     * Decodes something from an image HTML element.
     */
    decodeFromVideoElement(source: string | HTMLVideoElement): Promise<Result>;
    /**
     * Decodes something from an image HTML element.
     */
    decodeFromVideoElementContinuously(source: string | HTMLVideoElement, callbackFn: DecodeContinuouslyCallback): Promise<void>;
    /**
     * Sets up the video source so it can be decoded when loaded.
     *
     * @param source The video source element.
     */
    private _decodeFromVideoElementSetup;
    /**
     * Decodes an image from a URL.
     */
    decodeFromImageUrl(url?: string): Promise<Result>;
    /**
     * Decodes an image from a URL.
     */
    decodeFromVideoUrl(url: string): Promise<Result>;
    /**
     * Decodes an image from a URL.
     *
     * @experimental
     */
    decodeFromVideoUrlContinuously(url: string, callbackFn: DecodeContinuouslyCallback): Promise<void>;
    private _decodeOnLoadImage;
    private _decodeOnLoadVideo;
    private _decodeOnLoadVideoContinuously;
    isImageLoaded(img: HTMLImageElement): boolean;
    prepareImageElement(imageSource?: HTMLImageElement | string): HTMLImageElement;
    /**
     * Sets a HTMLVideoElement for scanning or creates a new one.
     *
     * @param videoSource The HTMLVideoElement to be set.
     */
    prepareVideoElement(videoSource?: HTMLVideoElement | string): HTMLVideoElement;
    /**
     * Tries to decode from the video input until it finds some value.
     */
    decodeOnce(element: HTMLVisualMediaElement, retryIfNotFound?: boolean, retryIfChecksumOrFormatError?: boolean): Promise<Result>;
    /**
     * Continuously decodes from video input.
     */
    decodeContinuously(element: HTMLVideoElement, callbackFn: DecodeContinuouslyCallback): void;
    /**
     * Gets the BinaryBitmap for ya! (and decodes it)
     */
    decode(element: HTMLVisualMediaElement): Result;
    /**
     * Creates a binaryBitmap based in some image source.
     *
     * @param mediaElement HTML element containing drawable image source.
     */
    createBinaryBitmap(mediaElement: HTMLVisualMediaElement): BinaryBitmap;
    /**
     *
     */
    protected getCaptureCanvasContext(mediaElement?: HTMLVisualMediaElement): CanvasRenderingContext2D;
    /**
     *
     */
    protected getCaptureCanvas(mediaElement?: HTMLVisualMediaElement): HTMLCanvasElement;
    /**
     * Overwriting this allows you to manipulate the next frame in anyway you want before decode.
     */
    drawFrameOnCanvas(srcElement: HTMLVideoElement, dimensions?: {
        sx: number;
        sy: number;
        sWidth: number;
        sHeight: number;
        dx: number;
        dy: number;
        dWidth: number;
        dHeight: number;
    }, canvasElementContext?: CanvasRenderingContext2D): void;
    /**
     * Ovewriting this allows you to manipulate the snapshot image in anyway you want before decode.
     */
    drawImageOnCanvas(srcElement: HTMLImageElement, dimensions?: {
        sx: number;
        sy: number;
        sWidth: number;
        sHeight: number;
        dx: number;
        dy: number;
        dWidth: number;
        dHeight: number;
    }, canvasElementContext?: CanvasRenderingContext2D): void;
    /**
     * Call the encapsulated readers decode
     */
    decodeBitmap(binaryBitmap: BinaryBitmap): Result;
    /**
     * 🖌 Prepares the canvas for capture and scan frames.
     */
    createCaptureCanvas(mediaElement?: HTMLVisualMediaElement): HTMLCanvasElement;
    /**
     * Stops the continuous scan and cleans the stream.
     */
    protected stopStreams(): void;
    /**
     * Resets the code reader to the initial state. Cancels any ongoing barcode scanning from video or camera.
     *
     * @memberOf BrowserCodeReader
     */
    reset(): void;
    private _destroyVideoElement;
    private _destroyImageElement;
    /**
     * Cleans canvas references 🖌
     */
    private _destroyCaptureCanvas;
    /**
     * Defines what the videoElement src will be.
     *
     * @param videoElement
     * @param stream
     */
    addVideoSource(videoElement: HTMLVideoElement, stream: MediaStream): void;
    /**
     * Unbinds a HTML video src property.
     *
     * @param videoElement
     */
    private cleanVideoSource;
}
