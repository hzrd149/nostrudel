import { NostrEvent } from "nostr-tools";
import { BehaviorSubject } from "rxjs";

import {
  getNappletArchetypes,
  getNappletDescription,
  getNappletNaddr,
  getNappletTitle,
  type NappletArchetype,
} from "../helpers/nostr/napplets";

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

type IntentHandlerPreferences = Record<string, string>;

export function intentKey(archetype: string, action = "open") {
  return `${archetype}/${action}`;
}

function read(): InstalledNapplet[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.flatMap((item: Partial<InstalledNapplet>) => {
          if (!item.address || !item.title || !item.pubkey || !item.installedAt || !item.lastOpenedAt) return [];
          return [
            {
              address: item.address,
              title: item.title,
              description: item.description,
              pubkey: item.pubkey,
              archetypes: Array.isArray(item.archetypes) ? item.archetypes : [],
              installedAt: item.installedAt,
              lastOpenedAt: item.lastOpenedAt,
            },
          ];
        })
      : [];
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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

function readHandlerPreferences(): IntentHandlerPreferences {
  try {
    const parsed = JSON.parse(localStorage.getItem(HANDLER_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Default intent handler addresses keyed by `archetype/action` */
export const intentHandlerPreferences$ = new BehaviorSubject<IntentHandlerPreferences>(readHandlerPreferences());

function writeHandlerPreferences(preferences: IntentHandlerPreferences) {
  localStorage.setItem(HANDLER_STORAGE_KEY, JSON.stringify(preferences));
  intentHandlerPreferences$.next(preferences);
}

// Keep other tabs' installs and handler choices in sync
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) installedNapplets$.next(sortInstalled(read()));
  else if (e.key === HANDLER_STORAGE_KEY) intentHandlerPreferences$.next(readHandlerPreferences());
});

export function getDefaultIntentHandler(archetype: string, action = "open") {
  const address = intentHandlerPreferences$.value[intentKey(archetype, action)];
  return address ? getInstalledNapplet(address) : undefined;
}

export function setDefaultIntentHandler(archetype: string, action: string, address: string) {
  writeHandlerPreferences({ ...intentHandlerPreferences$.value, [intentKey(archetype, action)]: address });
}

export function clearDefaultIntentHandler(archetype: string, action = "open") {
  const preferences = { ...intentHandlerPreferences$.value };
  delete preferences[intentKey(archetype, action)];
  writeHandlerPreferences(preferences);
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
}
