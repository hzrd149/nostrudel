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
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NostrEvent } from "nostr-tools";
import {
  createShellBridge,
  originRegistry,
  sessionRegistry,
  type Capability,
  type ShellAdapter,
  type ShellBridge,
  type RelayPoolLike,
} from "@kehto/shell";
import {
  createIdentityService,
  createNotifyService,
  createRelayPoolService,
  createThemeService,
} from "@kehto/services";

import { unique } from "../../helpers/array";
import { getNappletRequiredCapabilities, getNappletTitle } from "../../helpers/nostr/napplets";
import accounts from "../../services/accounts";
import { eventStore } from "../../services/event-store";
import localSettings from "../../services/preferences";
import pool from "../../services/pool";
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
    workerRelay: {
      getWorkerRelay: () => null,
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

  adapter.services = {
    identity: createIdentityService({ getSigner }),
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
