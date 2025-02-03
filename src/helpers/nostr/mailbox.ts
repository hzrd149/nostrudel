import { kinds } from "nostr-tools";
import { DraftNostrEvent, NostrEvent, RTag, Tag, isRTag } from "../../types/nostr-event";
import { safeRelayUrl } from "../relay";
import { cloneEvent } from "./event";
import { RelayMode } from "../../services/app-relays";

/** fixes or removes any bad r tags */
export function cleanRTags(tags: Tag[]) {
  const newTags: Tag[] = [];
  for (const tag of tags) {
    if (tag[0] === "r") {
      if (!tag[1]) continue;
      const url = safeRelayUrl(tag[1]);
      if (url) newTags.push(tag[2] ? ["r", url, tag[2]] : ["r", url]);
    } else newTags.push(tag);
  }
  return newTags;
}

export function parseRTag(tag: RTag): { url: string; mode: RelayMode } {
  const url = tag[1];
  const mode = tag[2] === "write" ? RelayMode.WRITE : tag[2] === "read" ? RelayMode.READ : RelayMode.BOTH;
  return { url, mode };
}
export function createRelayTag(url: string, mode: RelayMode) {
  switch (mode) {
    case RelayMode.WRITE:
      return ["r", url, "write"];
    case RelayMode.READ:
      return ["r", url, "read"];
    default:
    case RelayMode.BOTH:
      return ["r", url];
  }
}

export function getRelaysFromMailbox(list: NostrEvent | DraftNostrEvent): { url: string; mode: RelayMode }[] {
  return cleanRTags(list.tags).filter(isRTag).map(parseRTag);
}

export function addRelayModeToMailbox(list: NostrEvent | undefined, relay: string, mode: RelayMode): DraftNostrEvent {
  const draft = cloneEvent(kinds.RelayList, list);
  draft.tags = cleanRTags(draft.tags);

  const existing = draft.tags.find((t) => t[0] === "r" && t[1] === relay) as RTag;
  if (existing) {
    const p = parseRTag(existing);
    draft.tags = draft.tags.map((t) => (t === existing ? createRelayTag(p.url, p.mode | mode) : t));
  } else draft.tags.push(createRelayTag(relay, mode));
  return draft;
}
export function removeRelayModeFromMailbox(
  list: NostrEvent | undefined,
  relay: string,
  mode: RelayMode,
): DraftNostrEvent {
  const draft = cloneEvent(kinds.RelayList, list);
  draft.tags = cleanRTags(draft.tags);

  const existing = draft.tags.find((t) => t[0] === "r" && t[1] === relay) as RTag;
  if (existing) {
    const p = parseRTag(existing);
    if (p.mode & mode) {
      if ((p.mode & ~mode) === RelayMode.NONE) draft.tags = draft.tags.filter((t) => t !== existing);
      else draft.tags = draft.tags.map((t) => (t === existing ? createRelayTag(p.url, p.mode & ~mode) : t));
    }
  }
  return draft;
}

export function createRTagsFromRelaySets(readRelays: Iterable<string>, writeRelays: Iterable<string>) {
  const relays: Record<string, number> = {};
  for (const r of readRelays) relays[r] = (relays[r] ?? 0) | RelayMode.READ;
  for (const r of writeRelays) relays[r] = (relays[r] ?? 0) | RelayMode.WRITE;
  console.log(relays);

  return Object.entries(relays).map(([url, mode]) => createRelayTag(url, mode));
}
