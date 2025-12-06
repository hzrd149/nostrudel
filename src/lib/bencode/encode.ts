// Copied from https://git.v0l.io/Kieran/dtan/src/branch/main/src/bencode/encode.ts

function getType(value: any) {
  if (ArrayBuffer.isView(value)) return "arraybufferview";
  if (Array.isArray(value)) return "array";
  if (value instanceof Number) return "number";
  if (value instanceof Boolean) return "boolean";
  if (value instanceof Set) return "set";
  if (value instanceof Map) return "map";
  if (value instanceof String) return "string";
  if (value instanceof ArrayBuffer) return "arraybuffer";
  return typeof value;
}

function text2arr(data: string) {
  return new TextEncoder().encode(data);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  // Calculate the total length of all arrays
  const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);

  // Create a new array with total length and fill it with elements of the arrays
  const result = new Uint8Array(totalLength);

  // Copy each array into the result
  let length = 0;
  for (const array of arrays) {
    result.set(array, length);
    length += array.length;
  }

  return result;
}

/**
 * Encodes data in bencode.
 *
 * @param  {Uint8Array|Array|String|Object|Number|Boolean} data
 * @return {Uint8Array}
 */
export function encode(data: any, outBuffer?: Uint8Array, offset?: number) {
  const buffers = [] as Array<Uint8Array>;
  let result = null;

  encode._encode(buffers, data);
  result = concat(buffers);
  encode.bytes = result.length;

  if (ArrayBuffer.isView(outBuffer)) {
    outBuffer.set(result, offset);
    return outBuffer;
  }

  return result;
}

encode.bytes = -1;
encode._floatConversionDetected = false;

encode._encode = function (buffers: Array<Uint8Array>, data: any) {
  if (data == null) {
    return;
  }

  switch (getType(data)) {
    case "object":
      encode.dict(buffers, data);
      break;
    case "map":
      encode.dictMap(buffers, data);
      break;
    case "array":
      encode.list(buffers, data);
      break;
    case "set":
      encode.listSet(buffers, data);
      break;
    case "string":
      encode.string(buffers, data);
      break;
    case "number":
      encode.number(buffers, data);
      break;
    case "boolean":
      encode.number(buffers, data);
      break;
    case "arraybufferview":
      encode.buffer(buffers, new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
      break;
    case "arraybuffer":
      encode.buffer(buffers, new Uint8Array(data));
      break;
  }
};

const buffE = new Uint8Array([0x65]);
const buffD = new Uint8Array([0x64]);
const buffL = new Uint8Array([0x6c]);

encode.buffer = function (buffers: Array<Uint8Array>, data: any) {
  buffers.push(text2arr(data.length + ":"), data);
};

encode.string = function (buffers: Array<Uint8Array>, data: any) {
  buffers.push(text2arr(text2arr(data).byteLength + ":" + data));
};

encode.number = function (buffers: Array<Uint8Array>, data: any) {
  if (Number.isInteger(data)) return buffers.push(text2arr("i" + BigInt(data) + "e"));

  const maxLo = 0x80000000;
  const hi = (data / maxLo) << 0;
  const lo = (data % maxLo) << 0;
  const val = hi * maxLo + lo;

  buffers.push(text2arr("i" + val + "e"));

  if (val !== data && !encode._floatConversionDetected) {
    encode._floatConversionDetected = true;
    console.warn(
      'WARNING: Possible data corruption detected with value "' + data + '":',
      'Bencoding only defines support for integers, value was converted to "' + val + '"',
    );
    console.trace();
  }
};

encode.dict = function (buffers: Array<Uint8Array>, data: any) {
  buffers.push(buffD);

  let j = 0;
  let k;
  // fix for issue #13 - sorted dicts
  const keys = Object.keys(data).sort();
  const kl = keys.length;

  for (; j < kl; j++) {
    k = keys[j];
    if (data[k] == null) continue;
    encode.string(buffers, k);
    encode._encode(buffers, data[k]);
  }

  buffers.push(buffE);
};

encode.dictMap = function (buffers: Array<Uint8Array>, data: any) {
  buffers.push(buffD);

  const keys = Array.from(data.keys()).sort();

  for (const key of keys) {
    if (data.get(key) == null) continue;
    ArrayBuffer.isView(key) ? encode._encode(buffers, key) : encode.string(buffers, String(key));
    encode._encode(buffers, data.get(key));
  }

  buffers.push(buffE);
};

encode.list = function (buffers: Array<Uint8Array>, data: any) {
  let i = 0;
  const c = data.length;
  buffers.push(buffL);

  for (; i < c; i++) {
    if (data[i] == null) continue;
    encode._encode(buffers, data[i]);
  }

  buffers.push(buffE);
};

encode.listSet = function (buffers: Array<Uint8Array>, data: any) {
  buffers.push(buffL);

  for (const item of data) {
    if (item == null) continue;
    encode._encode(buffers, item);
  }

  buffers.push(buffE);
};
