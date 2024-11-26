import { NostrEvent } from "../../types/nostr-event";

export const FLARE_VIDEO_KIND = 34235;

export function getVideoTitle(video: NostrEvent) {
  const title = video.tags.find((t) => t[0] === "title")?.[1];
  if (!title) throw new Error("Missing title");
  return title;
}
export function getVideoUrl(video: NostrEvent) {
  const url = video.tags.find((t) => t[0] === "url")?.[1];
  if (!url) throw new Error("Missing url");
  return url;
}
export function getVideoSummary(video: NostrEvent) {
  return video.tags.find((t) => t[0] === "summary")?.[1];
}
export function getVideoSize(video: NostrEvent) {
  const str = video.tags.find((t) => t[0] === "size")?.[1];
  return str ? parseInt(str) || undefined : undefined;
}
export function getVideoDuration(video: NostrEvent) {
  const str = video.tags.find((t) => t[0] === "duration")?.[1];
  return str ? parseInt(str) || undefined : undefined;
}
export function getVideoPublishDate(video: NostrEvent) {
  const str = video.tags.find((t) => t[0] === "published_at")?.[1];
  return str ? parseInt(str) || undefined : undefined;
}
export function getVideoImages(video: NostrEvent) {
  const thumb = video.tags.find((t) => t[0] === "thumb")?.[1];
  const image = video.tags.find((t) => t[0] === "image")?.[1];
  return { thumb, image };
}
