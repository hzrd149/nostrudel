import { NostrEvent } from "../../types/nostr-event";

export function getArticleTitle(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "title")?.[1];
}
export function getArticleSummary(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "summary")?.[1];
}
export function getArticleImage(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "image")?.[1];
}
export function getArticlePublishDate(event: NostrEvent) {
  const timestamp = event.tags.find((t) => t[0] === "published_at")?.[1];
  return timestamp ? parseInt(timestamp) : undefined;
}
