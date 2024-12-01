/**
 * @deprecated Moving to @zxing/browser
 *
 * Video input device metadata containing the id and label of the device if available.
 */
export declare class VideoInputDevice implements MediaDeviceInfo {
    deviceId: string;
    label: string;
    /** @inheritdoc */
    readonly kind = "videoinput";
    /** @inheritdoc */
    readonly groupId: string;
    /**
     * Creates an instance of VideoInputDevice.
     *
     * @param {string} deviceId the video input device id
     * @param {string} label the label of the device if available
     */
    constructor(deviceId: string, label: string, groupId?: string);
    /** @inheritdoc */
    toJSON(): {
        kind: string;
        groupId: string;
        deviceId: string;
        label: string;
    };
}
