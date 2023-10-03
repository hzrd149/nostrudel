export const getMatchNostrLink = () =>
  /(nostr:|@)?((npub|note|nprofile|nevent|nrelay|naddr)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/gi;
export const getMatchHashtag = () => /(^|[^\p{L}])#([\p{L}\p{N}]+)/gu;
export const getMatchLink = () =>
  /https?:\/\/([a-zA-Z0-9\.\-]+\.[a-zA-Z]+)([\p{Letter}\p{Number}&\.-\/\?=#\-@%\+_,:!]*)/gu;
export const getMatchEmoji = () => /:([a-zA-Z0-9_-]+):/gi;

// read more https://www.regular-expressions.info/unicode.html#category
export function stripInvisibleChar(str?: string) {
  return str && str.replaceAll(/[\p{Cf}\p{Zs}]/gu, "");
}
