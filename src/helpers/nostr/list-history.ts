import { getReplaceableIdentifier } from "applesauce-core/helpers";
import dayjs from "dayjs";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { isAddressableKind } from "nostr-tools/kinds";

/**
 * Tags that may only appear once on a NIP-51 list. When merging versions only a
 * single value (from the newest version) is kept for these.
 * @see https://github.com/nostr-protocol/nips/blob/master/51.md
 */
export const SINGLETON_LIST_TAGS = new Set(["d", "title", "name", "description", "summary", "image", "picture"]);

/** Returns the identity key for a tag used to deduplicate when merging versions */
export function tagIdentity(tag: string[]): string {
  // Singleton tags collapse to just their name, everything else is keyed by name + value
  if (SINGLETON_LIST_TAGS.has(tag[0])) return tag[0];
  return tag[1] !== undefined ? `${tag[0]}:${tag[1]}` : tag[0];
}

/** Builds the filter used to query every historical version of a replaceable list */
export function getListHistoryFilter(list: NostrEvent) {
  if (isAddressableKind(list.kind)) {
    return { kinds: [list.kind], authors: [list.pubkey], "#d": [getReplaceableIdentifier(list)] };
  }
  // Replaceable but not addressable (kind 3, 10000-series) — no "d" tag
  return { kinds: [list.kind], authors: [list.pubkey] };
}

/** Sorts list versions newest first (by created_at) */
export function sortVersions(versions: NostrEvent[]): NostrEvent[] {
  return Array.from(versions).sort((a, b) => b.created_at - a.created_at);
}

export type ListDiff = {
  /** Tags present in `next` but not in `prev` */
  added: string[][];
  /** Tags present in `prev` but not in `next` */
  removed: string[][];
};

/**
 * Computes the tags added and removed going from `prev` (older) to `next` (newer) tag arrays.
 * Tags are matched by their identity (name + value) so reordering is ignored.
 */
export function diffTags(prev: string[][], next: string[][]): ListDiff {
  const prevKeys = new Map(prev.map((t) => [tagIdentity(t), t]));
  const nextKeys = new Map(next.map((t) => [tagIdentity(t), t]));

  const added: string[][] = [];
  for (const [key, tag] of nextKeys) if (!prevKeys.has(key)) added.push(tag);

  const removed: string[][] = [];
  for (const [key, tag] of prevKeys) if (!nextKeys.has(key)) removed.push(tag);

  return { added, removed };
}

/** Computes the tags added and removed between two list events (public tags only) */
export function diffListTags(prev: EventTemplate | NostrEvent, next: EventTemplate | NostrEvent): ListDiff {
  return diffTags(prev.tags, next.tags);
}

/**
 * Returns the tags from a historical `version` that are not already present on the
 * `current` list (matched by identity). These are exactly the tags that a merge would
 * add to the current list. Singleton tags (d, title, ...) the current list already has
 * are never re-added, so the current list's metadata is preserved.
 */
export function getTagsAddedByMerge(current: NostrEvent, version: NostrEvent): string[][] {
  return diffListTags(current, version).added;
}

/** Whether merging `version` into `current` would add any new tags */
export function mergeWouldChangeList(current: NostrEvent, version: NostrEvent): boolean {
  return getTagsAddedByMerge(current, version).length > 0;
}

/**
 * Whether restoring `version` would change the `current` list — i.e. its public tags differ
 * or its (encrypted) content differs. Identical versions offer nothing to restore.
 */
export function restoreWouldChangeList(current: NostrEvent, version: NostrEvent): boolean {
  const { added, removed } = diffListTags(current, version);
  return added.length > 0 || removed.length > 0 || version.content !== current.content;
}

/**
 * Merges the tags from a historical `version` into the `current` list, returning a new
 * draft following NIP-51 rules. Only tags missing from the current list are added; the
 * current list's singleton tags and content are preserved.
 *
 * TODO: merge hidden/private tags too. Decrypt both events' content with the signer
 * (applesauce `unlockHiddenTags` / `getHiddenTags`), union the private tags with the same
 * dedup rules, then re-encrypt the merged set into the draft content.
 */
export function mergeVersionIntoList(current: NostrEvent, version: NostrEvent): EventTemplate {
  return {
    kind: current.kind,
    content: current.content,
    created_at: dayjs().unix(),
    tags: [...current.tags, ...getTagsAddedByMerge(current, version)],
  };
}

/** Clones a historical version into a draft to restore it (with a fresh created_at) */
export function restoreListVersion(version: NostrEvent): EventTemplate {
  return {
    kind: version.kind,
    content: version.content,
    created_at: dayjs().unix(),
    tags: Array.from(version.tags),
  };
}
