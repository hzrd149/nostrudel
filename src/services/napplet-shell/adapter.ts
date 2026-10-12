import { useToast } from "@chakra-ui/react";
import {
  createCommonService,
  createIdentityService,
  createLinkService,
  createNotifyService,
  createOutboxService,
  createRelayPoolOutboxRouter,
  createRelayPoolService,
  createThemeService,
  type OutboxRelayPool,
  type RelayListEntry,
} from "@kehto/services";
import type { RelayPoolLike, ShellAdapter } from "@kehto/shell";
import type { NostrFilter } from "@napplet/core";
import { getInboxes, getOutboxes } from "applesauce-core/helpers";
import { EventTemplate, Filter, kinds, NostrEvent } from "nostr-tools";
import { catchError, filter, firstValueFrom, of, take, timeout, toArray } from "rxjs";

import type { NappletIntent } from "../../helpers/nostr/napplets";
import accounts from "../accounts";
import { cacheRequest, eventCache$, writeEvent } from "../event-cache";
import { eventStore } from "../event-store";
import type { InstalledNapplet } from "../installed-napplets";
import pool from "../pool";
import verifyEvent from "../verify-event";
import {
  changeCommonFollow,
  getCommonFollows,
  getCommonProfile,
  getIdentityFollows,
  getIdentityProfile,
  reactCommon,
  reportCommon,
} from "./common-actions";
import { createNappletIntentService } from "./intent-service";
import { getReadRelays, getWriteRelays } from "./relay-tiers";
import { createResourceService, type ResourceServiceOptions } from "./resource-service";
import { createBlossomUploadService, type UploadConfig } from "./upload-service";

/**
 * NAP domains the shell advertises by default that noStrudel does not back with
 * a service handler. Disabling them here keeps `shell.init` capabilities, the
 * injected `window.napplet.<domain>` prelude, and `adapter.services` in sync —
 * a napplet's `supports('<domain>')` only returns true when the domain actually
 * works. Wire a service + remove the entry here to enable one.
 *
 * `storage` and `inc` are intentionally NOT listed: @kehto/runtime backs them
 * directly (state-handler + default localStorage persistence; inc fanout router).
 */
const DISABLED_NAP_DOMAINS = ["keys", "media", "config", "cvm"] as const;

/** Copies napplet filters into nostr-tools filters (which also allow `&` tag keys and `search`). */
function toRelayFilters(filters: NostrFilter[]): Filter[] {
  return filters.map((f) => ({ ...f }));
}

function getSigner() {
  const account = accounts.active;
  if (!account) return null;

  return {
    getPublicKey: async () => account.pubkey,
    signEvent: account.signEvent.bind(account),
    nip04: Reflect.get(account, "nip04"),
    nip44: Reflect.get(account, "nip44"),
  };
}

export function createAdapter(
  toast: ReturnType<typeof useToast>,
  getIntentNavigator: () => ((intent: NappletIntent, handler: InstalledNapplet) => void) | null,
  chooseIntentHandler: (intent: NappletIntent) => Promise<InstalledNapplet | undefined>,
  resource: ResourceServiceOptions,
  getUpload: () => UploadConfig,
  uploadEnabled: boolean,
): ShellAdapter {
  const subscriptions = new Map<string, () => void>();
  // Expose only what kehto calls; applesauce's `count` returns an Observable, not kehto's number.
  const poolLike: RelayPoolLike = {
    subscription: (relayUrls, filters) => pool.subscription(relayUrls, filters),
    request: (relayUrls, filters) => pool.request(relayUrls, filters),
    publish: async (relayUrls, event) => {
      await pool.publish(relayUrls, event);
    },
  };

  const selectRelayTier = (filters: unknown[]) => (filters.length === 0 ? getWriteRelays() : getReadRelays());

  const adapter: ShellAdapter = {
    relayPool: {
      getRelayPool: () => poolLike,
      trackSubscription: (key, cleanup) => subscriptions.set(key, cleanup),
      untrackSubscription: (key) => {
        subscriptions.get(key)?.();
        subscriptions.delete(key);
      },
      openScopedRelay: () => {},
      closeScopedRelay: () => {},
      publishToScopedRelay: () => false,
      selectRelayTier,
    },
    relayConfig: {
      addRelay: () => {},
      removeRelay: () => {},
      getRelayConfig: () => ({ discovery: getReadRelays(), super: getReadRelays(), outbox: getWriteRelays() }),
      getNip66Suggestions: () => [],
    },
    windowManager: {
      createWindow: () => null,
    },
    auth: {
      getUserPubkey: () => accounts.active?.pubkey ?? null,
      getSigner,
    },
    config: {
      getNappUpdateBehavior: () => "banner",
    },
    hotkeys: {
      executeHotkeyFromForward: () => {},
    },
    // NAP-CACHE: back the runtime cache with noStrudel's local event cache so napplet
    // relay subscriptions are served from cache first and incoming events are persisted.
    workerRelay: {
      getWorkerRelay: () =>
        eventCache$.value
          ? {
              // req is a NIP-01 REQ frame: ["REQ", subId, ...filters]
              query: (req: unknown) =>
                firstValueFrom(cacheRequest((req as unknown[]).slice(2) as Filter[]).pipe(toArray()), {
                  defaultValue: [],
                }),
              // Only cache validly-signed events so a napplet can't poison the shared cache.
              event: async (event: NostrEvent) => {
                if (verifyEvent(event)) writeEvent(event);
              },
            }
          : null,
    },
    // NAP-LINK availability flag (the handler lives in adapter.services.link).
    link: {
      isAvailable: () => true,
    },
    common: {
      isAvailable: () => true,
    },
    crypto: {
      verifyEvent: async (event) => verifyEvent(event as NostrEvent),
    },
    onUnroutedMessage: (info) => {
      if (import.meta.env.DEV) console.debug("Dropped napplet message", info);
    },
    onHashMismatch: (dTag, claimed, computed) => {
      toast({ status: "error", description: `Napplet ${dTag} hash mismatch: ${claimed} != ${computed}` });
    },
    // Narrow shell.init to domains noStrudel actually backs. See DISABLED_NAP_DOMAINS.
    capabilities: { disabledDomains: [...DISABLED_NAP_DOMAINS, ...(uploadEnabled ? [] : ["upload"])] },
  };

  // NAP-OUTBOX: shell-mediated, outbox-model (NIP-65) relay routing. The shell owns
  // relay discovery, signing, and fanout so napplets never touch keys or pick relays.
  const outboxRelayPool: OutboxRelayPool = {
    subscribe: (filters, relayUrls, callback) => {
      const sub = pool.subscription(relayUrls, toRelayFilters(filters)).subscribe((item) => {
        callback((item as unknown) === "EOSE" ? "EOSE" : (item as NostrEvent));
      });
      return { unsubscribe: () => sub.unsubscribe() };
    },
    publish: (event, relayUrls) => {
      pool.publish(relayUrls, event);
    },
    isAvailable: () => true,
  };

  const outboxRouter = createRelayPoolOutboxRouter({
    relayPool: outboxRelayPool,
    // Resolve NIP-65 relay lists on demand; the event store auto-loads missing lists.
    loadRelayLists: async (pubkeys) => {
      const lists = new Map<string, RelayListEntry>();
      await Promise.all(
        pubkeys.map(async (pubkey) => {
          const list = await firstValueFrom(
            eventStore.replaceable({ kind: kinds.RelayList, pubkey }).pipe(
              filter((event): event is NostrEvent => !!event),
              take(1),
              timeout(3000),
              catchError(() => of(undefined)),
            ),
            { defaultValue: undefined },
          );
          if (list) lists.set(pubkey, { read: getInboxes(list), write: getOutboxes(list) });
        }),
      );
      return lists;
    },
    fallbackRelays: getReadRelays(),
    // Napplets never sign; the shell signs with the active account.
    signEvent: async (template: EventTemplate) => {
      const account = accounts.active;
      if (!account) throw new Error("No active account to sign with");
      return account.signEvent(template);
    },
    verifyEvent: (event) => verifyEvent(event),
  });

  adapter.services = {
    identity: createIdentityService({
      getSigner,
      getProfile: (pubkey) => getIdentityProfile(pubkey),
      getFollows: (pubkey) => getIdentityFollows(pubkey),
    }),
    outbox: createOutboxService({ router: outboxRouter }),
    // NAP-LINK handler: open an external URL in a new tab (advertised via adapter.link below).
    link: createLinkService({
      open: ({ url }) => {
        const opened = window.open(url.toString(), "_blank", "noopener,noreferrer");
        return { status: opened ? "opened" : "denied" };
      },
    }),
    notify: createNotifyService({
      present: ({ message }) => {
        toast({ title: message.title, description: message.body, status: "info" });
      },
    }),
    common: createCommonService({
      getProfile: getCommonProfile,
      follows: getCommonFollows,
      follow: (pubkeys) => changeCommonFollow(pubkeys, true),
      unfollow: (pubkeys) => changeCommonFollow(pubkeys, false),
      react: reactCommon,
      report: reportCommon,
    }),
    resource: createResourceService(resource),
    upload: createBlossomUploadService(getUpload),
    intent: createNappletIntentService({ navigate: getIntentNavigator, chooseHandler: chooseIntentHandler }),
    relay: createRelayPoolService({
      subscribe: (filters, callback, relayUrls) => {
        const sub = pool
          .subscription(relayUrls ?? selectRelayTier(filters), toRelayFilters(filters))
          .subscribe((item) => {
            callback(item as NostrEvent);
          });
        return { unsubscribe: () => sub.unsubscribe() };
      },
      publish: (event) => {
        eventStore.add(event as NostrEvent);
        pool.publish(getWriteRelays(), event as NostrEvent);
      },
      selectRelayTier,
      isAvailable: () => true,
    }),
    theme: createThemeService({
      initialTheme: { title: "noStrudel", colors: { background: "#ffffff", text: "#171819", primary: "#8b5cf6" } },
    }).handler,
  };

  return adapter;
}
