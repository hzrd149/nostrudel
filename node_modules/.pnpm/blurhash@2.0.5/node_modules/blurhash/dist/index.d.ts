declare const isBlurhashValid: (blurhash: string) => {
    result: boolean;
    errorReason?: string;
};
declare const decode: (blurhash: string, width: number, height: number, punch?: number) => Uint8ClampedArray;

declare const encode: (pixels: Uint8ClampedArray, width: number, height: number, componentX: number, componentY: number) => string;

declare class ValidationError extends Error {
    constructor(message: string);
}

export { ValidationError, decode, encode, isBlurhashValid };
