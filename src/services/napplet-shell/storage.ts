import { map, Observable, startWith, Subject } from "rxjs";

/** A NAP-STORAGE value kehto's runtime persisted to localStorage for a napplet */
export type NappletStorageEntry = {
  /** The full localStorage key */
  storageKey: string;
  /** The key the napplet used */
  key: string;
  /** The napplet version (build hash) that wrote it */
  aggregateHash: string;
  /** Whether it was scoped to a single window instead of shared across windows */
  instance: boolean;
  value: string;
  bytes: number;
};

/** kehto's marker for window-scoped keys: `@i/<windowId>:<key>` */
const INSTANCE_MARKER = "@i/";

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

/**
 * kehto scopes storage by `dTag:aggregateHash` and older runtimes also by pubkey. The current
 * format has no pubkey, so its keys are only matched for build hashes known to belong to this
 * napplet; the legacy formats include the pubkey and match every version.
 */
function parseStorageKey(storageKey: string, pubkey: string, dTag: string, hashes: Set<string>) {
  const prefixes = [`napplet-state:${pubkey}:${dTag}:`, `napp-state:${pubkey}:${dTag}:`];
  let rest = prefixes.map((prefix) => storageKey.startsWith(prefix) && storageKey.slice(prefix.length)).find(Boolean);

  const current = `napplet-state:${dTag}:`;
  if (!rest && storageKey.startsWith(current)) {
    const candidate = storageKey.slice(current.length);
    if (hashes.has(candidate.slice(0, candidate.indexOf(":")))) rest = candidate;
  }
  if (!rest) return undefined;

  const split = rest.indexOf(":");
  if (split < 0) return undefined;
  const aggregateHash = rest.slice(0, split);
  let key = rest.slice(split + 1);

  const instance = key.startsWith(INSTANCE_MARKER);
  if (instance) key = key.slice(key.indexOf(":") + 1);

  return { aggregateHash, key, instance };
}

export function getNappletStorageEntries(
  pubkey: string,
  dTag: string,
  hashes: Iterable<string>,
): NappletStorageEntry[] {
  const known = new Set(hashes);
  const entries: NappletStorageEntry[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey) continue;

    const parsed = parseStorageKey(storageKey, pubkey, dTag, known);
    if (!parsed) continue;

    const value = localStorage.getItem(storageKey) ?? "";
    entries.push({ storageKey, ...parsed, value, bytes: byteLength(value) });
  }

  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

const storageChanges$ = new Subject<void>();

/** A napplet's stored values, updated when they are deleted from here */
export function nappletStorageEntries$(
  pubkey: string,
  dTag: string,
  hashes: string[],
): Observable<NappletStorageEntry[]> {
  return storageChanges$.pipe(
    startWith(undefined),
    map(() => getNappletStorageEntries(pubkey, dTag, hashes)),
  );
}

export function removeNappletStorageEntries(entries: NappletStorageEntry[]) {
  for (const entry of entries) localStorage.removeItem(entry.storageKey);
  storageChanges$.next();
}
