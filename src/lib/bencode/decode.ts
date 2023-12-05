// copied from https://git.v0l.io/Kieran/dtan/src/branch/main/src/bencode/decode.ts

import { bytesToHex } from "@noble/hashes/utils";

const INTEGER_START = 0x69; // 'i'
const STRING_DELIM = 0x3a; // ':'
const DICTIONARY_START = 0x64; // 'd'
const LIST_START = 0x6c; // 'l'
const END_OF_TYPE = 0x65; // 'e'

export type BencodeValue = number | Uint8Array | BencodeValue[] | { [key: string]: BencodeValue };

/**
 * replaces parseInt(buffer.toString('ascii', start, end)).
 * For strings with less then ~30 charachters, this is actually a lot faster.
 *
 * @param {Uint8Array} buffer
 * @param {Number} start
 * @param {Number} end
 * @return {Number} calculated number
 */
function getIntFromBuffer(buffer: Uint8Array, start: number, end: number) {
  let sum = 0;
  let sign = 1;

  for (let i = start; i < end; i++) {
    const num = buffer[i];

    if (num < 58 && num >= 48) {
      sum = sum * 10 + (num - 48);
      continue;
    }

    if (i === start && num === 43) {
      // +
      continue;
    }

    if (i === start && num === 45) {
      // -
      sign = -1;
      continue;
    }

    if (num === 46) {
      // .
      // its a float. break here.
      break;
    }

    throw new Error("not a number: buffer[" + i + "] = " + num);
  }

  return sum * sign;
}

/**
 * Decodes bencoded data.
 *
 * @param  {Uint8Array} data
 * @param  {Number} start (optional)
 * @param  {Number} end (optional)
 * @param  {String} encoding (optional)
 * @return {Object|Array|Uint8Array|String|Number}
 */
export function decode(data: Uint8Array, start?: number, end?: number, encoding?: string) {
  const dec = {
    position: 0,
    bytes: 0,
    encoding,
    data: data.subarray(start, end),
  } as Decode;
  dec.bytes = dec.data.length;
  return next(dec);
}

interface Decode {
  bytes: number;
  position: number;
  data: Uint8Array;
  encoding?: string;
}

function buffer(dec: Decode) {
  let sep = find(dec, STRING_DELIM);
  const length = getIntFromBuffer(dec.data, dec.position, sep);
  const end = ++sep + length;

  dec.position = end;

  return dec.data.subarray(sep, end);
}

function next(dec: Decode): BencodeValue {
  switch (dec.data[dec.position]) {
    case DICTIONARY_START:
      return dictionary(dec);
    case LIST_START:
      return list(dec);
    case INTEGER_START:
      return integer(dec);
    default:
      return buffer(dec);
  }
}

function find(dec: Decode, chr: number) {
  let i = dec.position;
  const c = dec.data.length;
  const d = dec.data;

  while (i < c) {
    if (d[i] === chr) return i;
    i++;
  }

  throw new Error('Invalid data: Missing delimiter "' + String.fromCharCode(chr) + '" [0x' + chr.toString(16) + "]");
}

function dictionary(dec: Decode) {
  dec.position++;

  const dict = {} as Record<string, BencodeValue>;

  while (dec.data[dec.position] !== END_OF_TYPE) {
    const bf = buffer(dec);
    let key = new TextDecoder().decode(bf);
    if (key.includes("\uFFFD")) key = bytesToHex(bf);
    dict[key] = next(dec);
  }

  dec.position++;

  return dict;
}

function list(dec: Decode) {
  dec.position++;

  const lst = [] as Array<BencodeValue>;

  while (dec.data[dec.position] !== END_OF_TYPE) {
    lst.push(next(dec));
  }

  dec.position++;

  return lst;
}

function integer(dec: Decode) {
  const end = find(dec, END_OF_TYPE);
  const number = getIntFromBuffer(dec.data, dec.position + 1, end);

  dec.position += end + 1 - dec.position;

  return number;
}

export default decode;
