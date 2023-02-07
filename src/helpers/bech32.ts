import { bech32 } from "bech32";

export function encodeText(prefix: string, text: string) {
  const words = bech32.toWords(new TextEncoder().encode(text));
  return bech32.encode(prefix, words, Infinity);
}
