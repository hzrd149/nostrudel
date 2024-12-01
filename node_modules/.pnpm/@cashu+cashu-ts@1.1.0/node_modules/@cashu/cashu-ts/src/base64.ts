import { Buffer } from 'buffer';

function encodeUint8toBase64(uint8array: Uint8Array): string {
	return Buffer.from(uint8array).toString('base64');
}

function encodeUint8toBase64Url(bytes: Uint8Array): string {
	return Buffer.from(bytes)
		.toString('base64')
		.replace(/\+/g, '-') // Replace + with -
		.replace(/\//g, '_') // Replace / with _
		.replace(/=+$/, ''); // Remove padding characters
}

function encodeBase64toUint8(base64String: string): Uint8Array {
	return Buffer.from(base64String, 'base64');
}

function encodeJsonToBase64(jsonObj: unknown): string {
	const jsonString = JSON.stringify(jsonObj);
	return base64urlFromBase64(Buffer.from(jsonString).toString('base64'));
}

function encodeBase64ToJson<T extends object>(base64String: string): T {
	const jsonString = Buffer.from(base64urlToBase64(base64String), 'base64').toString();
	const jsonObj = JSON.parse(jsonString) as T;
	return jsonObj;
}

function base64urlToBase64(str: string) {
	return str.replace(/-/g, '+').replace(/_/g, '/').split('=')[0];
	// .replace(/./g, '=');
}

function base64urlFromBase64(str: string) {
	return str.replace(/\+/g, '-').replace(/\//g, '_').split('=')[0];
	// .replace(/=/g, '.');
}

export {
	encodeUint8toBase64,
	encodeUint8toBase64Url,
	encodeBase64toUint8,
	encodeJsonToBase64,
	encodeBase64ToJson
};
