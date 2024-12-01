import { HttpResponseError } from './model/Errors';

type RequestArgs = {
	endpoint: string;
	requestBody?: Record<string, unknown>;
	headers?: Record<string, string>;
};

type RequestOptions = RequestArgs & Omit<RequestInit, 'body' | 'headers'>;

let globalRequestOptions: Partial<RequestOptions> = {};

/**
 * An object containing any custom settings that you want to apply to the global fetch method.
 * @param options See possible options here: https://developer.mozilla.org/en-US/docs/Web/API/fetch#options
 */
export function setGlobalRequestOptions(options: Partial<RequestOptions>): void {
	globalRequestOptions = options;
}

async function _request({
	endpoint,
	requestBody,
	headers: requestHeaders,
	...options
}: RequestOptions): Promise<unknown> {
	const body = requestBody ? JSON.stringify(requestBody) : undefined;
	const headers = {
		...{ Accept: 'application/json, text/plain, */*' },
		...(body ? { 'Content-Type': 'application/json' } : undefined),
		...requestHeaders
	};

	const response = await fetch(endpoint, { body, headers, ...options });

	if (!response.ok) {
		// expecting: { error: '', code: 0 }
		// or: { detail: '' } (cashuBtc via pythonApi)
		const { error, detail } = await response.json().catch(() => ({ error: 'bad response' }));
		throw new HttpResponseError(error || detail || 'bad response', response.status);
	}

	try {
		return await response.json();
	} catch (err) {
		console.error('Failed to parse HTTP response', err);
		throw new HttpResponseError('bad response', response.status);
	}
}

export default async function request<T>(options: RequestOptions): Promise<T> {
	const data = await _request({ ...options, ...globalRequestOptions });
	return data as T;
}
