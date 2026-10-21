import { AppDataFactory } from "applesauce-common/factories";
import { EventSigner } from "applesauce-core";

import type { NappletArchetype } from "./napplets";

/** NIP-78 `d` identifier for the encrypted installed napplets list */
export const NAPPLET_SYNC_IDENTIFIER = "nostrudel-napplets";

/** Default intent handler addresses keyed by `archetype/action` */
export type IntentHandlerPreferences = Record<string, string>;

/** An installed napplet as it is synced between devices */
export type SyncedNapplet = {
  address: string;
  title: string;
  description?: string;
  pubkey: string;
  archetypes: NappletArchetype[];
  installedAt: number;
};

export type NappletSyncData = {
  installed: SyncedNapplet[];
  handlers: IntentHandlerPreferences;
};

export const EMPTY_NAPPLET_SYNC_DATA: NappletSyncData = { installed: [], handlers: {} };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseArchetypes(value: unknown): NappletArchetype[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item: Partial<NappletArchetype>) =>
    item && typeof item.name === "string" && isStringArray(item.actions) && isStringArray(item.protocols)
      ? [{ name: item.name, actions: item.actions, protocols: item.protocols }]
      : [],
  );
}

/** Device-local fields that are stored with an install but never synced */
export type LocalNappletFields = { lastOpenedAt?: number; openedVersion?: number };

/** Parses stored or synced install entries, dropping malformed ones */
export function parseInstalledNappletEntries(value: unknown): (SyncedNapplet & LocalNappletFields)[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { address, title, description, pubkey, archetypes, installedAt, lastOpenedAt, openedVersion } =
      item as Record<string, unknown>;
    if (typeof address !== "string" || !address) return [];
    if (typeof title !== "string" || !title) return [];
    if (typeof pubkey !== "string" || !pubkey) return [];
    if (typeof installedAt !== "number" || !installedAt) return [];

    return [
      {
        address,
        title,
        description: typeof description === "string" ? description : undefined,
        pubkey,
        archetypes: parseArchetypes(archetypes),
        installedAt,
        lastOpenedAt: typeof lastOpenedAt === "number" ? lastOpenedAt : undefined,
        openedVersion: typeof openedVersion === "number" ? openedVersion : undefined,
      },
    ];
  });
}

export function toSyncedNapplet({
  lastOpenedAt: _lastOpenedAt,
  openedVersion: _openedVersion,
  ...item
}: SyncedNapplet & LocalNappletFields): SyncedNapplet {
  return item;
}

/** Parses the decrypted NIP-78 content, dropping anything malformed */
export function parseNappletSyncData(value: unknown): NappletSyncData {
  if (!value || typeof value !== "object") return EMPTY_NAPPLET_SYNC_DATA;
  const { installed, handlers } = value as Record<string, unknown>;

  const cleanHandlers: IntentHandlerPreferences = {};
  if (handlers && typeof handlers === "object" && !Array.isArray(handlers)) {
    for (const [key, address] of Object.entries(handlers))
      if (typeof address === "string") cleanHandlers[key] = address;
  }

  return {
    installed: parseInstalledNappletEntries(installed).map(toSyncedNapplet),
    handlers: cleanHandlers,
  };
}

/**
 * Three-way merge of the installed list. `base` is the last state both sides agreed on; local
 * installs, uninstalls, and handler changes since then are replayed on top of `remote`, so changes
 * made on other devices are kept.
 */
export function mergeNappletSyncData(
  base: NappletSyncData,
  local: NappletSyncData,
  remote: NappletSyncData,
): NappletSyncData {
  const baseAddresses = new Set(base.installed.map((item) => item.address));
  const localAddresses = new Set(local.installed.map((item) => item.address));
  const added = local.installed.filter((item) => !baseAddresses.has(item.address));
  const addedAddresses = new Set(added.map((item) => item.address));
  const removed = new Set(
    base.installed.filter((item) => !localAddresses.has(item.address)).map((item) => item.address),
  );

  const installed = [
    ...added,
    ...remote.installed.filter((item) => !removed.has(item.address) && !addedAddresses.has(item.address)),
  ];
  const installedAddresses = new Set(installed.map((item) => item.address));

  const handlers: IntentHandlerPreferences = {};
  const keys = new Set([
    ...Object.keys(base.handlers),
    ...Object.keys(local.handlers),
    ...Object.keys(remote.handlers),
  ]);
  for (const key of keys) {
    const address = local.handlers[key] !== base.handlers[key] ? local.handlers[key] : remote.handlers[key];
    if (address && installedAddresses.has(address)) handlers[key] = address;
  }

  return { installed, handlers };
}

/** Whether two states have the same installed apps and handler choices */
export function isSameNappletSyncData(a: NappletSyncData, b: NappletSyncData) {
  const addresses = (data: NappletSyncData) =>
    data.installed
      .map((item) => item.address)
      .sort()
      .join(" ");
  const handlers = (data: NappletSyncData) =>
    JSON.stringify(Object.entries(data.handlers).sort(([a], [b]) => a.localeCompare(b)));

  return addresses(a) === addresses(b) && handlers(a) === handlers(b);
}

/** Builds and signs the NIP-78 event holding the installed list, NIP-44 encrypted to the signer */
export async function createNappletSyncEvent(signer: EventSigner, data: NappletSyncData) {
  const pubkey = await signer.getPublicKey();

  return AppDataFactory.create(NAPPLET_SYNC_IDENTIFIER, null)
    .as(signer)
    .encryptedContent(pubkey, JSON.stringify(data), "nip44")
    .sign();
}
