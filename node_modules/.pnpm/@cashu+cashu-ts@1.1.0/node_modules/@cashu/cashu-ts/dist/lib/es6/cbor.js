function isResultKeyType(value) {
    return typeof value === 'number' || typeof value === 'string';
}
export function encodeCBOR(value) {
    var buffer = [];
    encodeItem(value, buffer);
    return new Uint8Array(buffer);
}
function encodeItem(value, buffer) {
    if (value === null) {
        buffer.push(0xf6);
    }
    else if (value === undefined) {
        buffer.push(0xf7);
    }
    else if (typeof value === 'boolean') {
        buffer.push(value ? 0xf5 : 0xf4);
    }
    else if (typeof value === 'number') {
        encodeUnsigned(value, buffer);
    }
    else if (typeof value === 'string') {
        encodeString(value, buffer);
    }
    else if (Array.isArray(value)) {
        encodeArray(value, buffer);
    }
    else if (value instanceof Uint8Array) {
        encodeByteString(value, buffer);
    }
    else if (typeof value === 'object') {
        encodeObject(value, buffer);
    }
    else {
        throw new Error('Unsupported type');
    }
}
function encodeUnsigned(value, buffer) {
    if (value < 24) {
        buffer.push(value);
    }
    else if (value < 256) {
        buffer.push(0x18, value);
    }
    else if (value < 65536) {
        buffer.push(0x19, value >> 8, value & 0xff);
    }
    else if (value < 4294967296) {
        buffer.push(0x1a, value >> 24, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff);
    }
    else {
        throw new Error('Unsupported integer size');
    }
}
function encodeByteString(value, buffer) {
    var length = value.length;
    if (length < 24) {
        buffer.push(0x40 + length);
    }
    else if (length < 256) {
        buffer.push(0x58, length);
    }
    else if (length < 65536) {
        buffer.push(0x59, (length >> 8) & 0xff, length & 0xff);
    }
    else if (length < 4294967296) {
        buffer.push(0x5a, (length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);
    }
    else {
        throw new Error('Byte string too long to encode');
    }
    for (var i = 0; i < value.length; i++) {
        buffer.push(value[i]);
    }
}
function encodeString(value, buffer) {
    var utf8 = new TextEncoder().encode(value);
    var length = utf8.length;
    if (length < 24) {
        buffer.push(0x60 + length);
    }
    else if (length < 256) {
        buffer.push(0x78, length);
    }
    else if (length < 65536) {
        buffer.push(0x79, (length >> 8) & 0xff, length & 0xff);
    }
    else if (length < 4294967296) {
        buffer.push(0x7a, (length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);
    }
    else {
        throw new Error('String too long to encode');
    }
    for (var i = 0; i < utf8.length; i++) {
        buffer.push(utf8[i]);
    }
}
function encodeArray(value, buffer) {
    var length = value.length;
    if (length < 24) {
        buffer.push(0x80 | length);
    }
    else if (length < 256) {
        buffer.push(0x98, length);
    }
    else if (length < 65536) {
        buffer.push(0x99, length >> 8, length & 0xff);
    }
    else {
        throw new Error('Unsupported array length');
    }
    for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
        var item = value_1[_i];
        encodeItem(item, buffer);
    }
}
function encodeObject(value, buffer) {
    var keys = Object.keys(value);
    encodeUnsigned(keys.length, buffer);
    buffer[buffer.length - 1] |= 0xa0;
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        encodeString(key, buffer);
        encodeItem(value[key], buffer);
    }
}
export function decodeCBOR(data) {
    var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    var result = decodeItem(view, 0);
    return result.value;
}
function decodeItem(view, offset) {
    if (offset >= view.byteLength) {
        throw new Error('Unexpected end of data');
    }
    var initialByte = view.getUint8(offset++);
    var majorType = initialByte >> 5;
    var additionalInfo = initialByte & 0x1f;
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
            throw new Error("Unsupported major type: ".concat(majorType));
    }
}
function decodeLength(view, offset, additionalInfo) {
    if (additionalInfo < 24)
        return { value: additionalInfo, offset: offset };
    if (additionalInfo === 24)
        return { value: view.getUint8(offset++), offset: offset };
    if (additionalInfo === 25) {
        var value = view.getUint16(offset, false);
        offset += 2;
        return { value: value, offset: offset };
    }
    if (additionalInfo === 26) {
        var value = view.getUint32(offset, false);
        offset += 4;
        return { value: value, offset: offset };
    }
    if (additionalInfo === 27) {
        var hi = view.getUint32(offset, false);
        var lo = view.getUint32(offset + 4, false);
        offset += 8;
        return { value: hi * Math.pow(2, 32) + lo, offset: offset };
    }
    throw new Error("Unsupported length: ".concat(additionalInfo));
}
function decodeUnsigned(view, offset, additionalInfo) {
    var _a = decodeLength(view, offset, additionalInfo), value = _a.value, newOffset = _a.offset;
    return { value: value, offset: newOffset };
}
function decodeSigned(view, offset, additionalInfo) {
    var _a = decodeLength(view, offset, additionalInfo), value = _a.value, newOffset = _a.offset;
    return { value: -1 - value, offset: newOffset };
}
function decodeByteString(view, offset, additionalInfo) {
    var _a = decodeLength(view, offset, additionalInfo), length = _a.value, newOffset = _a.offset;
    if (newOffset + length > view.byteLength) {
        throw new Error('Byte string length exceeds data length');
    }
    var value = new Uint8Array(view.buffer, view.byteOffset + newOffset, length);
    return { value: value, offset: newOffset + length };
}
function decodeString(view, offset, additionalInfo) {
    var _a = decodeLength(view, offset, additionalInfo), length = _a.value, newOffset = _a.offset;
    if (newOffset + length > view.byteLength) {
        throw new Error('String length exceeds data length');
    }
    var bytes = new Uint8Array(view.buffer, view.byteOffset + newOffset, length);
    var value = new TextDecoder().decode(bytes);
    return { value: value, offset: newOffset + length };
}
function decodeArray(view, offset, additionalInfo) {
    var _a = decodeLength(view, offset, additionalInfo), length = _a.value, newOffset = _a.offset;
    var array = [];
    var currentOffset = newOffset;
    for (var i = 0; i < length; i++) {
        var result = decodeItem(view, currentOffset);
        array.push(result.value);
        currentOffset = result.offset;
    }
    return { value: array, offset: currentOffset };
}
function decodeMap(view, offset, additionalInfo) {
    var _a = decodeLength(view, offset, additionalInfo), length = _a.value, newOffset = _a.offset;
    var map = {};
    var currentOffset = newOffset;
    for (var i = 0; i < length; i++) {
        var keyResult = decodeItem(view, currentOffset);
        if (!isResultKeyType(keyResult.value)) {
            throw new Error('Invalid key type');
        }
        var valueResult = decodeItem(view, keyResult.offset);
        map[keyResult.value] = valueResult.value;
        currentOffset = valueResult.offset;
    }
    return { value: map, offset: currentOffset };
}
function decodeFloat16(uint16) {
    var exponent = (uint16 & 0x7c00) >> 10;
    var fraction = uint16 & 0x03ff;
    var sign = uint16 & 0x8000 ? -1 : 1;
    if (exponent === 0) {
        return sign * Math.pow(2, -14) * (fraction / 1024);
    }
    else if (exponent === 0x1f) {
        return fraction ? NaN : sign * Infinity;
    }
    return sign * Math.pow(2, (exponent - 15)) * (1 + fraction / 1024);
}
function decodeSimpleAndFloat(view, offset, additionalInfo) {
    if (additionalInfo < 24) {
        switch (additionalInfo) {
            case 20:
                return { value: false, offset: offset };
            case 21:
                return { value: true, offset: offset };
            case 22:
                return { value: null, offset: offset };
            case 23:
                return { value: undefined, offset: offset };
            default:
                throw new Error("Unknown simple value: ".concat(additionalInfo));
        }
    }
    if (additionalInfo === 24)
        return { value: view.getUint8(offset++), offset: offset };
    if (additionalInfo === 25) {
        var value = decodeFloat16(view.getUint16(offset, false));
        offset += 2;
        return { value: value, offset: offset };
    }
    if (additionalInfo === 26) {
        var value = view.getFloat32(offset, false);
        offset += 4;
        return { value: value, offset: offset };
    }
    if (additionalInfo === 27) {
        var value = view.getFloat64(offset, false);
        offset += 8;
        return { value: value, offset: offset };
    }
    throw new Error("Unknown simple or float value: ".concat(additionalInfo));
}
//# sourceMappingURL=cbor.js.map