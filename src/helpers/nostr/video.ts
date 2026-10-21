import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const FLARE_VIDEO_KIND = 34235;

export function getVideoTitle(video: NostrEvent) {
  return getTagValue(video, "title");
}
export function getVideoSummary(video: NostrEvent) {
  return getTagValue(video, "summary");
}
export function getVideoImages(video: NostrEvent) {
  const thumb = getTagValue(video, "thumb");
  const image = getTagValue(video, "image");
  return { thumb, image };
}
