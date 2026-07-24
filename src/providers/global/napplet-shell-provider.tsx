import {
  Button,
  ButtonGroup,
  Code,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
import {
  createIdentityService,
  createIntentService,
  createLinkService,
  createNotifyService,
  createOutboxService,
  createRelayPoolOutboxRouter,
  createRelayPoolService,
  createThemeService,
  type IntentAvailability,
  type IntentCandidate,
  type IntentRequest,
  type IntentResult,
  type OutboxRelayPool,
  type RelayListEntry,
} from "@kehto/services";
import {
  buildShellCapabilities,
  createShellBridge,
  originRegistry,
  sessionRegistry,
  type Capability,
  type RelayPoolLike,
  type ShellAdapter,
  type ShellBridge,
  type ShellCapabilities,
} from "@kehto/shell";
import { getContacts, getInboxes, getOutboxes } from "applesauce-core/helpers";
import { EventTemplate, Filter, kinds, NostrEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { catchError, filter, firstValueFrom, Observable, of, take, timeout, toArray } from "rxjs";

import { unique } from "../../helpers/array";
import { conventionId, getNappletTitle, type NappletIntent } from "../../helpers/nostr/napplets";
import accounts from "../../services/accounts";
import { cacheRequest, eventCache$, writeEvent } from "../../services/event-cache";
import { eventStore } from "../../services/event-store";
import pool from "../../services/pool";
import localSettings from "../../services/preferences";
import { getRecentNapplets, type RecentNapplet } from "../../services/recent-napplets";
import verifyEvent from "../../services/verify-event";

type NappletIdentity = {
  pubkey: string;
  dTag: string;
  aggregateHash: string;
};

type ConsentRequest = {
  event: NostrEvent;
  identity: NappletIdentity;
  capabilities: Capability[];
  resolve: (value: boolean) => void;
};

type NappletShellContextValue = {
  bridge: ShellBridge;
  /** Shell capability set computed from the adapter via buildShellCapabilities. */
  capabilities: ShellCapabilities;
  requestConsent: (event: NostrEvent, identity: NappletIdentity, capabilities: Capability[]) => Promise<boolean>;
  registerFrame: (windowId: string, win: Window, identity: Pick<NappletIdentity, "dTag" | "aggregateHash">) => void;
  unregisterFrame: (windowId: string) => void;
  setIntentNavigator: (navigate: ((intent: NappletIntent, handler: RecentNapplet) => void) | null) => void;
};

const NappletShellContext = createContext<NappletShellContextValue | null>(null);

const ALWAYS_ALLOW_STORAGE_KEY = "nostrudel:napplet:always-allow";

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
const DISABLED_NAP_DOMAINS = ["keys", "media", "config", "resource", "cvm"] as const;

function identityKey(identity: NappletIdentity) {
  return `${identity.pubkey}:${identity.dTag}:${identity.aggregateHash}`;
}

function getAlwaysAllowed() {
  try {
    return JSON.parse(localStorage.getItem(ALWAYS_ALLOW_STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function addAlwaysAllowed(identity: NappletIdentity) {
  const allowed = new Set(getAlwaysAllowed());
  allowed.add(identityKey(identity));
  localStorage.setItem(ALWAYS_ALLOW_STORAGE_KEY, JSON.stringify(Array.from(allowed)));
}

function isAlwaysAllowed(identity: NappletIdentity) {
  return getAlwaysAllowed().includes(identityKey(identity));
}

function grantCapabilities(bridge: ShellBridge, identity: NappletIdentity, capabilities: Capability[]) {
  for (const capability of capabilities) {
    bridge.runtime.aclState.grant(identity.pubkey, identity.dTag, identity.aggregateHash, capability);
  }
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

function asIntentPayload(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};

  const payload: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string") payload[key] = item;
  }
  return payload;
}

function recentHandlersFor(archetype: string) {
  return getRecentNapplets().flatMap((napplet) => {
    const entry = napplet.archetypes.find((item) => item.name === archetype);
    return entry ? [{ napplet, entry }] : [];
  });
}

function candidateFor(handler: ReturnType<typeof recentHandlersFor>[number]): IntentCandidate {
  return {
    dTag: handler.napplet.dTag ?? handler.napplet.address,
    title: handler.napplet.title,
    actions: handler.entry.actions,
    protocols: handler.entry.protocols.length
      ? handler.entry.protocols
      : handler.entry.actions.map((action) => conventionId(handler.entry.name, action)),
    isDefault: true,
  };
}

function availabilityFor(archetype: string): IntentAvailability {
  const handlers = recentHandlersFor(archetype);
  return {
    archetype,
    available: handlers.length > 0,
    candidates: handlers.map(candidateFor),
    hasDefault: handlers.length > 0,
  };
}

function failed(archetype: string, action: string, error: string): IntentResult {
  return { ok: false, archetype, action, handled: false, error };
}

function handlerMatchesPreference(napplet: RecentNapplet, preference: string) {
  return preference === napplet.dTag || preference === napplet.address;
}

function createNappletIntentService(options: {
  navigate: () => ((intent: NappletIntent, handler: RecentNapplet) => void) | null;
}) {
  return createIntentService({
    resolver: {
      available: (archetype) => availabilityFor(archetype),

      handlers: () => {
        const archetypes = new Set<string>();
        for (const napplet of getRecentNapplets()) {
          for (const archetype of napplet.archetypes) archetypes.add(archetype.name);
        }
        return Array.from(archetypes).map(availabilityFor);
      },

      invoke: (request: IntentRequest) => {
        const { archetype } = request;
        const action = request.action ?? "open";
        const handlers = recentHandlersFor(archetype).filter((handler) => handler.entry.actions.includes(action));
        if (handlers.length === 0) return failed(archetype, action, `no recent napplet handles ${archetype}/${action}`);

        const preference = request.handler;
        const handler =
          typeof preference === "string" && preference !== "default" && preference !== "choose"
            ? handlers.find((item) => handlerMatchesPreference(item.napplet, preference))
            : handlers[0];
        if (!handler) return failed(archetype, action, `${preference} does not handle ${archetype}`);

        const protocols = handler.entry.protocols.length
          ? handler.entry.protocols
          : handler.entry.actions.map((item) => conventionId(archetype, item));
        if (request.protocol && !protocols.includes(request.protocol)) {
          return failed(archetype, action, `unsupported protocol ${request.protocol}`);
        }

        const navigate = options.navigate();
        if (!navigate) return failed(archetype, action, "napplet frame is not available");

        const intent = { archetype, action, payload: asIntentPayload(request.payload) };
        window.setTimeout(() => navigate(intent, handler.napplet), 0);

        return {
          ok: true,
          archetype,
          action,
          handled: true,
          handler: handler.napplet.dTag ?? handler.napplet.address,
          windowId: `napplet:${handler.napplet.address}`,
          protocol: request.protocol ?? protocols[0],
        };
      },
    },
  });
}

/** Resolve the first non-empty value from a reactive event-store model, or undefined on timeout. */
async function firstOrUndefined<T>(observable: Observable<T>, ms = 4000): Promise<T | undefined> {
  return firstValueFrom(
    observable.pipe(
      filter((value): value is T => value !== undefined && value !== null),
      take(1),
      timeout(ms),
      catchError(() => of(undefined)),
    ),
    { defaultValue: undefined },
  );
}

// NAP-IDENTITY read hooks resolve the *current user's* data from the event store, which
// auto-loads the backing events (kind 0 profile, kind 3 contacts) from relays on demand.
async function getIdentityProfile(pubkey: string) {
  if (!pubkey) return null;
  const content = await firstOrUndefined(eventStore.profile(pubkey));
  if (!content) return null;

  return {
    name: content.name,
    displayName: content.display_name ?? content.displayName,
    about: content.about,
    picture: content.picture,
    banner: content.banner,
    nip05: content.nip05,
    lud16: content.lud16,
    website: content.website,
  };
}

async function getIdentityFollows(pubkey: string) {
  if (!pubkey) return [];
  // Load the kind-3 event itself (auto-loaded from relays); the contacts model would
  // emit an empty array before the event arrives, so `take(1)` must wait on the event.
  const event = await firstOrUndefined(eventStore.replaceable({ kind: kinds.Contacts, pubkey }));
  return event ? getContacts(event).map((contact) => contact.pubkey) : [];
}

function getReadRelays() {
  return localSettings.fallbackRelays.value;
}

function getWriteRelays() {
  return unique([...localSettings.extraPublishRelays.value, ...localSettings.fallbackRelays.value]);
}

function createAdapter(
  toast: ReturnType<typeof useToast>,
  getIntentNavigator: () => ((intent: NappletIntent, handler: RecentNapplet) => void) | null,
): ShellAdapter {
  const subscriptions = new Map<string, () => void>();
  const poolLike = pool as unknown as RelayPoolLike;

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
    capabilities: { disabledDomains: [...DISABLED_NAP_DOMAINS] },
  };

  // NAP-OUTBOX: shell-mediated, outbox-model (NIP-65) relay routing. The shell owns
  // relay discovery, signing, and fanout so napplets never touch keys or pick relays.
  const outboxRelayPool: OutboxRelayPool = {
    subscribe: (filters, relayUrls, callback) => {
      const sub = pool.subscription(relayUrls, filters as any).subscribe((item) => {
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
      onSend: (_windowId, message) => {
        toast({ title: message.title, description: message.body, status: "info" });
      },
    }),
    intent: createNappletIntentService({ navigate: getIntentNavigator }),
    relay: createRelayPoolService({
      subscribe: (filters, callback, relayUrls) => {
        const sub = pool.subscription(relayUrls ?? selectRelayTier(filters), filters as any).subscribe((item) => {
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

export function NappletShellProvider({ children }: PropsWithChildren) {
  const toast = useToast();
  const [consent, setConsent] = useState<ConsentRequest>();
  const intentNavigatorRef = useRef<((intent: NappletIntent, handler: RecentNapplet) => void) | null>(null);
  const getIntentNavigator = useCallback(() => intentNavigatorRef.current, []);
  const adapter = useMemo(() => createAdapter(toast, getIntentNavigator), [toast, getIntentNavigator]);
  const bridge = useMemo(() => createShellBridge(adapter), [adapter]);
  // Single source of truth for advertised NAP domains: derived from the same
  // adapter the bridge uses, so shell.init and the namespace prelude can't drift.
  const capabilities = useMemo(() => buildShellCapabilities(adapter), [adapter]);

  useEffect(() => {
    window.addEventListener("message", bridge.handleMessage);
    const sub = accounts.active$.subscribe((account) => bridge.publishIdentityChanged(account?.pubkey ?? ""));

    return () => {
      sub.unsubscribe();
      window.removeEventListener("message", bridge.handleMessage);
      bridge.destroy();
    };
  }, [bridge]);

  const requestConsent = useCallback<NappletShellContextValue["requestConsent"]>(
    async (event, identity, capabilities) => {
      if (capabilities.length === 0 || isAlwaysAllowed(identity)) {
        grantCapabilities(bridge, identity, capabilities);
        return true;
      }

      return new Promise((resolve) => setConsent({ event, identity, capabilities, resolve }));
    },
    [bridge],
  );

  const registerFrame = useCallback<NappletShellContextValue["registerFrame"]>((windowId, win, identity) => {
    originRegistry.register(win, windowId, identity);
  }, []);

  const unregisterFrame = useCallback<NappletShellContextValue["unregisterFrame"]>(
    (windowId) => {
      originRegistry.unregister(windowId);
      sessionRegistry.unregister(windowId);
      bridge.runtime.destroyWindow(windowId);
    },
    [bridge],
  );

  const setIntentNavigator = useCallback<NappletShellContextValue["setIntentNavigator"]>((navigate) => {
    intentNavigatorRef.current = navigate;
  }, []);

  const context = useMemo(
    () => ({ bridge, capabilities, requestConsent, registerFrame, unregisterFrame, setIntentNavigator }),
    [bridge, capabilities, requestConsent, registerFrame, unregisterFrame, setIntentNavigator],
  );

  const respond = useCallback(
    (allow: boolean, always = false) => {
      if (!consent) return;
      if (allow) {
        grantCapabilities(bridge, consent.identity, consent.capabilities);
        if (always) addAlwaysAllowed(consent.identity);
      }
      consent.resolve(allow);
      setConsent(undefined);
    },
    [bridge, consent],
  );

  return (
    <NappletShellContext.Provider value={context}>
      {children}
      <Modal isOpen={!!consent} onClose={() => respond(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Grant napplet access?</ModalHeader>
          <ModalBody>
            {consent && (
              <>
                <Text mb="2">
                  <Code>{getNappletTitle(consent.event)}</Code> is requesting access until this frame is closed.
                </Text>
                <UnorderedList spacing="1">
                  {consent.capabilities.map((capability) => (
                    <ListItem key={capability}>
                      <Code>{capability}</Code>
                    </ListItem>
                  ))}
                </UnorderedList>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="ghost" onClick={() => respond(false)}>
                Deny
              </Button>
              <Button onClick={() => respond(true)}>Allow once</Button>
              <Button colorScheme="primary" onClick={() => respond(true, true)}>
                Always allow
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </NappletShellContext.Provider>
  );
}

export function useNappletShell() {
  const context = useContext(NappletShellContext);
  if (!context) throw new Error("NappletShellProvider missing");
  return context;
}
