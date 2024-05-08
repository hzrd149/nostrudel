import { isValidRelayURL, validateRelayURL } from "./relay";

export const convertToUrl = (url: string | URL) => (url instanceof URL ? url : new URL(url));

export const IMAGE_EXT = [".svg", ".gif", ".png", ".jpg", ".jpeg", ".webp", ".avif"];
export const VIDEO_EXT = [".mp4", ".mkv", ".webm", ".mov"];
export const AUDIO_EXT = [".mp3", ".wav", ".ogg", ".aac"];

export function isMediaURL(url: string | URL) {
  return isImageURL(url) || isVideoURL(url);
}
export function isImageURL(url: string | URL) {
  const u = new URL(url);
  return IMAGE_EXT.some((ext) => u.pathname.endsWith(ext));
}
export function isVideoURL(url: string | URL) {
  const u = new URL(url);
  return VIDEO_EXT.some((ext) => u.pathname.endsWith(ext));
}
export function isAudioURL(url: string | URL) {
  const u = new URL(url);
  return AUDIO_EXT.some((ext) => u.pathname.endsWith(ext));
}

export function getMediaHashFromURL(url: string | URL) {
  const u = new URL(url);
  const matches = Array.from(u.pathname.matchAll(/[0-9a-f]{64}/gi));

  return matches[matches.length - 1][0] as string | undefined;
}

export function replaceDomain(url: string | URL, replacementUrl: string | URL) {
  const newUrl = new URL(url);
  replacementUrl = convertToUrl(replacementUrl);
  newUrl.host = replacementUrl.host;
  newUrl.protocol = replacementUrl.protocol;
  if (replacementUrl.port) newUrl.port = replacementUrl.port;
  if (replacementUrl.username) newUrl.username = replacementUrl.username;
  if (replacementUrl.password) newUrl.password = replacementUrl.password;
  return newUrl;
}
