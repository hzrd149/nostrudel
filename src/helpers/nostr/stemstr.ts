import { NostrEvent } from "nostr-tools";

export const STEMSTR_RELAY = "wss://relay.stemstr.app";
export const STEMSTR_TRACK_KIND = 1808;

export function getSha256Hash(track: NostrEvent) {
  return track.tags.find((t) => t[0] === "x")?.[1];
}
export function getWaveform(track: NostrEvent) {
  const tag = track.tags.find((t) => t[0] === "waveform");
  if (tag?.[1]) return JSON.parse(tag[1]) as number[];
}
export function getHashtags(track: NostrEvent) {
  return track.tags.filter((t) => t[0] === "t" && t[1]).map((t) => t[1] as string);
}
export function getDownloadURL(track: NostrEvent) {
  const tag = track.tags.find((t) => t[0] === "download_url");
  if (!tag) return;
  const url = tag[1];
  if (!url) throw new Error("missing download url");
  const format = tag[2];
  return { url, format };
}
export function getStreamURL(track: NostrEvent) {
  const tag = track.tags.find((t) => t[0] === "stream_url");
  if (!tag) return;
  const url = tag[1];
  if (!url) throw new Error("missing download url");
  const format = tag[2];
  return { url, format };
}
