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
  Stack,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
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
import { getInboxes, getOutboxes } from "applesauce-core/helpers";
import { use$, useEventModel } from "applesauce-react/hooks";
import { EventTemplate, Filter, kinds, NostrEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { catchError, filter, firstValueFrom, of, take, timeout, toArray } from "rxjs";

import { unique } from "../../helpers/array";
import { DEFAULT_APP_SETTINGS } from "../../helpers/app-settings";
import { getNappletTitle, type NappletIntent } from "../../helpers/nostr/napplets";
import { AppSettingsQuery, BlossomServersQuery } from "../../models";
import accounts from "../../services/accounts";
import { cacheRequest, eventCache$, writeEvent } from "../../services/event-cache";
import { eventStore } from "../../services/event-store";
import pool from "../../services/pool";
import { getInstalledNapplets, type InstalledNapplet } from "../../services/installed-napplets";
import verifyEvent from "../../services/verify-event";
import {
  changeCommonFollow,
  getCommonFollows,
  getCommonProfile,
  getIdentityFollows,
  getIdentityProfile,
  reactCommon,
  reportCommon,
} from "../../services/napplet-shell/common-actions";
import { createNappletIntentService } from "../../services/napplet-shell/intent-service";
import { createResourceService } from "../../services/napplet-shell/resource-service";
import { createBlossomUploadService, type UploadConfig } from "../../services/napplet-shell/upload-service";
import {
  addAlwaysAllowed,
  grantCapabilities,
  isAlwaysAllowed,
  registerWindowIdentity,
  revokeCapabilities,
  unregisterWindowIdentity,
  type NappletIdentity,
} from "../../services/napplet-shell/permissions";
import { getReadRelays, getWriteRelays } from "../../services/napplet-shell/relay-tiers";

type ConsentRequest = {
  event: NostrEvent;
  identity: NappletIdentity;
  capabilities: Capability[];
  resolve: (value: boolean) => void;
};

type IntentChoiceRequest = {
  archetype: string;
  action: string;
  payload: Record<string, string>;
  resolve: (handler?: InstalledNapplet) => void;
};

type NappletShellContextValue = {
  bridge: ShellBridge;
  /** Shell capability set computed from the adapter via buildShellCapabilities. */
  capabilities: ShellCapabilities;
  requestConsent: (event: NostrEvent, identity: NappletIdentity, capabilities: Capability[]) => Promise<boolean>;
  registerFrame: (windowId: string, win: Window, identity: NappletIdentity) => void;
  unregisterFrame: (windowId: string) => void;
  setIntentNavigator: (navigate: ((intent: NappletIntent, handler: InstalledNapplet) => void) | null) => void;
};

const NappletShellContext = createContext<NappletShellContextValue | null>(null);

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

function createAdapter(
  toast: ReturnType<typeof useToast>,
  getIntentNavigator: () => ((intent: NappletIntent, handler: InstalledNapplet) => void) | null,
  chooseIntentHandler: (intent: NappletIntent) => Promise<InstalledNapplet | undefined>,
  resource: { getBlossomOrigins: () => string[] },
  getUpload: () => UploadConfig,
  uploadEnabled: boolean,
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
  const account = use$(accounts.active$);
  const settings = useEventModel(AppSettingsQuery, account ? [account.pubkey] : null) ?? DEFAULT_APP_SETTINGS;
  const blossomServers = useEventModel(BlossomServersQuery, account ? [account.pubkey] : null) ?? [];
  const blossomServerUrls = useMemo(() => blossomServers.map((server) => server.toString()), [blossomServers]);
  const blossomOrigins = useMemo(
    () => unique(blossomServerUrls.map((server) => new URL(server).origin)),
    [blossomServerUrls],
  );
  const upload = useMemo<UploadConfig>(
    () => ({
      enabled: settings.mediaUploadService === "blossom" && blossomServerUrls.length > 0,
      servers: blossomServerUrls,
    }),
    [settings.mediaUploadService, blossomServerUrls],
  );
  const blossomOriginsRef = useRef(blossomOrigins);
  const uploadRef = useRef(upload);
  blossomOriginsRef.current = blossomOrigins;
  uploadRef.current = upload;
  const [consent, setConsent] = useState<ConsentRequest>();
  const [intentChoice, setIntentChoice] = useState<IntentChoiceRequest>();
  const intentNavigatorRef = useRef<((intent: NappletIntent, handler: InstalledNapplet) => void) | null>(null);
  const getIntentNavigator = useCallback(() => intentNavigatorRef.current, []);
  const installedNapplets = useMemo(() => getInstalledNapplets(), [intentChoice]);

  const chooseIntentHandler = useCallback((intent: NappletIntent) => {
    if (getInstalledNapplets().length === 0) return Promise.resolve(undefined);
    return new Promise<InstalledNapplet | undefined>((resolve) => setIntentChoice({ ...intent, resolve }));
  }, []);

  const adapter = useMemo(
    () =>
      createAdapter(
        toast,
        getIntentNavigator,
        chooseIntentHandler,
        { getBlossomOrigins: () => blossomOriginsRef.current },
        () => uploadRef.current,
        upload.enabled,
      ),
    [toast, getIntentNavigator, chooseIntentHandler, upload.enabled],
  );
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
    registerWindowIdentity(windowId, identity);
  }, []);

  const unregisterFrame = useCallback<NappletShellContextValue["unregisterFrame"]>(
    (windowId) => {
      originRegistry.unregister(windowId);
      sessionRegistry.unregister(windowId);
      unregisterWindowIdentity(windowId);
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
      } else {
        revokeCapabilities(consent.identity);
      }
      consent.resolve(allow);
      setConsent(undefined);
    },
    [bridge, consent],
  );

  const respondIntentChoice = useCallback(
    (handler?: InstalledNapplet) => {
      if (!intentChoice) return;
      intentChoice.resolve(handler);
      setIntentChoice(undefined);
    },
    [intentChoice],
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
      <Modal isOpen={!!intentChoice} onClose={() => respondIntentChoice()} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Choose a napplet</ModalHeader>
          <ModalBody>
            {intentChoice && (
              <Stack spacing="3">
                <Text>
                  No installed napplet declares support for <Code>{intentChoice.archetype}</Code>/
                  <Code>{intentChoice.action}</Code>. Choose a napplet to handle this intent.
                </Text>
                <Stack spacing="2">
                  {installedNapplets.map((napplet) => (
                    <Button
                      key={napplet.address}
                      variant="outline"
                      justifyContent="flex-start"
                      whiteSpace="normal"
                      h="auto"
                      py="3"
                      onClick={() => respondIntentChoice(napplet)}
                    >
                      {napplet.title}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => respondIntentChoice()}>
              Cancel
            </Button>
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
