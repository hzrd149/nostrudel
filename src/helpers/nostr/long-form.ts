import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export function getArticleTitle(event: NostrEvent) {
  return getTagValue(event, "title");
}
export function getArticleSummary(event: NostrEvent) {
  return getTagValue(event, "summary");
}
export function getArticleImage(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "image")?.[1];
}
export function getArticlePublishDate(event: NostrEvent) {
  const timestamp = event.tags.find((t) => t[0] === "published_at")?.[1];
  return timestamp ? parseInt(timestamp) : undefined;
}
