export declare class HttpResponseError extends Error {
    status: number;
    constructor(message: string, status: number);
}
