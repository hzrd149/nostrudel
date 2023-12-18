import { bech32 } from "bech32";

/** @deprecated */
export function decodeText(encoded: string) {
  const decoded = bech32.decode(encoded, Infinity);
  const text = new TextDecoder().decode(new Uint8Array(bech32.fromWords(decoded.words)));
  return {
    text,
    prefix: decoded.prefix,
  };
}
