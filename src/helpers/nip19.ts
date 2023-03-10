import { bech32 } from "bech32";

export function isHex(key?: string) {
  if (key?.toLowerCase()?.match(/^[0-9a-f]{64}$/)) return true;
  return false;
}

export enum Bech32Prefix {
  Pubkey = "npub",
  SecKey = "nsec",
  Note = "note",
}

export function isBech32Key(bech32String: string) {
  try {
    const { prefix } = bech32.decode(bech32String.toLowerCase());
    if (!["npub", "nsec", "note"].includes(prefix)) return false;
    if (!isHex(bech32ToHex(bech32String))) return false;
  } catch (error) {
    return false;
  }
  return true;
}

export function bech32ToHex(bech32String: string) {
  try {
    const { words } = bech32.decode(bech32String);
    return toHexString(new Uint8Array(bech32.fromWords(words)));
  } catch (error) {}
  return "";
}

export function hexToBech32(hex: string, prefix: Bech32Prefix) {
  try {
    const hexArray = hexStringToUint8(hex);
    return hexArray && bech32.encode(prefix, bech32.toWords(hexArray));
  } catch (error) {
    // continue
  }
  return null;
}

export function toHexString(buffer: Uint8Array) {
  return buffer.reduce((s, byte) => {
    let hex = byte.toString(16);
    if (hex.length === 1) hex = "0" + hex;
    return s + hex;
  }, "");
}

export function hexStringToUint8(str: string) {
  if (str.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(str)) {
    return null;
  }
  let buffer = new Uint8Array(str.length / 2);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = parseInt(str.substr(2 * i, 2), 16);
  }
  return buffer;
}

export function normalizeToBech32(key: string, prefix: Bech32Prefix = Bech32Prefix.Pubkey) {
  if (isHex(key)) return hexToBech32(key, prefix);
  if (isBech32Key(key)) return key;
  return null;
}
export function normalizeToHex(hex: string) {
  if (isHex(hex)) return hex;
  if (isBech32Key(hex)) return bech32ToHex(hex);
  return null;
}
