export const mentionNpubOrNote = /(?:\s|^)(@|nostr:)?((npub1|note1)[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})(?:\s|$)/gi;
export const matchNostrLink = /(nostr:|@)?((npub|note|nprofile|nevent)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/gi;
export const matchHashtag = /(^|[^\p{L}])#([\p{L}\p{N}]+)/gu;
export const matchLink = /https?:\/\/([a-zA-Z0-9\.\-]+\.[a-zA-Z]+)([\p{Letter}\p{Number}&\.-\/\?=#\-@%\+_,:]*)/gu;
