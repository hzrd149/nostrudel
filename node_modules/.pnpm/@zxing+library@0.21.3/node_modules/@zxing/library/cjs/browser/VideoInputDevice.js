"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoInputDevice = void 0;
/**
 * @deprecated Moving to @zxing/browser
 *
 * Video input device metadata containing the id and label of the device if available.
 */
var VideoInputDevice = /** @class */ (function () {
    /**
     * Creates an instance of VideoInputDevice.
     *
     * @param {string} deviceId the video input device id
     * @param {string} label the label of the device if available
     */
    function VideoInputDevice(deviceId, label, groupId) {
        this.deviceId = deviceId;
        this.label = label;
        /** @inheritdoc */
        this.kind = 'videoinput';
        this.groupId = groupId || undefined;
    }
    /** @inheritdoc */
    VideoInputDevice.prototype.toJSON = function () {
        return {
            kind: this.kind,
            groupId: this.groupId,
            deviceId: this.deviceId,
            label: this.label,
        };
    };
    return VideoInputDevice;
}());
exports.VideoInputDevice = VideoInputDevice;
