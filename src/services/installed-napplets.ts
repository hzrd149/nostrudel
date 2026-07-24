import { NostrEvent } from "nostr-tools";

import { getNappletDescription, getNappletNaddr, getNappletTitle } from "../helpers/nostr/napplets";

export type InstalledNapplet = {
  address: string;
  title: string;
  description?: string;
  pubkey: string;
  installedAt: number;
  lastOpenedAt: number;
};

const STORAGE_KEY = "nostrudel:napplet:installed";

function read(): InstalledNapplet[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as InstalledNapplet[]) : [];
  } catch {
    return [];
  }
}

function write(list: InstalledNapplet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getInstalledNapplets() {
  return read().sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export function isNappletInstalled(address: string) {
  return read().some((item) => item.address === address);
}

export function installNapplet(event: NostrEvent, address = getNappletNaddr(event)) {
  if (!address) return undefined;

  const now = Date.now();
  const existing = read().find((item) => item.address === address);
  const next: InstalledNapplet = {
    address,
    title: getNappletTitle(event),
    description: getNappletDescription(event),
    pubkey: event.pubkey,
    installedAt: existing?.installedAt ?? now,
    lastOpenedAt: now,
  };

  write([next, ...read().filter((item) => item.address !== address)]);
  return next;
}

export function touchInstalledNapplet(address: string) {
  write(read().map((item) => (item.address === address ? { ...item, lastOpenedAt: Date.now() } : item)));
}

export function uninstallNapplet(address: string) {
  write(read().filter((item) => item.address !== address));
}
