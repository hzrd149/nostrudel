/** @deprecated */
export const getMatchNostrLink = () =>
  /(nostr:|@)?((npub|note|nprofile|nevent|nrelay|naddr)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/gi;
export const getMatchHashtag = () => /(^|[^\p{L}])#([\p{L}\p{N}\p{M}]+)/gu;
export const getMatchSimpleEmail = () => /^[^\s]{1,64}@[^\s]+\.[^\s]{2,}$/;
