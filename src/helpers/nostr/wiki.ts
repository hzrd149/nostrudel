import { NostrEvent } from "nostr-tools";

export const WIKI_PAGE_KIND = 30818;

export function getPageTitle(page: NostrEvent) {
  return page.tags.find((t) => t[0] === "title")?.[1];
}

export function getPageTopic(page: NostrEvent) {
  const d = page.tags.find((t) => t[0] === "d")?.[1];
  if (!d) throw new Error("Page missing d tag");
  return d;
}

export function getPageSummary(page: NostrEvent) {
  const summary = page.tags.find((t) => t[0] === "summary")?.[1];
  return summary || page.content.split("\n")[0];
}
