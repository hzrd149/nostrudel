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
  createLinkService,
  createNotifyService,
  createOutboxService,
  createRelayPoolOutboxRouter,
  createRelayPoolService,
  createThemeService,
  type OutboxRelayPool,
  type RelayListEntry,
} from "@kehto/services";
import {
  createShellBridge,
  originRegistry,
  sessionRegistry,
  type Capability,
  type RelayPoolLike,
  type ShellAdapter,
  type ShellBridge,
} from "@kehto/shell";
import { getContacts, getInboxes, getOutboxes } from "applesauce-core/helpers";
import { EventTemplate, Filter, kinds, NostrEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { catchError, filter, firstValueFrom, Observable, of, take, timeout, toArray } from "rxjs";

import { unique } from "../../helpers/array";
import { getNappletTitle } from "../../helpers/nostr/napplets";
import accounts from "../../services/accounts";
import { cacheRequest, eventCache$, writeEvent } from "../../services/event-cache";
import { eventStore } from "../../services/event-store";
import pool from "../../services/pool";
import localSettings from "../../services/preferences";
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
  requestConsent: (event: NostrEvent, identity: NappletIdentity, capabilities: Capability[]) => Promise<boolean>;
  registerFrame: (windowId: string, win: Window, identity: Pick<NappletIdentity, "dTag" | "aggregateHash">) => void;
  unregisterFrame: (windowId: string) => void;
};

const NappletShellContext = createContext<NappletShellContextValue | null>(null);

const ALWAYS_ALLOW_STORAGE_KEY = "nostrudel:napplet:always-allow";

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

function createAdapter(toast: ReturnType<typeof useToast>): ShellAdapter {
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
  const bridge = useMemo(() => createShellBridge(createAdapter(toast)), [toast]);

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

  const context = useMemo(
    () => ({ bridge, requestConsent, registerFrame, unregisterFrame }),
    [bridge, requestConsent, registerFrame, unregisterFrame],
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
