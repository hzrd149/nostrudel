import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const FLARE_VIDEO_KIND = 34235;

export function getVideoTitle(video: NostrEvent) {
  return getTagValue(video, "title");
}
export function getVideoUrl(video: NostrEvent) {
  const url = getTagValue(video, "url");
  if (!url) throw new Error("Missing url");
  return url;
}
export function getVideoSummary(video: NostrEvent) {
  return getTagValue(video, "summary");
}
export function getVideoSize(video: NostrEvent) {
  const str = getTagValue(video, "size");
  return str ? parseInt(str) || undefined : undefined;
}
export function getVideoDuration(video: NostrEvent) {
  const str = getTagValue(video, "duration");
  return str ? parseInt(str) || undefined : undefined;
}
export function getVideoPublishDate(video: NostrEvent) {
  const str = video.tags.find((t) => t[0] === "published_at")?.[1];
  return str ? parseInt(str) || undefined : undefined;
}
export function getVideoImages(video: NostrEvent) {
  const thumb = getTagValue(video, "thumb");
  const image = getTagValue(video, "image");
  return { thumb, image };
}

export function isValidVideo(video: NostrEvent) {
  return video.tags.some((t) => t[0] === "url" && t[1]);
}
