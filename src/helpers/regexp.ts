export const mentionNpubOrNote = /@?((npub1|note1)[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/gi;
export const matchImageUrls =
  /https?:\/\/([\dA-z\.-]+\.[A-z\.]{2,12})((?:\/[\+~%\/\.\w\-_]*)?\.(?:svg|gif|png|jpg|jpeg|webp|avif))(\??(?:[\?#\-\+=&;%@\.\w_]*)#?(?:[\-\.\!\/\\\w]*))?/i;

export const matchNostrLink = /(nostr:|@)?((npub|note|nprofile|nevent)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/i;
