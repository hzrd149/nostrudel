/**
 * @deprecated Moving to @zxing/browser
 *
 * Video input device metadata containing the id and label of the device if available.
 */
export class VideoInputDevice {
    /**
     * Creates an instance of VideoInputDevice.
     *
     * @param {string} deviceId the video input device id
     * @param {string} label the label of the device if available
     */
    constructor(deviceId, label, groupId) {
        this.deviceId = deviceId;
        this.label = label;
        /** @inheritdoc */
        this.kind = 'videoinput';
        this.groupId = groupId || undefined;
    }
    /** @inheritdoc */
    toJSON() {
        return {
            kind: this.kind,
            groupId: this.groupId,
            deviceId: this.deviceId,
            label: this.label,
        };
    }
}
