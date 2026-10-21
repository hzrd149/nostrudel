import { NostrEvent } from "nostr-tools";
import { BehaviorSubject, Subject } from "rxjs";

import {
  getNappletArchetypes,
  getNappletDescription,
  getNappletNaddr,
  getNappletTitle,
  type NappletArchetype,
} from "../helpers/nostr/napplets";
import {
  parseInstalledNappletEntries,
  type IntentHandlerPreferences,
  type NappletSyncData,
} from "../helpers/nostr/napplet-sync";

export type InstalledNapplet = {
  address: string;
  title: string;
  description?: string;
  pubkey: string;
  archetypes: NappletArchetype[];
  installedAt: number;
  lastOpenedAt: number;
};

const STORAGE_KEY = "nostrudel:napplet:installed";
const HANDLER_STORAGE_KEY = "nostrudel:napplet:intent-handlers";

/** The account pubkey whose synced installs are active, or undefined for the device list */
let scope: string | undefined;

function scopedKey(key: string, pubkey = scope) {
  return pubkey ? `${key}:${pubkey}` : key;
}

/** Emits when the user installs, uninstalls, or changes a default handler (not on open or sync) */
export const localNappletChanges$ = new Subject<void>();

export function intentKey(archetype: string, action = "open") {
  return `${archetype}/${action}`;
}

function read(pubkey = scope): InstalledNapplet[] {
  try {
    return parseInstalledNappletEntries(JSON.parse(localStorage.getItem(scopedKey(STORAGE_KEY, pubkey)) ?? "[]")).map(
      (item) => ({ ...item, lastOpenedAt: item.lastOpenedAt ?? item.installedAt }),
    );
  } catch {
    return [];
  }
}

function sortInstalled(list: InstalledNapplet[]) {
  return [...list].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

/** Installed napplets, most recently opened first */
export const installedNapplets$ = new BehaviorSubject<InstalledNapplet[]>(sortInstalled(read()));

function write(list: InstalledNapplet[]) {
  localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(list));
  installedNapplets$.next(sortInstalled(list));
}

export function getInstalledNapplets() {
  return installedNapplets$.value;
}

export function isNappletInstalled(address: string) {
  return getInstalledNapplets().some((item) => item.address === address);
}

export function getInstalledNapplet(address: string) {
  return getInstalledNapplets().find((item) => item.address === address);
}

export function getInstalledNappletByArchetype(archetype: string, installed = getInstalledNapplets()) {
  return installed.find((item) => item.archetypes.some((entry) => entry.name === archetype));
}

export function getInstalledNappletsForIntent(archetype: string, action = "open", installed = getInstalledNapplets()) {
  return installed.filter((item) =>
    item.archetypes.some((entry) => entry.name === archetype && entry.actions.includes(action)),
  );
}

function readHandlerPreferences(pubkey = scope): IntentHandlerPreferences {
  try {
    const parsed = JSON.parse(localStorage.getItem(scopedKey(HANDLER_STORAGE_KEY, pubkey)) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Default intent handler addresses keyed by `archetype/action` */
export const intentHandlerPreferences$ = new BehaviorSubject<IntentHandlerPreferences>(readHandlerPreferences());

function writeHandlerPreferences(preferences: IntentHandlerPreferences) {
  localStorage.setItem(scopedKey(HANDLER_STORAGE_KEY), JSON.stringify(preferences));
  intentHandlerPreferences$.next(preferences);
}

// Keep other tabs' installs and handler choices in sync
window.addEventListener("storage", (e) => {
  if (e.key === scopedKey(STORAGE_KEY)) installedNapplets$.next(sortInstalled(read()));
  else if (e.key === scopedKey(HANDLER_STORAGE_KEY)) intentHandlerPreferences$.next(readHandlerPreferences());
});

/**
 * Switches between the device list (no pubkey) and an account's synced list. The first time an
 * account is used on this device it starts from a copy of the device list, so existing installs
 * carry over and get synced.
 */
export function setInstalledNappletScope(pubkey: string | undefined) {
  if (pubkey === scope) return;

  if (pubkey && localStorage.getItem(scopedKey(STORAGE_KEY, pubkey)) === null) {
    localStorage.setItem(scopedKey(STORAGE_KEY, pubkey), JSON.stringify(read(undefined)));
    localStorage.setItem(scopedKey(HANDLER_STORAGE_KEY, pubkey), JSON.stringify(readHandlerPreferences(undefined)));
  }

  scope = pubkey;
  installedNapplets$.next(sortInstalled(read()));
  intentHandlerPreferences$.next(readHandlerPreferences());
}

/** The installs and handler choices in the shape that is synced to the account */
export function getNappletSyncData(): NappletSyncData {
  return {
    installed: getInstalledNapplets().map(({ lastOpenedAt: _lastOpenedAt, ...item }) => item),
    handlers: intentHandlerPreferences$.value,
  };
}

export function applyNappletSyncData(data: NappletSyncData) {
  const opened = new Map(getInstalledNapplets().map((item) => [item.address, item.lastOpenedAt]));
  write(data.installed.map((item) => ({ ...item, lastOpenedAt: opened.get(item.address) ?? item.installedAt })));
  writeHandlerPreferences(data.handlers);
}

export function getDefaultIntentHandler(archetype: string, action = "open") {
  const address = intentHandlerPreferences$.value[intentKey(archetype, action)];
  return address ? getInstalledNapplet(address) : undefined;
}

export function setDefaultIntentHandler(archetype: string, action: string, address: string) {
  writeHandlerPreferences({ ...intentHandlerPreferences$.value, [intentKey(archetype, action)]: address });
  localNappletChanges$.next();
}

export function clearDefaultIntentHandler(archetype: string, action = "open") {
  const preferences = { ...intentHandlerPreferences$.value };
  delete preferences[intentKey(archetype, action)];
  writeHandlerPreferences(preferences);
  localNappletChanges$.next();
}

export function getInstalledNappletForIntent(archetype: string, action = "open", installed = getInstalledNapplets()) {
  const handlers = getInstalledNappletsForIntent(archetype, action, installed);
  const preferred = getDefaultIntentHandler(archetype, action);
  return preferred && handlers.some((handler) => handler.address === preferred.address) ? preferred : handlers[0];
}

/** The launch path for an installed napplet: its archetype when no other installed app claims it, otherwise its naddr */
export function getInstalledNappletPath(napplet: InstalledNapplet, installed = getInstalledNapplets()) {
  const archetype = napplet.archetypes.find(
    (entry) =>
      !installed.some(
        (other) => other.address !== napplet.address && other.archetypes.some((o) => o.name === entry.name),
      ),
  )?.name;
  return `/app/${archetype || napplet.address}`;
}

export function installNapplet(event: NostrEvent, address = getNappletNaddr(event)) {
  if (!address) return undefined;

  const now = Date.now();
  const existing = getInstalledNapplet(address);
  const next: InstalledNapplet = {
    address,
    title: getNappletTitle(event),
    description: getNappletDescription(event),
    pubkey: event.pubkey,
    archetypes: getNappletArchetypes(event),
    installedAt: existing?.installedAt ?? now,
    lastOpenedAt: now,
  };

  write([next, ...getInstalledNapplets().filter((item) => item.address !== address)]);
  if (!existing) localNappletChanges$.next();
  return next;
}

export function touchInstalledNapplet(address: string) {
  write(
    getInstalledNapplets().map((item) => (item.address === address ? { ...item, lastOpenedAt: Date.now() } : item)),
  );
}

export function uninstallNapplet(address: string) {
  write(getInstalledNapplets().filter((item) => item.address !== address));

  const preferences = { ...intentHandlerPreferences$.value };
  for (const [key, value] of Object.entries(preferences)) {
    if (value === address) delete preferences[key];
  }
  writeHandlerPreferences(preferences);
  localNappletChanges$.next();
}
