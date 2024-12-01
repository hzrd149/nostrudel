var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import ArgumentException from '../core/ArgumentException';
import BinaryBitmap from '../core/BinaryBitmap';
import ChecksumException from '../core/ChecksumException';
import HybridBinarizer from '../core/common/HybridBinarizer';
import FormatException from '../core/FormatException';
import NotFoundException from '../core/NotFoundException';
import { HTMLCanvasElementLuminanceSource } from './HTMLCanvasElementLuminanceSource';
import { VideoInputDevice } from './VideoInputDevice';
/**
 * @deprecated Moving to @zxing/browser
 *
 * Base class for browser code reader.
 */
export class BrowserCodeReader {
    /**
     * Creates an instance of BrowserCodeReader.
     * @param {Reader} reader The reader instance to decode the barcode
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent successful decode tries
     *
     * @memberOf BrowserCodeReader
     */
    constructor(reader, timeBetweenScansMillis = 500, _hints) {
        this.reader = reader;
        this.timeBetweenScansMillis = timeBetweenScansMillis;
        this._hints = _hints;
        /**
         * This will break the loop.
         */
        this._stopContinuousDecode = false;
        /**
         * This will break the loop.
         */
        this._stopAsyncDecode = false;
        /**
         * Delay time between decode attempts made by the scanner.
         */
        this._timeBetweenDecodingAttempts = 0;
    }
    /**
     * If navigator is present.
     */
    get hasNavigator() {
        return typeof navigator !== 'undefined';
    }
    /**
     * If mediaDevices under navigator is supported.
     */
    get isMediaDevicesSuported() {
        return this.hasNavigator && !!navigator.mediaDevices;
    }
    /**
     * If enumerateDevices under navigator is supported.
     */
    get canEnumerateDevices() {
        return !!(this.isMediaDevicesSuported && navigator.mediaDevices.enumerateDevices);
    }
    /** Time between two decoding tries in milli seconds. */
    get timeBetweenDecodingAttempts() {
        return this._timeBetweenDecodingAttempts;
    }
    /**
     * Change the time span the decoder waits between two decoding tries.
     *
     * @param {number} millis Time between two decoding tries in milli seconds.
     */
    set timeBetweenDecodingAttempts(millis) {
        this._timeBetweenDecodingAttempts = millis < 0 ? 0 : millis;
    }
    /**
     * Sets the hints.
     */
    set hints(hints) {
        this._hints = hints || null;
    }
    /**
     * Sets the hints.
     */
    get hints() {
        return this._hints;
    }
    /**
     * Lists all the available video input devices.
     */
    listVideoInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasNavigator) {
                throw new Error("Can't enumerate devices, navigator is not present.");
            }
            if (!this.canEnumerateDevices) {
                throw new Error("Can't enumerate devices, method not supported.");
            }
            const devices = yield navigator.mediaDevices.enumerateDevices();
            const videoDevices = [];
            for (const device of devices) {
                const kind = device.kind === 'video' ? 'videoinput' : device.kind;
                if (kind !== 'videoinput') {
                    continue;
                }
                const deviceId = device.deviceId || device.id;
                const label = device.label || `Video device ${videoDevices.length + 1}`;
                const groupId = device.groupId;
                const videoDevice = { deviceId, label, kind, groupId };
                videoDevices.push(videoDevice);
            }
            return videoDevices;
        });
    }
    /**
     * Obtain the list of available devices with type 'videoinput'.
     *
     * @returns {Promise<VideoInputDevice[]>} an array of available video input devices
     *
     * @memberOf BrowserCodeReader
     *
     * @deprecated Use `listVideoInputDevices` instead.
     */
    getVideoInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const devices = yield this.listVideoInputDevices();
            return devices.map(d => new VideoInputDevice(d.deviceId, d.label));
        });
    }
    /**
     * Let's you find a device using it's Id.
     */
    findDeviceById(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const devices = yield this.listVideoInputDevices();
            if (!devices) {
                return null;
            }
            return devices.find(x => x.deviceId === deviceId);
        });
    }
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
    decodeFromInputVideoDevice(deviceId, videoSource) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.decodeOnceFromVideoDevice(deviceId, videoSource);
        });
    }
    /**
     * In one attempt, tries to decode the barcode from the device specified by deviceId while showing the video in the specified video element.
     *
     * @param deviceId the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param video the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeOnceFromVideoDevice(deviceId, videoSource) {
        return __awaiter(this, void 0, void 0, function* () {
            this.reset();
            let videoConstraints;
            if (!deviceId) {
                videoConstraints = { facingMode: 'environment' };
            }
            else {
                videoConstraints = { deviceId: { exact: deviceId } };
            }
            const constraints = { video: videoConstraints };
            return yield this.decodeOnceFromConstraints(constraints, videoSource);
        });
    }
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param constraints the media stream constraints to get s valid media stream to decode from
     * @param video the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeOnceFromConstraints(constraints, videoSource) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield navigator.mediaDevices.getUserMedia(constraints);
            return yield this.decodeOnceFromStream(stream, videoSource);
        });
    }
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeOnceFromStream(stream, videoSource) {
        return __awaiter(this, void 0, void 0, function* () {
            this.reset();
            const video = yield this.attachStreamToVideo(stream, videoSource);
            const result = yield this.decodeOnce(video);
            return result;
        });
    }
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
    decodeFromInputVideoDeviceContinuously(deviceId, videoSource, callbackFn) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.decodeFromVideoDevice(deviceId, videoSource, callbackFn);
        });
    }
    /**
     * Continuously tries to decode the barcode from the device specified by device while showing the video in the specified video element.
     *
     * @param {string|null} [deviceId] the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param {string|HTMLVideoElement|null} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<void>}
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromVideoDevice(deviceId, videoSource, callbackFn) {
        return __awaiter(this, void 0, void 0, function* () {
            let videoConstraints;
            if (!deviceId) {
                videoConstraints = { facingMode: 'environment' };
            }
            else {
                videoConstraints = { deviceId: { exact: deviceId } };
            }
            const constraints = { video: videoConstraints };
            return yield this.decodeFromConstraints(constraints, videoSource, callbackFn);
        });
    }
    /**
     * Continuously tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromConstraints(constraints, videoSource, callbackFn) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield navigator.mediaDevices.getUserMedia(constraints);
            return yield this.decodeFromStream(stream, videoSource, callbackFn);
        });
    }
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromStream(stream, videoSource, callbackFn) {
        return __awaiter(this, void 0, void 0, function* () {
            this.reset();
            const video = yield this.attachStreamToVideo(stream, videoSource);
            return yield this.decodeContinuously(video, callbackFn);
        });
    }
    /**
     * Breaks the decoding loop.
     */
    stopAsyncDecode() {
        this._stopAsyncDecode = true;
    }
    /**
     * Breaks the decoding loop.
     */
    stopContinuousDecode() {
        this._stopContinuousDecode = true;
    }
    /**
     * Sets the new stream and request a new decoding-with-delay.
     *
     * @param stream The stream to be shown in the video element.
     * @param decodeFn A callback for the decode method.
     */
    attachStreamToVideo(stream, videoSource) {
        return __awaiter(this, void 0, void 0, function* () {
            const videoElement = this.prepareVideoElement(videoSource);
            this.addVideoSource(videoElement, stream);
            this.videoElement = videoElement;
            this.stream = stream;
            yield this.playVideoOnLoadAsync(videoElement);
            return videoElement;
        });
    }
    /**
     *
     * @param videoElement
     */
    playVideoOnLoadAsync(videoElement) {
        return new Promise((resolve, reject) => this.playVideoOnLoad(videoElement, () => resolve()));
    }
    /**
     * Binds listeners and callbacks to the videoElement.
     *
     * @param element
     * @param callbackFn
     */
    playVideoOnLoad(element, callbackFn) {
        this.videoEndedListener = () => this.stopStreams();
        this.videoCanPlayListener = () => this.tryPlayVideo(element);
        element.addEventListener('ended', this.videoEndedListener);
        element.addEventListener('canplay', this.videoCanPlayListener);
        element.addEventListener('playing', callbackFn);
        // if canplay was already fired, we won't know when to play, so just give it a try
        this.tryPlayVideo(element);
    }
    /**
     * Checks if the given video element is currently playing.
     */
    isVideoPlaying(video) {
        return (video.currentTime > 0 &&
            !video.paused &&
            !video.ended &&
            video.readyState > 2);
    }
    /**
     * Just tries to play the video and logs any errors.
     * The play call is only made is the video is not already playing.
     */
    tryPlayVideo(videoElement) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isVideoPlaying(videoElement)) {
                console.warn('Trying to play video that is already playing.');
                return;
            }
            try {
                yield videoElement.play();
            }
            catch (_a) {
                console.warn('It was not possible to play the video.');
            }
        });
    }
    /**
     * Searches and validates a media element.
     */
    getMediaElement(mediaElementId, type) {
        const mediaElement = document.getElementById(mediaElementId);
        if (!mediaElement) {
            throw new ArgumentException(`element with id '${mediaElementId}' not found`);
        }
        if (mediaElement.nodeName.toLowerCase() !== type.toLowerCase()) {
            throw new ArgumentException(`element with id '${mediaElementId}' must be an ${type} element`);
        }
        return mediaElement;
    }
    /**
     * Decodes the barcode from an image.
     *
     * @param {(string|HTMLImageElement)} [source] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [url]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromImage(source, url) {
        if (!source && !url) {
            throw new ArgumentException('either imageElement with a src set or an url must be provided');
        }
        if (url && !source) {
            return this.decodeFromImageUrl(url);
        }
        return this.decodeFromImageElement(source);
    }
    /**
     * Decodes the barcode from a video.
     *
     * @param {(string|HTMLImageElement)} [source] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [url]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromVideo(source, url) {
        if (!source && !url) {
            throw new ArgumentException('Either an element with a src set or an URL must be provided');
        }
        if (url && !source) {
            return this.decodeFromVideoUrl(url);
        }
        return this.decodeFromVideoElement(source);
    }
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
    decodeFromVideoContinuously(source, url, callbackFn) {
        if (undefined === source && undefined === url) {
            throw new ArgumentException('Either an element with a src set or an URL must be provided');
        }
        if (url && !source) {
            return this.decodeFromVideoUrlContinuously(url, callbackFn);
        }
        return this.decodeFromVideoElementContinuously(source, callbackFn);
    }
    /**
     * Decodes something from an image HTML element.
     */
    decodeFromImageElement(source) {
        if (!source) {
            throw new ArgumentException('An image element must be provided.');
        }
        this.reset();
        const element = this.prepareImageElement(source);
        this.imageElement = element;
        let task;
        if (this.isImageLoaded(element)) {
            task = this.decodeOnce(element, false, true);
        }
        else {
            task = this._decodeOnLoadImage(element);
        }
        return task;
    }
    /**
     * Decodes something from an image HTML element.
     */
    decodeFromVideoElement(source) {
        const element = this._decodeFromVideoElementSetup(source);
        return this._decodeOnLoadVideo(element);
    }
    /**
     * Decodes something from an image HTML element.
     */
    decodeFromVideoElementContinuously(source, callbackFn) {
        const element = this._decodeFromVideoElementSetup(source);
        return this._decodeOnLoadVideoContinuously(element, callbackFn);
    }
    /**
     * Sets up the video source so it can be decoded when loaded.
     *
     * @param source The video source element.
     */
    _decodeFromVideoElementSetup(source) {
        if (!source) {
            throw new ArgumentException('A video element must be provided.');
        }
        this.reset();
        const element = this.prepareVideoElement(source);
        // defines the video element before starts decoding
        this.videoElement = element;
        return element;
    }
    /**
     * Decodes an image from a URL.
     */
    decodeFromImageUrl(url) {
        if (!url) {
            throw new ArgumentException('An URL must be provided.');
        }
        this.reset();
        const element = this.prepareImageElement();
        this.imageElement = element;
        const decodeTask = this._decodeOnLoadImage(element);
        element.src = url;
        return decodeTask;
    }
    /**
     * Decodes an image from a URL.
     */
    decodeFromVideoUrl(url) {
        if (!url) {
            throw new ArgumentException('An URL must be provided.');
        }
        this.reset();
        // creates a new element
        const element = this.prepareVideoElement();
        const decodeTask = this.decodeFromVideoElement(element);
        element.src = url;
        return decodeTask;
    }
    /**
     * Decodes an image from a URL.
     *
     * @experimental
     */
    decodeFromVideoUrlContinuously(url, callbackFn) {
        if (!url) {
            throw new ArgumentException('An URL must be provided.');
        }
        this.reset();
        // creates a new element
        const element = this.prepareVideoElement();
        const decodeTask = this.decodeFromVideoElementContinuously(element, callbackFn);
        element.src = url;
        return decodeTask;
    }
    _decodeOnLoadImage(element) {
        return new Promise((resolve, reject) => {
            this.imageLoadedListener = () => this.decodeOnce(element, false, true).then(resolve, reject);
            element.addEventListener('load', this.imageLoadedListener);
        });
    }
    _decodeOnLoadVideo(videoElement) {
        return __awaiter(this, void 0, void 0, function* () {
            // plays the video
            yield this.playVideoOnLoadAsync(videoElement);
            // starts decoding after played the video
            return yield this.decodeOnce(videoElement);
        });
    }
    _decodeOnLoadVideoContinuously(videoElement, callbackFn) {
        return __awaiter(this, void 0, void 0, function* () {
            // plays the video
            yield this.playVideoOnLoadAsync(videoElement);
            // starts decoding after played the video
            this.decodeContinuously(videoElement, callbackFn);
        });
    }
    isImageLoaded(img) {
        // During the onload event, IE correctly identifies any images that
        // weren’t downloaded as not complete. Others should too. Gecko-based
        // browsers act like NS4 in that they report this incorrectly.
        if (!img.complete) {
            return false;
        }
        // However, they do have two very useful properties: naturalWidth and
        // naturalHeight. These give the true size of the image. If it failed
        // to load, either of these should be zero.
        if (img.naturalWidth === 0) {
            return false;
        }
        // No other way of checking: assume it’s ok.
        return true;
    }
    prepareImageElement(imageSource) {
        let imageElement;
        if (typeof imageSource === 'undefined') {
            imageElement = document.createElement('img');
            imageElement.width = 200;
            imageElement.height = 200;
        }
        if (typeof imageSource === 'string') {
            imageElement = this.getMediaElement(imageSource, 'img');
        }
        if (imageSource instanceof HTMLImageElement) {
            imageElement = imageSource;
        }
        return imageElement;
    }
    /**
     * Sets a HTMLVideoElement for scanning or creates a new one.
     *
     * @param videoSource The HTMLVideoElement to be set.
     */
    prepareVideoElement(videoSource) {
        let videoElement;
        if (!videoSource && typeof document !== 'undefined') {
            videoElement = document.createElement('video');
            videoElement.width = 200;
            videoElement.height = 200;
        }
        if (typeof videoSource === 'string') {
            videoElement = (this.getMediaElement(videoSource, 'video'));
        }
        if (videoSource instanceof HTMLVideoElement) {
            videoElement = videoSource;
        }
        // Needed for iOS 11
        videoElement.setAttribute('autoplay', 'true');
        videoElement.setAttribute('muted', 'true');
        videoElement.setAttribute('playsinline', 'true');
        return videoElement;
    }
    /**
     * Tries to decode from the video input until it finds some value.
     */
    decodeOnce(element, retryIfNotFound = true, retryIfChecksumOrFormatError = true) {
        this._stopAsyncDecode = false;
        const loop = (resolve, reject) => {
            if (this._stopAsyncDecode) {
                reject(new NotFoundException('Video stream has ended before any code could be detected.'));
                this._stopAsyncDecode = undefined;
                return;
            }
            try {
                const result = this.decode(element);
                resolve(result);
            }
            catch (e) {
                const ifNotFound = retryIfNotFound && e instanceof NotFoundException;
                const isChecksumOrFormatError = e instanceof ChecksumException || e instanceof FormatException;
                const ifChecksumOrFormat = isChecksumOrFormatError && retryIfChecksumOrFormatError;
                if (ifNotFound || ifChecksumOrFormat) {
                    // trying again
                    return setTimeout(loop, this._timeBetweenDecodingAttempts, resolve, reject);
                }
                reject(e);
            }
        };
        return new Promise((resolve, reject) => loop(resolve, reject));
    }
    /**
     * Continuously decodes from video input.
     */
    decodeContinuously(element, callbackFn) {
        this._stopContinuousDecode = false;
        const loop = () => {
            if (this._stopContinuousDecode) {
                this._stopContinuousDecode = undefined;
                return;
            }
            try {
                const result = this.decode(element);
                callbackFn(result, null);
                setTimeout(loop, this.timeBetweenScansMillis);
            }
            catch (e) {
                callbackFn(null, e);
                const isChecksumOrFormatError = e instanceof ChecksumException || e instanceof FormatException;
                const isNotFound = e instanceof NotFoundException;
                if (isChecksumOrFormatError || isNotFound) {
                    // trying again
                    setTimeout(loop, this._timeBetweenDecodingAttempts);
                }
            }
        };
        loop();
    }
    /**
     * Gets the BinaryBitmap for ya! (and decodes it)
     */
    decode(element) {
        // get binary bitmap for decode function
        const binaryBitmap = this.createBinaryBitmap(element);
        return this.decodeBitmap(binaryBitmap);
    }
    /**
     * Creates a binaryBitmap based in some image source.
     *
     * @param mediaElement HTML element containing drawable image source.
     */
    createBinaryBitmap(mediaElement) {
        const ctx = this.getCaptureCanvasContext(mediaElement);
        // doing a scan with inverted colors on the second scan should only happen for video elements
        let doAutoInvert = false;
        if (mediaElement instanceof HTMLVideoElement) {
            this.drawFrameOnCanvas(mediaElement);
            doAutoInvert = true;
        }
        else {
            this.drawImageOnCanvas(mediaElement);
        }
        const canvas = this.getCaptureCanvas(mediaElement);
        const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas, doAutoInvert);
        const hybridBinarizer = new HybridBinarizer(luminanceSource);
        return new BinaryBitmap(hybridBinarizer);
    }
    /**
     *
     */
    getCaptureCanvasContext(mediaElement) {
        if (!this.captureCanvasContext) {
            const elem = this.getCaptureCanvas(mediaElement);
            let ctx;
            try {
                ctx = elem.getContext('2d', { willReadFrequently: true });
            }
            catch (e) {
                ctx = elem.getContext('2d');
            }
            this.captureCanvasContext = ctx;
        }
        return this.captureCanvasContext;
    }
    /**
     *
     */
    getCaptureCanvas(mediaElement) {
        if (!this.captureCanvas) {
            const elem = this.createCaptureCanvas(mediaElement);
            this.captureCanvas = elem;
        }
        return this.captureCanvas;
    }
    /**
     * Overwriting this allows you to manipulate the next frame in anyway you want before decode.
     */
    drawFrameOnCanvas(srcElement, dimensions = {
        sx: 0,
        sy: 0,
        sWidth: srcElement.videoWidth,
        sHeight: srcElement.videoHeight,
        dx: 0,
        dy: 0,
        dWidth: srcElement.videoWidth,
        dHeight: srcElement.videoHeight,
    }, canvasElementContext = this.captureCanvasContext) {
        canvasElementContext.drawImage(srcElement, dimensions.sx, dimensions.sy, dimensions.sWidth, dimensions.sHeight, dimensions.dx, dimensions.dy, dimensions.dWidth, dimensions.dHeight);
    }
    /**
     * Ovewriting this allows you to manipulate the snapshot image in anyway you want before decode.
     */
    drawImageOnCanvas(srcElement, dimensions = {
        sx: 0,
        sy: 0,
        sWidth: srcElement.naturalWidth,
        sHeight: srcElement.naturalHeight,
        dx: 0,
        dy: 0,
        dWidth: srcElement.naturalWidth,
        dHeight: srcElement.naturalHeight,
    }, canvasElementContext = this.captureCanvasContext) {
        canvasElementContext.drawImage(srcElement, dimensions.sx, dimensions.sy, dimensions.sWidth, dimensions.sHeight, dimensions.dx, dimensions.dy, dimensions.dWidth, dimensions.dHeight);
    }
    /**
     * Call the encapsulated readers decode
     */
    decodeBitmap(binaryBitmap) {
        return this.reader.decode(binaryBitmap, this._hints);
    }
    /**
     * 🖌 Prepares the canvas for capture and scan frames.
     */
    createCaptureCanvas(mediaElement) {
        if (typeof document === 'undefined') {
            this._destroyCaptureCanvas();
            return null;
        }
        const canvasElement = document.createElement('canvas');
        let width;
        let height;
        if (typeof mediaElement !== 'undefined') {
            if (mediaElement instanceof HTMLVideoElement) {
                width = mediaElement.videoWidth;
                height = mediaElement.videoHeight;
            }
            else if (mediaElement instanceof HTMLImageElement) {
                width = mediaElement.naturalWidth || mediaElement.width;
                height = mediaElement.naturalHeight || mediaElement.height;
            }
        }
        canvasElement.style.width = width + 'px';
        canvasElement.style.height = height + 'px';
        canvasElement.width = width;
        canvasElement.height = height;
        return canvasElement;
    }
    /**
     * Stops the continuous scan and cleans the stream.
     */
    stopStreams() {
        if (this.stream) {
            this.stream.getVideoTracks().forEach(t => t.stop());
            this.stream = undefined;
        }
        if (this._stopAsyncDecode === false) {
            this.stopAsyncDecode();
        }
        if (this._stopContinuousDecode === false) {
            this.stopContinuousDecode();
        }
    }
    /**
     * Resets the code reader to the initial state. Cancels any ongoing barcode scanning from video or camera.
     *
     * @memberOf BrowserCodeReader
     */
    reset() {
        // stops the camera, preview and scan 🔴
        this.stopStreams();
        // clean and forget about HTML elements
        this._destroyVideoElement();
        this._destroyImageElement();
        this._destroyCaptureCanvas();
    }
    _destroyVideoElement() {
        if (!this.videoElement) {
            return;
        }
        // first gives freedon to the element 🕊
        if (typeof this.videoEndedListener !== 'undefined') {
            this.videoElement.removeEventListener('ended', this.videoEndedListener);
        }
        if (typeof this.videoPlayingEventListener !== 'undefined') {
            this.videoElement.removeEventListener('playing', this.videoPlayingEventListener);
        }
        if (typeof this.videoCanPlayListener !== 'undefined') {
            this.videoElement.removeEventListener('loadedmetadata', this.videoCanPlayListener);
        }
        // then forgets about that element 😢
        this.cleanVideoSource(this.videoElement);
        this.videoElement = undefined;
    }
    _destroyImageElement() {
        if (!this.imageElement) {
            return;
        }
        // first gives freedon to the element 🕊
        if (undefined !== this.imageLoadedListener) {
            this.imageElement.removeEventListener('load', this.imageLoadedListener);
        }
        // then forget about that element 😢
        this.imageElement.src = undefined;
        this.imageElement.removeAttribute('src');
        this.imageElement = undefined;
    }
    /**
     * Cleans canvas references 🖌
     */
    _destroyCaptureCanvas() {
        // then forget about that element 😢
        this.captureCanvasContext = undefined;
        this.captureCanvas = undefined;
    }
    /**
     * Defines what the videoElement src will be.
     *
     * @param videoElement
     * @param stream
     */
    addVideoSource(videoElement, stream) {
        // Older browsers may not have `srcObject`
        try {
            // @note Throws Exception if interrupted by a new loaded request
            videoElement.srcObject = stream;
        }
        catch (err) {
            // @note Avoid using this in new browsers, as it is going away.
            // @ts-ignore
            videoElement.src = URL.createObjectURL(stream);
        }
    }
    /**
     * Unbinds a HTML video src property.
     *
     * @param videoElement
     */
    cleanVideoSource(videoElement) {
        try {
            videoElement.srcObject = null;
        }
        catch (err) {
            videoElement.src = '';
        }
        this.videoElement.removeAttribute('src');
    }
}
