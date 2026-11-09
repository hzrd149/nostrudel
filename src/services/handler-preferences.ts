import { getOutboxes } from "applesauce-core/helpers";
import { type Filter, type NostrEvent, validateEvent, verifiedSymbol, verifyEvent } from "nostr-tools";
import { BehaviorSubject, firstValueFrom, timeout, toArray } from "rxjs";

import { logger } from "../helpers/debug";
import {
  editHandlerEntry,
  handlerEntries,
  handlerPointer,
  handlerReference,
  isHandlerConvention,
  HANDLER_PREFERENCES_KIND,
  type HandlerEntry,
} from "../helpers/nostr/handler-preferences";
import { validateNappletManifest } from "../helpers/nostr/napplets";
import accounts from "./accounts";
import { eventStore } from "./event-store";
import { handlerPreferences$, handlerManifests$, localHandlerPreferences$ } from "./handler-preference-state";
import { profileLoader } from "./loaders";
import { getReadRelays } from "./napplet-shell/relay-tiers";
import pool from "./pool";

export { handlerPreferences$, handlerManifests$, localHandlerPreferences$ };
export const handlerPreferencesLoading$ = new BehaviorSubject(false);
export const handlerPreferencesError$ = new BehaviorSubject<string | undefined>(undefined);
const log = logger.extend("HandlerPreferences");
let owner: string | undefined;
let generation = 0;
let pending: Promise<void> | undefined;
let synced = false;
let saving = false;
let localManifestsPending: Promise<void> = Promise.resolve();
const cacheKey = (pubkey: string) => `nostrudel:handler-preferences:${pubkey}`;

function verifyFresh(event: NostrEvent) {
  // Signers and relay caches can attach stale verification markers to mutable objects.
  return verifyEvent({ ...event, [verifiedSymbol]: undefined });
}

function cachePreferences(pubkey: string) {
  // Only signed ciphertext is persisted, never decrypted private entries.
  try {
    localStorage.setItem(
      cacheKey(pubkey),
      JSON.stringify([...handlerPreferences$.value.values()].map((value) => value.event)),
    );
  } catch (error) {
    log("Could not cache preferences", error);
  }
}

async function outboxes(pubkey: string) {
  const list = await firstValueFrom(profileLoader({ kind: 10002, pubkey }).pipe(timeout(20_000), toArray()));
  const latest = list.sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))[0];
  return latest ? getOutboxes(latest) : getReadRelays();
}

async function request(filter: Filter, relays: string[]) {
  return firstValueFrom(pool.request(relays, filter).pipe(timeout(20_000), toArray()));
}

function accept(event: NostrEvent, pubkey: string) {
  if (
    !event ||
    !validateEvent(event) ||
    event.kind !== HANDLER_PREFERENCES_KIND ||
    event.pubkey !== pubkey ||
    !verifyFresh(event)
  )
    return;
  const archetype = event.tags.find((tag) => tag[0] === "d")?.[1];
  if (!archetype || event.tags.filter((tag) => tag[0] === "d").length !== 1) return;
  const previous = handlerPreferences$.value.get(archetype)?.event;
  if (
    previous &&
    (previous.created_at > event.created_at || (previous.created_at === event.created_at && previous.id <= event.id))
  )
    return;
  handlerPreferences$.next(
    new Map(handlerPreferences$.value).set(archetype, {
      event,
      privateTags: [],
      locked: !!event.content,
    }),
  );
}

/** Metadata resolution never grants capabilities to a referenced napplet. */
export async function loadHandlerManifests() {
  const version = generation;
  const sources = new Map<string, HandlerEntry[]>();
  for (const preference of handlerPreferences$.value.values()) {
    const entries = handlerEntries(preference);
    for (const entry of entries) if (!sources.has(entry.reference)) sources.set(entry.reference, entries);
  }
  for (const reference of Object.values(localHandlerPreferences$.value)) {
    if (!sources.has(reference)) sources.set(reference, [{ reference, private: true }]);
  }
  await Promise.all(
    [...sources]
      .map(async ([reference, entries]) => {
        const pointer = handlerPointer(reference);
        if (!pointer) return;
        const hint = entries.find((entry) => entry.reference === reference && entry.relay);
        const author =
          "id" in pointer
            ? entries.find((entry) => entry.reference === reference && entry.author)?.author
            : pointer.pubkey;
        const filter: Filter =
          "id" in pointer
            ? { ids: [pointer.id] }
            : {
                kinds: [pointer.kind],
                authors: [pointer.pubkey],
                ...(pointer.kind === 35129 ? { "#d": [pointer.identifier] } : {}),
              };
        // Hints come from this preference event, not another archetype's event.
        // Discover author relays lazily, only after a supplied hint fails.
        const tiers = [
          async () => (hint?.relay ? [hint.relay] : []),
          async () => (author ? outboxes(author) : []),
          async () => getReadRelays(),
        ];
        for (const tier of tiers) {
          if (version !== generation) return;
          let events: NostrEvent[];
          try {
            const relays = await tier();
            if (!relays.length) continue;
            events = await request(filter, relays);
          } catch (error) {
            log("Handler discovery tier failed", error);
            continue;
          }
          const event = events
            .filter(
              (item) =>
                verifyFresh(item) &&
                validateNappletManifest(item) &&
                ("id" in pointer
                  ? item.kind === 5129 && item.id === pointer.id
                  : item.kind === pointer.kind &&
                    item.pubkey === pointer.pubkey &&
                    (item.tags.find((tag) => tag[0] === "d")?.[1] ?? "") === pointer.identifier),
            )
            .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))[0];
          if (version === generation && event) {
            eventStore.add(event);
            handlerManifests$.next(new Map(handlerManifests$.value).set(reference, event));
            return;
          }
        }
      })
      .map((work) => work.catch((error) => log("Could not resolve handler", error))),
  );
}

export function refreshHandlerPreferences(): Promise<void> {
  if (pending) return pending;
  const pubkey = owner;
  if (!pubkey) return Promise.resolve();
  const version = generation;
  handlerPreferencesLoading$.next(true);
  handlerPreferencesError$.next(undefined);
  pending = (async () => {
    const events = await request({ kinds: [HANDLER_PREFERENCES_KIND], authors: [pubkey] }, await outboxes(pubkey));
    if (version !== generation) return;
    for (const event of events) accept(event, pubkey);
    synced = true;
    cachePreferences(pubkey);
    await loadHandlerManifests();
  })()
    .catch((error) => {
      if (version === generation) {
        synced = false;
        handlerPreferencesError$.next(error instanceof Error ? error.message : "Could not sync handler preferences");
      }
      throw error;
    })
    .finally(() => {
      if (version === generation) {
        pending = undefined;
        handlerPreferencesLoading$.next(false);
      }
    });
  return pending;
}

export async function unlockHandlerPreference(archetype: string) {
  const account = accounts.active;
  const preference = handlerPreferences$.value.get(archetype);
  if (!preference?.locked) return;
  if (!account?.nip44) throw new Error("NIP-44 decryption is required");
  const tags: unknown = JSON.parse(await account.nip44.decrypt(account.pubkey, preference.event.content));
  if (account !== accounts.active || handlerPreferences$.value.get(archetype) !== preference)
    throw new Error("Account or preferences changed");
  if (!Array.isArray(tags)) throw new Error("Invalid private preferences");
  // Ignore malformed entries individually, including malformed private tag arrays.
  const privateTags = tags.filter(
    (tag): tag is string[] => Array.isArray(tag) && tag.every((value) => typeof value === "string"),
  );
  handlerPreferences$.next(
    new Map(handlerPreferences$.value).set(archetype, { ...preference, privateTags, locked: false }),
  );
  await loadHandlerManifests();
}

/** Resolve saved choices before deciding whether discovery is needed. */
export async function prepareHandlerPreferences(archetype: string) {
  const version = generation;
  await localManifestsPending;
  if (pending) await pending;
  else if (owner && !synced) await refreshHandlerPreferences();
  if (version !== generation) throw new Error("Account changed while loading preferences");
  await unlockHandlerPreference(archetype);
  if (version !== generation) throw new Error("Account changed while loading preferences");
}

export async function saveHandlerEntry(archetype: string, entry: HandlerEntry, remove = false, replaceScope = false) {
  if (saving) throw new Error("Another handler preference is being saved");
  saving = true;
  try {
    await applyHandlerEntry(archetype, entry, remove, replaceScope);
  } finally {
    saving = false;
  }
}

async function applyHandlerEntry(archetype: string, entry: HandlerEntry, remove: boolean, replaceScope: boolean) {
  if (
    !isHandlerConvention(`napplet:${archetype}/open`, archetype) ||
    (entry.convention && !isHandlerConvention(entry.convention, archetype))
  )
    throw new Error("Invalid handler scope");
  const account = accounts.active;
  if (!account || account.pubkey !== owner) throw new Error("Sign in to save handler preferences");
  const expected = handlerPreferences$.value.get(archetype)?.event.id;
  await refreshHandlerPreferences();
  if (!synced || account !== accounts.active || handlerPreferences$.value.get(archetype)?.event.id !== expected)
    throw new Error("Preferences changed. Review them before saving.");
  await unlockHandlerPreference(archetype);
  const previous = handlerPreferences$.value.get(archetype);
  const empty = { event: { tags: [["d", archetype]] } as NostrEvent, privateTags: [], locked: false };
  let editable = previous ?? empty;
  if (replaceScope) {
    for (const old of handlerEntries(editable).filter((value) => value.convention === entry.convention)) {
      const [tags, privateTags] = editHandlerEntry(editable, old, true);
      editable = { ...editable, event: { ...editable.event, tags }, privateTags };
    }
  }
  const [tags, hidden] = editHandlerEntry(editable, entry, remove);
  if (!handlerPointer(entry.reference)) throw new Error("Invalid handler reference");
  if (hidden.length && !account.nip44) throw new Error("NIP-44 encryption is required");
  const content = hidden.length ? await account.nip44!.encrypt(account.pubkey, JSON.stringify(hidden)) : "";
  const check = () => {
    if (account !== accounts.active || handlerPreferences$.value.get(archetype) !== previous)
      throw new Error("Account or preferences changed while saving");
  };
  check();
  const template = {
    kind: HANDLER_PREFERENCES_KIND,
    tags,
    content,
    created_at: Math.max(Math.floor(Date.now() / 1000), (previous?.event.created_at ?? 0) + 1),
  };
  const signed = await account.signEvent(template);
  check();
  if (
    !verifyFresh(signed) ||
    signed.pubkey !== account.pubkey ||
    JSON.stringify([signed.kind, signed.tags, signed.content, signed.created_at]) !==
      JSON.stringify([template.kind, tags, content, template.created_at])
  )
    throw new Error("Signer returned an unexpected event");
  const relays = await outboxes(account.pubkey);
  check();
  const results = await pool.publish(relays, signed);
  check();
  if (!Object.values(results).some((result) => result.ok)) throw new Error("No relay accepted your preferences");
  eventStore.add(signed);
  handlerPreferences$.next(
    new Map(handlerPreferences$.value).set(archetype, { event: signed, privateTags: hidden, locked: false }),
  );
  cachePreferences(account.pubkey);
  await loadHandlerManifests();
}

const localKey = () => `nostrudel:napplet:preferences${owner ? `:${owner}` : ""}`;

function readLocalPreferences() {
  try {
    const stored = localStorage.getItem(localKey());
    // Preserve only explicit old defaults. The former installed list is never imported.
    const values = JSON.parse(
      stored ?? localStorage.getItem(`nostrudel:napplet:intent-handlers${owner ? `:${owner}` : ""}`) ?? "{}",
    );
    const entries = Object.entries(values).flatMap(([scope, address]) => {
      const reference = typeof address === "string" && handlerReference(address);
      return reference && handlerPointer(reference) ? [[scope, reference]] : [];
    });
    localHandlerPreferences$.next(Object.fromEntries(entries));
  } catch (error) {
    log("Could not read local handler preferences", error);
    localHandlerPreferences$.next({});
  }
}

export function setLocalHandlerPreference(scope: string, reference?: string) {
  const next = { ...localHandlerPreferences$.value };
  if (reference) next[scope] = reference;
  else delete next[scope];
  localStorage.setItem(localKey(), JSON.stringify(next));
  localHandlerPreferences$.next(next);
}

let initialized = false;
accounts.active$.subscribe((account) => {
  if (initialized && owner === account?.pubkey) return;
  initialized = true;
  owner = account?.pubkey;
  generation++;
  pending = undefined;
  synced = false;
  handlerPreferencesLoading$.next(false);
  handlerPreferencesError$.next(undefined);
  handlerPreferences$.next(new Map());
  handlerManifests$.next(new Map());
  readLocalPreferences();
  localManifestsPending = loadHandlerManifests().catch((error) => log("Could not load local handlers", error));
  if (owner) {
    try {
      const cached: unknown = JSON.parse(localStorage.getItem(cacheKey(owner)) ?? "[]");
      if (Array.isArray(cached)) for (const event of cached) accept(event, owner);
    } catch (error) {
      log("Could not read cached preferences", error);
    }
    void refreshHandlerPreferences().catch((error) => log("Could not load preferences", error));
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== localKey() && event.key !== null) return;
  readLocalPreferences();
  localManifestsPending = loadHandlerManifests().catch((error) => log("Could not load local handlers", error));
});
