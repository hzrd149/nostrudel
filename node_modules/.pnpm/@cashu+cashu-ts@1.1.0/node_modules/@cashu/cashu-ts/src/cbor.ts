type SimpleValue = boolean | null | undefined;

export type ResultObject = { [key: string]: ResultValue };
export type ResultValue =
	| SimpleValue
	| number
	| string
	| Uint8Array
	| Array<ResultValue>
	| ResultObject;

type ResultKeyType = Extract<ResultValue, number | string>;
export type ValidDecodedType = Extract<ResultValue, ResultObject>;

function isResultKeyType(value: ResultValue): value is ResultKeyType {
	return typeof value === 'number' || typeof value === 'string';
}

type DecodeResult<T extends ResultValue> = {
	value: T;
	offset: number;
};

export function encodeCBOR(value: any) {
	const buffer: Array<number> = [];
	encodeItem(value, buffer);
	return new Uint8Array(buffer);
}

function encodeItem(value: any, buffer: Array<number>) {
	if (value === null) {
		buffer.push(0xf6);
	} else if (value === undefined) {
		buffer.push(0xf7);
	} else if (typeof value === 'boolean') {
		buffer.push(value ? 0xf5 : 0xf4);
	} else if (typeof value === 'number') {
		encodeUnsigned(value, buffer);
	} else if (typeof value === 'string') {
		encodeString(value, buffer);
	} else if (Array.isArray(value)) {
		encodeArray(value, buffer);
	} else if (value instanceof Uint8Array) {
		encodeByteString(value, buffer);
	} else if (typeof value === 'object') {
		encodeObject(value, buffer);
	} else {
		throw new Error('Unsupported type');
	}
}

function encodeUnsigned(value: number, buffer: Array<number>) {
	if (value < 24) {
		buffer.push(value);
	} else if (value < 256) {
		buffer.push(0x18, value);
	} else if (value < 65536) {
		buffer.push(0x19, value >> 8, value & 0xff);
	} else if (value < 4294967296) {
		buffer.push(0x1a, value >> 24, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff);
	} else {
		throw new Error('Unsupported integer size');
	}
}

function encodeByteString(value: Uint8Array, buffer: Array<number>) {
	const length = value.length;

	if (length < 24) {
		buffer.push(0x40 + length);
	} else if (length < 256) {
		buffer.push(0x58, length);
	} else if (length < 65536) {
		buffer.push(0x59, (length >> 8) & 0xff, length & 0xff);
	} else if (length < 4294967296) {
		buffer.push(
			0x5a,
			(length >> 24) & 0xff,
			(length >> 16) & 0xff,
			(length >> 8) & 0xff,
			length & 0xff
		);
	} else {
		throw new Error('Byte string too long to encode');
	}

	for (let i = 0; i < value.length; i++) {
		buffer.push(value[i]);
	}
}

function encodeString(value: string, buffer: Array<number>) {
	const utf8 = new TextEncoder().encode(value);
	const length = utf8.length;

	if (length < 24) {
		buffer.push(0x60 + length);
	} else if (length < 256) {
		buffer.push(0x78, length);
	} else if (length < 65536) {
		buffer.push(0x79, (length >> 8) & 0xff, length & 0xff);
	} else if (length < 4294967296) {
		buffer.push(
			0x7a,
			(length >> 24) & 0xff,
			(length >> 16) & 0xff,
			(length >> 8) & 0xff,
			length & 0xff
		);
	} else {
		throw new Error('String too long to encode');
	}

	for (let i = 0; i < utf8.length; i++) {
		buffer.push(utf8[i]);
	}
}

function encodeArray(value: Array<any>, buffer: Array<number>) {
	const length = value.length;
	if (length < 24) {
		buffer.push(0x80 | length);
	} else if (length < 256) {
		buffer.push(0x98, length);
	} else if (length < 65536) {
		buffer.push(0x99, length >> 8, length & 0xff);
	} else {
		throw new Error('Unsupported array length');
	}

	for (const item of value) {
		encodeItem(item, buffer);
	}
}

function encodeObject(value: { [key: string]: any }, buffer: Array<number>) {
	const keys = Object.keys(value);
	encodeUnsigned(keys.length, buffer);
	buffer[buffer.length - 1] |= 0xa0;
	for (const key of keys) {
		encodeString(key, buffer);
		encodeItem(value[key], buffer);
	}
}

export function decodeCBOR(data: Uint8Array): ResultValue {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const result = decodeItem(view, 0);
	return result.value;
}

function decodeItem(view: DataView, offset: number): DecodeResult<ResultValue> {
	if (offset >= view.byteLength) {
		throw new Error('Unexpected end of data');
	}
	const initialByte = view.getUint8(offset++);
	const majorType = initialByte >> 5;
	const additionalInfo = initialByte & 0x1f;

	switch (majorType) {
		case 0:
			return decodeUnsigned(view, offset, additionalInfo);
		case 1:
			return decodeSigned(view, offset, additionalInfo);
		case 2:
			return decodeByteString(view, offset, additionalInfo);
		case 3:
			return decodeString(view, offset, additionalInfo);
		case 4:
			return decodeArray(view, offset, additionalInfo);
		case 5:
			return decodeMap(view, offset, additionalInfo);
		case 7:
			return decodeSimpleAndFloat(view, offset, additionalInfo);
		default:
			throw new Error(`Unsupported major type: ${majorType}`);
	}
}

function decodeLength(
	view: DataView,
	offset: number,
	additionalInfo: number
): DecodeResult<number> {
	if (additionalInfo < 24) return { value: additionalInfo, offset };
	if (additionalInfo === 24) return { value: view.getUint8(offset++), offset };
	if (additionalInfo === 25) {
		const value = view.getUint16(offset, false);
		offset += 2;
		return { value, offset };
	}
	if (additionalInfo === 26) {
		const value = view.getUint32(offset, false);
		offset += 4;
		return { value, offset };
	}
	if (additionalInfo === 27) {
		const hi = view.getUint32(offset, false);
		const lo = view.getUint32(offset + 4, false);
		offset += 8;
		return { value: hi * 2 ** 32 + lo, offset };
	}
	throw new Error(`Unsupported length: ${additionalInfo}`);
}

function decodeUnsigned(
	view: DataView,
	offset: number,
	additionalInfo: number
): DecodeResult<number> {
	const { value, offset: newOffset } = decodeLength(view, offset, additionalInfo);
	return { value, offset: newOffset };
}

function decodeSigned(
	view: DataView,
	offset: number,
	additionalInfo: number
): DecodeResult<number> {
	const { value, offset: newOffset } = decodeLength(view, offset, additionalInfo);
	return { value: -1 - value, offset: newOffset };
}

function decodeByteString(
	view: DataView,
	offset: number,
	additionalInfo: number
): DecodeResult<Uint8Array> {
	const { value: length, offset: newOffset } = decodeLength(view, offset, additionalInfo);
	if (newOffset + length > view.byteLength) {
		throw new Error('Byte string length exceeds data length');
	}
	const value = new Uint8Array(view.buffer, view.byteOffset + newOffset, length);
	return { value, offset: newOffset + length };
}

function decodeString(
	view: DataView,
	offset: number,
	additionalInfo: number
): DecodeResult<string> {
	const { value: length, offset: newOffset } = decodeLength(view, offset, additionalInfo);
	if (newOffset + length > view.byteLength) {
		throw new Error('String length exceeds data length');
	}
	const bytes = new Uint8Array(view.buffer, view.byteOffset + newOffset, length);
	const value = new TextDecoder().decode(bytes);
	return { value, offset: newOffset + length };
}

function decodeArray(
	view: DataView,
	offset: number,
	additionalInfo: number
): DecodeResult<Array<ResultValue>> {
	const { value: length, offset: newOffset } = decodeLength(view, offset, additionalInfo);
	const array = [];
	let currentOffset = newOffset;
	for (let i = 0; i < length; i++) {
		const result = decodeItem(view, currentOffset);
		array.push(result.value);
		currentOffset = result.offset;
	}
	return { value: array, offset: currentOffset };
}

function decodeMap(
	view: DataView,
	offset: number,
	additionalInfo: number
): DecodeResult<Record<string, ResultValue>> {
	const { value: length, offset: newOffset } = decodeLength(view, offset, additionalInfo);
	const map: { [key: string]: ResultValue } = {};
	let currentOffset = newOffset;
	for (let i = 0; i < length; i++) {
		const keyResult = decodeItem(view, currentOffset);
		if (!isResultKeyType(keyResult.value)) {
			throw new Error('Invalid key type');
		}
		const valueResult = decodeItem(view, keyResult.offset);
		map[keyResult.value] = valueResult.value;
		currentOffset = valueResult.offset;
	}
	return { value: map, offset: currentOffset };
}

function decodeFloat16(uint16: number): number {
	const exponent = (uint16 & 0x7c00) >> 10;
	const fraction = uint16 & 0x03ff;
	const sign = uint16 & 0x8000 ? -1 : 1;

	if (exponent === 0) {
		return sign * 2 ** -14 * (fraction / 1024);
	} else if (exponent === 0x1f) {
		return fraction ? NaN : sign * Infinity;
	}
	return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

function decodeSimpleAndFloat(
	view: DataView,
	offset: number,
	additionalInfo: number
): DecodeResult<SimpleValue | number> {
	if (additionalInfo < 24) {
		switch (additionalInfo) {
			case 20:
				return { value: false, offset };
			case 21:
				return { value: true, offset };
			case 22:
				return { value: null, offset };
			case 23:
				return { value: undefined, offset };
			default:
				throw new Error(`Unknown simple value: ${additionalInfo}`);
		}
	}
	if (additionalInfo === 24) return { value: view.getUint8(offset++), offset };
	if (additionalInfo === 25) {
		const value = decodeFloat16(view.getUint16(offset, false));
		offset += 2;
		return { value, offset };
	}
	if (additionalInfo === 26) {
		const value = view.getFloat32(offset, false);
		offset += 4;
		return { value, offset };
	}
	if (additionalInfo === 27) {
		const value = view.getFloat64(offset, false);
		offset += 8;
		return { value, offset };
	}
	throw new Error(`Unknown simple or float value: ${additionalInfo}`);
}
