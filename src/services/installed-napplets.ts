import { NostrEvent } from "nostr-tools";

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

function intentKey(archetype: string, action = "open") {
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

function write(list: InstalledNapplet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getInstalledNapplets() {
  return read().sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export function isNappletInstalled(address: string) {
  return read().some((item) => item.address === address);
}

export function getInstalledNapplet(address: string) {
  return read().find((item) => item.address === address);
}

export function getInstalledNappletByArchetype(archetype: string) {
  return getInstalledNapplets().find((item) => item.archetypes.some((entry) => entry.name === archetype));
}

export function getInstalledNappletsForIntent(archetype: string, action = "open") {
  return getInstalledNapplets().filter((item) =>
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

function writeHandlerPreferences(preferences: IntentHandlerPreferences) {
  localStorage.setItem(HANDLER_STORAGE_KEY, JSON.stringify(preferences));
}

export function getDefaultIntentHandler(archetype: string, action = "open") {
  const address = readHandlerPreferences()[intentKey(archetype, action)];
  return address ? getInstalledNapplet(address) : undefined;
}

export function setDefaultIntentHandler(archetype: string, action: string, address: string) {
  writeHandlerPreferences({ ...readHandlerPreferences(), [intentKey(archetype, action)]: address });
}

export function clearDefaultIntentHandler(archetype: string, action = "open") {
  const preferences = readHandlerPreferences();
  delete preferences[intentKey(archetype, action)];
  writeHandlerPreferences(preferences);
}

export function getInstalledNappletForIntent(archetype: string, action = "open") {
  const handlers = getInstalledNappletsForIntent(archetype, action);
  const preferred = getDefaultIntentHandler(archetype, action);
  return preferred && handlers.some((handler) => handler.address === preferred.address) ? preferred : handlers[0];
}

export function getInstalledNappletPath(napplet: InstalledNapplet) {
  const archetype = napplet.archetypes[0]?.name;
  return `/app/${archetype || napplet.address}`;
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
    archetypes: getNappletArchetypes(event),
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

  const preferences = readHandlerPreferences();
  for (const [key, value] of Object.entries(preferences)) {
    if (value === address) delete preferences[key];
  }
  writeHandlerPreferences(preferences);
}
