import { NostrEvent, nip19 } from "nostr-tools";
import { parseCoordinate } from "./event";

export const WIKI_PAGE_KIND = 30818;

export function getPageTitle(page: NostrEvent) {
  return page.tags.find((t) => t[0] === "title")?.[1] || page.tags.find((t) => t[0] === "d")?.[1];
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

export function getPageForks(page: NostrEvent) {
  const addressFork = page.tags.find((t) => t[0] === "a" && t[1] && t[3]);
  const eventFork = page.tags.find((t) => t[0] === "a" && t[1] && t[3]);

  const address = addressFork ? parseCoordinate(addressFork[1], true) ?? undefined : undefined;
  const event: nip19.EventPointer | undefined = eventFork ? { id: eventFork[1] } : undefined;

  return { event, address };
}

export function isPageFork(page: NostrEvent) {
  return page.tags.some((t) => (t[0] === "a" || t[0] === "e") && t[3] === "fork");
}

export function validatePage(page: NostrEvent) {
  try {
    getPageTopic(page);
    return true;
  } catch (error) {
    return false;
  }
}
