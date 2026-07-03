/** A locally-remembered napplet the user has loaded, so it can be re-selected quickly. */
export type RecentNapplet = {
  /** The NIP-19 pointer (naddr/nevent/note) used in the URL. */
  address: string;
  /** Human title captured at load time. */
  title: string;
  /** Author pubkey of the manifest event. */
  pubkey: string;
  /** When it was last loaded (epoch ms). */
  loadedAt: number;
};

const STORAGE_KEY = "nostrudel:napplet:recent";
const MAX_ENTRIES = 12;

function read(): RecentNapplet[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as RecentNapplet[]) : [];
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

/** Forget a single recent napplet by address. */
export function removeRecentNapplet(address: string) {
  write(read().filter((item) => item.address !== address));
}
