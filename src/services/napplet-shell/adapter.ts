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
import type { RelayPoolLike } from "@kehto/shell";
import { createKehtoShellAdapter, type KehtoShellOverrides } from "applesauce-extra/kehto";
import type { ServiceHandler } from "@kehto/runtime";
import type { NostrFilter } from "@napplet/core";
import { getInboxes, getOutboxes } from "applesauce-core/helpers";
import { EventTemplate, Filter, kinds, NostrEvent } from "nostr-tools";
import { catchError, filter, firstValueFrom, of, take, timeout, toArray } from "rxjs";

import { logger } from "../../helpers/debug";
import ignoreRelayErrors from "../../helpers/ignore-relay-errors";
import accounts from "../accounts";
import { cacheRequest, eventCache$, writeEvent } from "../event-cache";
import { eventStore } from "../event-store";
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
import { getReadRelays, getWriteRelays } from "./relay-tiers";
import { assertNappletEventKind } from "../../helpers/nostr/handler-preferences";
import { createResourceService, type ResourceServiceOptions } from "./resource-service";
import { createBlossomUploadService, type UploadConfig } from "./upload-service";
import { createNappletWebrtcService, type NappletWebrtcOptions } from "./webrtc-service";
import { createNappletCvmService, type NappletCvmOptions } from "./cvm-service";
import { getNappletSigner as getSigner, kehtoContext } from "./context";

const log = logger.extend("napplet-shell");

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
const DISABLED_NAP_DOMAINS = ["keys", "media", "config"] as const;

/** Copies napplet filters into nostr-tools filters (which also allow `&` tag keys and `search`). */
function toRelayFilters(filters: NostrFilter[]): Filter[] {
  return filters.map((f) => ({ ...f }));
}

export function createAdapter(
  toast: ReturnType<typeof useToast>,
  intent: ServiceHandler,
  resource: ResourceServiceOptions,
  getUpload: () => UploadConfig,
  uploadEnabled: boolean,
  webrtc: NappletWebrtcOptions,
  cvm: NappletCvmOptions,
) {
  // These service callbacks return void, so report rejected publishes here.
  const reportPublishError = (error: unknown) => {
    toast({ status: "error", description: error instanceof Error ? error.message : "Failed to publish event" });
  };
  // Expose only what kehto calls; applesauce's `count` returns an Observable, not kehto's number.
  const poolLike: RelayPoolLike = {
    subscription: (relayUrls, filters) =>
      pool.subscription(relayUrls, filters).pipe(ignoreRelayErrors("Napplet shell subscription")),
    request: (relayUrls, filters) => pool.request(relayUrls, filters).pipe(ignoreRelayErrors("Napplet shell request")),
    publish: async (relayUrls, event) => {
      assertNappletEventKind(event.kind);
      await pool.publish(relayUrls, event);
    },
  };

  const selectRelayTier = (filters: unknown[]) => (filters.length === 0 ? getWriteRelays() : getReadRelays());

  const overrides: KehtoShellOverrides = {
    relayPool: {
      getRelayPool: () => poolLike,
      selectRelayTier,
    },
    relayConfig: {
      getRelayConfig: () => ({ discovery: getReadRelays(), super: getReadRelays(), outbox: getWriteRelays() }),
    },
    auth: {
      getUserPubkey: () => accounts.active?.pubkey ?? null,
      getSigner,
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
    webrtc: {
      isAvailable: () => typeof RTCPeerConnection !== "undefined",
    },
    crypto: {
      verifyEvent: async (event) => verifyEvent(event as NostrEvent),
    },
    onUnroutedMessage: (info) => {
      log("Dropped napplet message", info);
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
      const sub = pool
        .subscription(relayUrls, toRelayFilters(filters))
        .pipe(ignoreRelayErrors("Napplet outbox subscription"))
        .subscribe((item) => {
          callback((item as unknown) === "EOSE" ? "EOSE" : (item as NostrEvent));
        });
      return { unsubscribe: () => sub.unsubscribe() };
    },
    publish: (event, relayUrls) => {
      assertNappletEventKind(event.kind);
      void pool.publish(relayUrls, event).catch(reportPublishError);
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
      assertNappletEventKind(template.kind);
      const account = accounts.active;
      if (!account) throw new Error("No active account to sign with");
      return account.signEvent(template);
    },
    verifyEvent: (event) => verifyEvent(event),
  });

  const services = {
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
    intent,
    webrtc: createNappletWebrtcService(webrtc),
    cvm: createNappletCvmService(cvm),
    relay: createRelayPoolService({
      subscribe: (filters, callback, relayUrls) => {
        const sub = pool
          .subscription(relayUrls ?? selectRelayTier(filters), toRelayFilters(filters))
          .pipe(ignoreRelayErrors("Napplet relay subscription"))
          .subscribe((item) => {
            callback(item as NostrEvent);
          });
        return { unsubscribe: () => sub.unsubscribe() };
      },
      publish: (event) => {
        assertNappletEventKind(event.kind);
        eventStore.add(event as NostrEvent);
        void pool.publish(getWriteRelays(), event as NostrEvent).catch(reportPublishError);
      },
      selectRelayTier,
      isAvailable: () => true,
    }),
    theme: createThemeService({
      initialTheme: { title: "noStrudel", colors: { background: "#ffffff", text: "#171819", primary: "#8b5cf6" } },
    }).handler,
  };

  return createKehtoShellAdapter(kehtoContext, { services, overrides });
}
