declare function encodeUint8toBase64(uint8array: Uint8Array): string;
declare function encodeUint8toBase64Url(bytes: Uint8Array): string;
declare function encodeBase64toUint8(base64String: string): Uint8Array;
declare function encodeJsonToBase64(jsonObj: unknown): string;
declare function encodeBase64ToJson<T extends object>(base64String: string): T;
export { encodeUint8toBase64, encodeUint8toBase64Url, encodeBase64toUint8, encodeJsonToBase64, encodeBase64ToJson };
