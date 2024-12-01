var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
var BrowserCodeReader = /** @class */ (function () {
    /**
     * Creates an instance of BrowserCodeReader.
     * @param {Reader} reader The reader instance to decode the barcode
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent successful decode tries
     *
     * @memberOf BrowserCodeReader
     */
    function BrowserCodeReader(reader, timeBetweenScansMillis, _hints) {
        if (timeBetweenScansMillis === void 0) { timeBetweenScansMillis = 500; }
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
    Object.defineProperty(BrowserCodeReader.prototype, "hasNavigator", {
        /**
         * If navigator is present.
         */
        get: function () {
            return typeof navigator !== 'undefined';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BrowserCodeReader.prototype, "isMediaDevicesSuported", {
        /**
         * If mediaDevices under navigator is supported.
         */
        get: function () {
            return this.hasNavigator && !!navigator.mediaDevices;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BrowserCodeReader.prototype, "canEnumerateDevices", {
        /**
         * If enumerateDevices under navigator is supported.
         */
        get: function () {
            return !!(this.isMediaDevicesSuported && navigator.mediaDevices.enumerateDevices);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BrowserCodeReader.prototype, "timeBetweenDecodingAttempts", {
        /** Time between two decoding tries in milli seconds. */
        get: function () {
            return this._timeBetweenDecodingAttempts;
        },
        /**
         * Change the time span the decoder waits between two decoding tries.
         *
         * @param {number} millis Time between two decoding tries in milli seconds.
         */
        set: function (millis) {
            this._timeBetweenDecodingAttempts = millis < 0 ? 0 : millis;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BrowserCodeReader.prototype, "hints", {
        /**
         * Sets the hints.
         */
        get: function () {
            return this._hints;
        },
        /**
         * Sets the hints.
         */
        set: function (hints) {
            this._hints = hints || null;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Lists all the available video input devices.
     */
    BrowserCodeReader.prototype.listVideoInputDevices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var devices, videoDevices, devices_1, devices_1_1, device, kind, deviceId, label, groupId, videoDevice;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.hasNavigator) {
                            throw new Error("Can't enumerate devices, navigator is not present.");
                        }
                        if (!this.canEnumerateDevices) {
                            throw new Error("Can't enumerate devices, method not supported.");
                        }
                        return [4 /*yield*/, navigator.mediaDevices.enumerateDevices()];
                    case 1:
                        devices = _b.sent();
                        videoDevices = [];
                        try {
                            for (devices_1 = __values(devices), devices_1_1 = devices_1.next(); !devices_1_1.done; devices_1_1 = devices_1.next()) {
                                device = devices_1_1.value;
                                kind = device.kind === 'video' ? 'videoinput' : device.kind;
                                if (kind !== 'videoinput') {
                                    continue;
                                }
                                deviceId = device.deviceId || device.id;
                                label = device.label || "Video device " + (videoDevices.length + 1);
                                groupId = device.groupId;
                                videoDevice = { deviceId: deviceId, label: label, kind: kind, groupId: groupId };
                                videoDevices.push(videoDevice);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (devices_1_1 && !devices_1_1.done && (_a = devices_1.return)) _a.call(devices_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [2 /*return*/, videoDevices];
                }
            });
        });
    };
    /**
     * Obtain the list of available devices with type 'videoinput'.
     *
     * @returns {Promise<VideoInputDevice[]>} an array of available video input devices
     *
     * @memberOf BrowserCodeReader
     *
     * @deprecated Use `listVideoInputDevices` instead.
     */
    BrowserCodeReader.prototype.getVideoInputDevices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var devices;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.listVideoInputDevices()];
                    case 1:
                        devices = _a.sent();
                        return [2 /*return*/, devices.map(function (d) { return new VideoInputDevice(d.deviceId, d.label); })];
                }
            });
        });
    };
    /**
     * Let's you find a device using it's Id.
     */
    BrowserCodeReader.prototype.findDeviceById = function (deviceId) {
        return __awaiter(this, void 0, void 0, function () {
            var devices;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.listVideoInputDevices()];
                    case 1:
                        devices = _a.sent();
                        if (!devices) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, devices.find(function (x) { return x.deviceId === deviceId; })];
                }
            });
        });
    };
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
    BrowserCodeReader.prototype.decodeFromInputVideoDevice = function (deviceId, videoSource) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.decodeOnceFromVideoDevice(deviceId, videoSource)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * In one attempt, tries to decode the barcode from the device specified by deviceId while showing the video in the specified video element.
     *
     * @param deviceId the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param video the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeOnceFromVideoDevice = function (deviceId, videoSource) {
        return __awaiter(this, void 0, void 0, function () {
            var videoConstraints, constraints;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.reset();
                        if (!deviceId) {
                            videoConstraints = { facingMode: 'environment' };
                        }
                        else {
                            videoConstraints = { deviceId: { exact: deviceId } };
                        }
                        constraints = { video: videoConstraints };
                        return [4 /*yield*/, this.decodeOnceFromConstraints(constraints, videoSource)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param constraints the media stream constraints to get s valid media stream to decode from
     * @param video the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeOnceFromConstraints = function (constraints, videoSource) {
        return __awaiter(this, void 0, void 0, function () {
            var stream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, navigator.mediaDevices.getUserMedia(constraints)];
                    case 1:
                        stream = _a.sent();
                        return [4 /*yield*/, this.decodeOnceFromStream(stream, videoSource)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeOnceFromStream = function (stream, videoSource) {
        return __awaiter(this, void 0, void 0, function () {
            var video, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.reset();
                        return [4 /*yield*/, this.attachStreamToVideo(stream, videoSource)];
                    case 1:
                        video = _a.sent();
                        return [4 /*yield*/, this.decodeOnce(video)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
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
    BrowserCodeReader.prototype.decodeFromInputVideoDeviceContinuously = function (deviceId, videoSource, callbackFn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.decodeFromVideoDevice(deviceId, videoSource, callbackFn)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Continuously tries to decode the barcode from the device specified by device while showing the video in the specified video element.
     *
     * @param {string|null} [deviceId] the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param {string|HTMLVideoElement|null} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<void>}
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeFromVideoDevice = function (deviceId, videoSource, callbackFn) {
        return __awaiter(this, void 0, void 0, function () {
            var videoConstraints, constraints;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!deviceId) {
                            videoConstraints = { facingMode: 'environment' };
                        }
                        else {
                            videoConstraints = { deviceId: { exact: deviceId } };
                        }
                        constraints = { video: videoConstraints };
                        return [4 /*yield*/, this.decodeFromConstraints(constraints, videoSource, callbackFn)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Continuously tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeFromConstraints = function (constraints, videoSource, callbackFn) {
        return __awaiter(this, void 0, void 0, function () {
            var stream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, navigator.mediaDevices.getUserMedia(constraints)];
                    case 1:
                        stream = _a.sent();
                        return [4 /*yield*/, this.decodeFromStream(stream, videoSource, callbackFn)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * In one attempt, tries to decode the barcode from a stream obtained from the given constraints while showing the video in the specified video element.
     *
     * @param {MediaStream} [constraints] the media stream constraints to get s valid media stream to decode from
     * @param {string|HTMLVideoElement} [video] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeFromStream = function (stream, videoSource, callbackFn) {
        return __awaiter(this, void 0, void 0, function () {
            var video;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.reset();
                        return [4 /*yield*/, this.attachStreamToVideo(stream, videoSource)];
                    case 1:
                        video = _a.sent();
                        return [4 /*yield*/, this.decodeContinuously(video, callbackFn)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Breaks the decoding loop.
     */
    BrowserCodeReader.prototype.stopAsyncDecode = function () {
        this._stopAsyncDecode = true;
    };
    /**
     * Breaks the decoding loop.
     */
    BrowserCodeReader.prototype.stopContinuousDecode = function () {
        this._stopContinuousDecode = true;
    };
    /**
     * Sets the new stream and request a new decoding-with-delay.
     *
     * @param stream The stream to be shown in the video element.
     * @param decodeFn A callback for the decode method.
     */
    BrowserCodeReader.prototype.attachStreamToVideo = function (stream, videoSource) {
        return __awaiter(this, void 0, void 0, function () {
            var videoElement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        videoElement = this.prepareVideoElement(videoSource);
                        this.addVideoSource(videoElement, stream);
                        this.videoElement = videoElement;
                        this.stream = stream;
                        return [4 /*yield*/, this.playVideoOnLoadAsync(videoElement)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, videoElement];
                }
            });
        });
    };
    /**
     *
     * @param videoElement
     */
    BrowserCodeReader.prototype.playVideoOnLoadAsync = function (videoElement) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            return _this.playVideoOnLoad(videoElement, function () { return resolve(); });
        });
    };
    /**
     * Binds listeners and callbacks to the videoElement.
     *
     * @param element
     * @param callbackFn
     */
    BrowserCodeReader.prototype.playVideoOnLoad = function (element, callbackFn) {
        var _this = this;
        this.videoEndedListener = function () { return _this.stopStreams(); };
        this.videoCanPlayListener = function () { return _this.tryPlayVideo(element); };
        element.addEventListener('ended', this.videoEndedListener);
        element.addEventListener('canplay', this.videoCanPlayListener);
        element.addEventListener('playing', callbackFn);
        // if canplay was already fired, we won't know when to play, so just give it a try
        this.tryPlayVideo(element);
    };
    /**
     * Checks if the given video element is currently playing.
     */
    BrowserCodeReader.prototype.isVideoPlaying = function (video) {
        return (video.currentTime > 0 &&
            !video.paused &&
            !video.ended &&
            video.readyState > 2);
    };
    /**
     * Just tries to play the video and logs any errors.
     * The play call is only made is the video is not already playing.
     */
    BrowserCodeReader.prototype.tryPlayVideo = function (videoElement) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.isVideoPlaying(videoElement)) {
                            console.warn('Trying to play video that is already playing.');
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, videoElement.play()];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        console.warn('It was not possible to play the video.');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Searches and validates a media element.
     */
    BrowserCodeReader.prototype.getMediaElement = function (mediaElementId, type) {
        var mediaElement = document.getElementById(mediaElementId);
        if (!mediaElement) {
            throw new ArgumentException("element with id '" + mediaElementId + "' not found");
        }
        if (mediaElement.nodeName.toLowerCase() !== type.toLowerCase()) {
            throw new ArgumentException("element with id '" + mediaElementId + "' must be an " + type + " element");
        }
        return mediaElement;
    };
    /**
     * Decodes the barcode from an image.
     *
     * @param {(string|HTMLImageElement)} [source] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [url]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeFromImage = function (source, url) {
        if (!source && !url) {
            throw new ArgumentException('either imageElement with a src set or an url must be provided');
        }
        if (url && !source) {
            return this.decodeFromImageUrl(url);
        }
        return this.decodeFromImageElement(source);
    };
    /**
     * Decodes the barcode from a video.
     *
     * @param {(string|HTMLImageElement)} [source] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [url]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeFromVideo = function (source, url) {
        if (!source && !url) {
            throw new ArgumentException('Either an element with a src set or an URL must be provided');
        }
        if (url && !source) {
            return this.decodeFromVideoUrl(url);
        }
        return this.decodeFromVideoElement(source);
    };
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
    BrowserCodeReader.prototype.decodeFromVideoContinuously = function (source, url, callbackFn) {
        if (undefined === source && undefined === url) {
            throw new ArgumentException('Either an element with a src set or an URL must be provided');
        }
        if (url && !source) {
            return this.decodeFromVideoUrlContinuously(url, callbackFn);
        }
        return this.decodeFromVideoElementContinuously(source, callbackFn);
    };
    /**
     * Decodes something from an image HTML element.
     */
    BrowserCodeReader.prototype.decodeFromImageElement = function (source) {
        if (!source) {
            throw new ArgumentException('An image element must be provided.');
        }
        this.reset();
        var element = this.prepareImageElement(source);
        this.imageElement = element;
        var task;
        if (this.isImageLoaded(element)) {
            task = this.decodeOnce(element, false, true);
        }
        else {
            task = this._decodeOnLoadImage(element);
        }
        return task;
    };
    /**
     * Decodes something from an image HTML element.
     */
    BrowserCodeReader.prototype.decodeFromVideoElement = function (source) {
        var element = this._decodeFromVideoElementSetup(source);
        return this._decodeOnLoadVideo(element);
    };
    /**
     * Decodes something from an image HTML element.
     */
    BrowserCodeReader.prototype.decodeFromVideoElementContinuously = function (source, callbackFn) {
        var element = this._decodeFromVideoElementSetup(source);
        return this._decodeOnLoadVideoContinuously(element, callbackFn);
    };
    /**
     * Sets up the video source so it can be decoded when loaded.
     *
     * @param source The video source element.
     */
    BrowserCodeReader.prototype._decodeFromVideoElementSetup = function (source) {
        if (!source) {
            throw new ArgumentException('A video element must be provided.');
        }
        this.reset();
        var element = this.prepareVideoElement(source);
        // defines the video element before starts decoding
        this.videoElement = element;
        return element;
    };
    /**
     * Decodes an image from a URL.
     */
    BrowserCodeReader.prototype.decodeFromImageUrl = function (url) {
        if (!url) {
            throw new ArgumentException('An URL must be provided.');
        }
        this.reset();
        var element = this.prepareImageElement();
        this.imageElement = element;
        var decodeTask = this._decodeOnLoadImage(element);
        element.src = url;
        return decodeTask;
    };
    /**
     * Decodes an image from a URL.
     */
    BrowserCodeReader.prototype.decodeFromVideoUrl = function (url) {
        if (!url) {
            throw new ArgumentException('An URL must be provided.');
        }
        this.reset();
        // creates a new element
        var element = this.prepareVideoElement();
        var decodeTask = this.decodeFromVideoElement(element);
        element.src = url;
        return decodeTask;
    };
    /**
     * Decodes an image from a URL.
     *
     * @experimental
     */
    BrowserCodeReader.prototype.decodeFromVideoUrlContinuously = function (url, callbackFn) {
        if (!url) {
            throw new ArgumentException('An URL must be provided.');
        }
        this.reset();
        // creates a new element
        var element = this.prepareVideoElement();
        var decodeTask = this.decodeFromVideoElementContinuously(element, callbackFn);
        element.src = url;
        return decodeTask;
    };
    BrowserCodeReader.prototype._decodeOnLoadImage = function (element) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.imageLoadedListener = function () {
                return _this.decodeOnce(element, false, true).then(resolve, reject);
            };
            element.addEventListener('load', _this.imageLoadedListener);
        });
    };
    BrowserCodeReader.prototype._decodeOnLoadVideo = function (videoElement) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // plays the video
                    return [4 /*yield*/, this.playVideoOnLoadAsync(videoElement)];
                    case 1:
                        // plays the video
                        _a.sent();
                        return [4 /*yield*/, this.decodeOnce(videoElement)];
                    case 2: 
                    // starts decoding after played the video
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BrowserCodeReader.prototype._decodeOnLoadVideoContinuously = function (videoElement, callbackFn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // plays the video
                    return [4 /*yield*/, this.playVideoOnLoadAsync(videoElement)];
                    case 1:
                        // plays the video
                        _a.sent();
                        // starts decoding after played the video
                        this.decodeContinuously(videoElement, callbackFn);
                        return [2 /*return*/];
                }
            });
        });
    };
    BrowserCodeReader.prototype.isImageLoaded = function (img) {
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
    };
    BrowserCodeReader.prototype.prepareImageElement = function (imageSource) {
        var imageElement;
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
    };
    /**
     * Sets a HTMLVideoElement for scanning or creates a new one.
     *
     * @param videoSource The HTMLVideoElement to be set.
     */
    BrowserCodeReader.prototype.prepareVideoElement = function (videoSource) {
        var videoElement;
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
    };
    /**
     * Tries to decode from the video input until it finds some value.
     */
    BrowserCodeReader.prototype.decodeOnce = function (element, retryIfNotFound, retryIfChecksumOrFormatError) {
        var _this = this;
        if (retryIfNotFound === void 0) { retryIfNotFound = true; }
        if (retryIfChecksumOrFormatError === void 0) { retryIfChecksumOrFormatError = true; }
        this._stopAsyncDecode = false;
        var loop = function (resolve, reject) {
            if (_this._stopAsyncDecode) {
                reject(new NotFoundException('Video stream has ended before any code could be detected.'));
                _this._stopAsyncDecode = undefined;
                return;
            }
            try {
                var result = _this.decode(element);
                resolve(result);
            }
            catch (e) {
                var ifNotFound = retryIfNotFound && e instanceof NotFoundException;
                var isChecksumOrFormatError = e instanceof ChecksumException || e instanceof FormatException;
                var ifChecksumOrFormat = isChecksumOrFormatError && retryIfChecksumOrFormatError;
                if (ifNotFound || ifChecksumOrFormat) {
                    // trying again
                    return setTimeout(loop, _this._timeBetweenDecodingAttempts, resolve, reject);
                }
                reject(e);
            }
        };
        return new Promise(function (resolve, reject) { return loop(resolve, reject); });
    };
    /**
     * Continuously decodes from video input.
     */
    BrowserCodeReader.prototype.decodeContinuously = function (element, callbackFn) {
        var _this = this;
        this._stopContinuousDecode = false;
        var loop = function () {
            if (_this._stopContinuousDecode) {
                _this._stopContinuousDecode = undefined;
                return;
            }
            try {
                var result = _this.decode(element);
                callbackFn(result, null);
                setTimeout(loop, _this.timeBetweenScansMillis);
            }
            catch (e) {
                callbackFn(null, e);
                var isChecksumOrFormatError = e instanceof ChecksumException || e instanceof FormatException;
                var isNotFound = e instanceof NotFoundException;
                if (isChecksumOrFormatError || isNotFound) {
                    // trying again
                    setTimeout(loop, _this._timeBetweenDecodingAttempts);
                }
            }
        };
        loop();
    };
    /**
     * Gets the BinaryBitmap for ya! (and decodes it)
     */
    BrowserCodeReader.prototype.decode = function (element) {
        // get binary bitmap for decode function
        var binaryBitmap = this.createBinaryBitmap(element);
        return this.decodeBitmap(binaryBitmap);
    };
    /**
     * Creates a binaryBitmap based in some image source.
     *
     * @param mediaElement HTML element containing drawable image source.
     */
    BrowserCodeReader.prototype.createBinaryBitmap = function (mediaElement) {
        var ctx = this.getCaptureCanvasContext(mediaElement);
        // doing a scan with inverted colors on the second scan should only happen for video elements
        var doAutoInvert = false;
        if (mediaElement instanceof HTMLVideoElement) {
            this.drawFrameOnCanvas(mediaElement);
            doAutoInvert = true;
        }
        else {
            this.drawImageOnCanvas(mediaElement);
        }
        var canvas = this.getCaptureCanvas(mediaElement);
        var luminanceSource = new HTMLCanvasElementLuminanceSource(canvas, doAutoInvert);
        var hybridBinarizer = new HybridBinarizer(luminanceSource);
        return new BinaryBitmap(hybridBinarizer);
    };
    /**
     *
     */
    BrowserCodeReader.prototype.getCaptureCanvasContext = function (mediaElement) {
        if (!this.captureCanvasContext) {
            var elem = this.getCaptureCanvas(mediaElement);
            var ctx = void 0;
            try {
                ctx = elem.getContext('2d', { willReadFrequently: true });
            }
            catch (e) {
                ctx = elem.getContext('2d');
            }
            this.captureCanvasContext = ctx;
        }
        return this.captureCanvasContext;
    };
    /**
     *
     */
    BrowserCodeReader.prototype.getCaptureCanvas = function (mediaElement) {
        if (!this.captureCanvas) {
            var elem = this.createCaptureCanvas(mediaElement);
            this.captureCanvas = elem;
        }
        return this.captureCanvas;
    };
    /**
     * Overwriting this allows you to manipulate the next frame in anyway you want before decode.
     */
    BrowserCodeReader.prototype.drawFrameOnCanvas = function (srcElement, dimensions, canvasElementContext) {
        if (dimensions === void 0) { dimensions = {
            sx: 0,
            sy: 0,
            sWidth: srcElement.videoWidth,
            sHeight: srcElement.videoHeight,
            dx: 0,
            dy: 0,
            dWidth: srcElement.videoWidth,
            dHeight: srcElement.videoHeight,
        }; }
        if (canvasElementContext === void 0) { canvasElementContext = this.captureCanvasContext; }
        canvasElementContext.drawImage(srcElement, dimensions.sx, dimensions.sy, dimensions.sWidth, dimensions.sHeight, dimensions.dx, dimensions.dy, dimensions.dWidth, dimensions.dHeight);
    };
    /**
     * Ovewriting this allows you to manipulate the snapshot image in anyway you want before decode.
     */
    BrowserCodeReader.prototype.drawImageOnCanvas = function (srcElement, dimensions, canvasElementContext) {
        if (dimensions === void 0) { dimensions = {
            sx: 0,
            sy: 0,
            sWidth: srcElement.naturalWidth,
            sHeight: srcElement.naturalHeight,
            dx: 0,
            dy: 0,
            dWidth: srcElement.naturalWidth,
            dHeight: srcElement.naturalHeight,
        }; }
        if (canvasElementContext === void 0) { canvasElementContext = this.captureCanvasContext; }
        canvasElementContext.drawImage(srcElement, dimensions.sx, dimensions.sy, dimensions.sWidth, dimensions.sHeight, dimensions.dx, dimensions.dy, dimensions.dWidth, dimensions.dHeight);
    };
    /**
     * Call the encapsulated readers decode
     */
    BrowserCodeReader.prototype.decodeBitmap = function (binaryBitmap) {
        return this.reader.decode(binaryBitmap, this._hints);
    };
    /**
     * 🖌 Prepares the canvas for capture and scan frames.
     */
    BrowserCodeReader.prototype.createCaptureCanvas = function (mediaElement) {
        if (typeof document === 'undefined') {
            this._destroyCaptureCanvas();
            return null;
        }
        var canvasElement = document.createElement('canvas');
        var width;
        var height;
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
    };
    /**
     * Stops the continuous scan and cleans the stream.
     */
    BrowserCodeReader.prototype.stopStreams = function () {
        if (this.stream) {
            this.stream.getVideoTracks().forEach(function (t) { return t.stop(); });
            this.stream = undefined;
        }
        if (this._stopAsyncDecode === false) {
            this.stopAsyncDecode();
        }
        if (this._stopContinuousDecode === false) {
            this.stopContinuousDecode();
        }
    };
    /**
     * Resets the code reader to the initial state. Cancels any ongoing barcode scanning from video or camera.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.reset = function () {
        // stops the camera, preview and scan 🔴
        this.stopStreams();
        // clean and forget about HTML elements
        this._destroyVideoElement();
        this._destroyImageElement();
        this._destroyCaptureCanvas();
    };
    BrowserCodeReader.prototype._destroyVideoElement = function () {
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
    };
    BrowserCodeReader.prototype._destroyImageElement = function () {
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
    };
    /**
     * Cleans canvas references 🖌
     */
    BrowserCodeReader.prototype._destroyCaptureCanvas = function () {
        // then forget about that element 😢
        this.captureCanvasContext = undefined;
        this.captureCanvas = undefined;
    };
    /**
     * Defines what the videoElement src will be.
     *
     * @param videoElement
     * @param stream
     */
    BrowserCodeReader.prototype.addVideoSource = function (videoElement, stream) {
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
    };
    /**
     * Unbinds a HTML video src property.
     *
     * @param videoElement
     */
    BrowserCodeReader.prototype.cleanVideoSource = function (videoElement) {
        try {
            videoElement.srcObject = null;
        }
        catch (err) {
            videoElement.src = '';
        }
        this.videoElement.removeAttribute('src');
    };
    return BrowserCodeReader;
}());
export { BrowserCodeReader };
