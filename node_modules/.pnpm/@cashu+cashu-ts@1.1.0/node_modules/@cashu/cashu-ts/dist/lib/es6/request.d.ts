type RequestArgs = {
    endpoint: string;
    requestBody?: Record<string, unknown>;
    headers?: Record<string, string>;
};
type RequestOptions = RequestArgs & Omit<RequestInit, 'body' | 'headers'>;
/**
 * An object containing any custom settings that you want to apply to the global fetch method.
 * @param options See possible options here: https://developer.mozilla.org/en-US/docs/Web/API/fetch#options
 */
export declare function setGlobalRequestOptions(options: Partial<RequestOptions>): void;
export default function request<T>(options: RequestOptions): Promise<T>;
export {};
