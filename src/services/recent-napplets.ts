import { NostrEvent } from "nostr-tools";

import { getNappletDTag, type NappletArchetype } from "../helpers/nostr/napplets";

/** A locally-remembered napplet the user has loaded, so it can be re-selected quickly. */
export type RecentNapplet = {
  /** The NIP-19 pointer (naddr/nevent/note) used in the URL. */
  address: string;
  /** Human title captured at load time. */
  title: string;
  /** Author pubkey of the manifest event. */
  pubkey: string;
  /** Manifest d tag, used as the NAP-INTENT handler id when available. */
  dTag?: string;
  /** Manifest-declared archetypes this napplet can handle. */
  archetypes: NappletArchetype[];
  /** When it was last loaded (epoch ms). */
  loadedAt: number;
};

const STORAGE_KEY = "nostrudel:napplet:recent";
const MAX_ENTRIES = 12;

function normalize(entry: Partial<RecentNapplet>): RecentNapplet | undefined {
  if (!entry.address || !entry.title || !entry.pubkey || !entry.loadedAt) return undefined;

  return {
    address: entry.address,
    title: entry.title,
    pubkey: entry.pubkey,
    dTag: entry.dTag,
    archetypes: Array.isArray(entry.archetypes) ? entry.archetypes : [],
    loadedAt: entry.loadedAt,
  };
}

function read(): RecentNapplet[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.flatMap((item) => normalize(item) ?? []) : [];
  } catch {
    return [];
  }
}

function write(list: RecentNapplet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
}

/** Most-recently loaded napplets first. */
export function getRecentNapplets(): RecentNapplet[] {
  return read().sort((a, b) => b.loadedAt - a.loadedAt);
}

/** Record (or bump) a napplet as most-recently loaded, de-duplicated by address. */
export function addRecentNapplet(entry: Omit<RecentNapplet, "loadedAt">) {
  const list = read().filter((item) => item.address !== entry.address);
  list.unshift({ ...entry, loadedAt: Date.now() });
  write(list);
}

export function addRecentNappletEvent(entry: {
  address: string;
  title: string;
  event: NostrEvent;
  archetypes: NappletArchetype[];
}) {
  addRecentNapplet({
    address: entry.address,
    title: entry.title,
    pubkey: entry.event.pubkey,
    dTag: getNappletDTag(entry.event),
    archetypes: entry.archetypes,
  });
}

/** Forget a single recent napplet by address. */
export function removeRecentNapplet(address: string) {
  write(read().filter((item) => item.address !== address));
}
