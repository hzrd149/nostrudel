import { useToast } from "@chakra-ui/react";
import type { IntentCandidate } from "@kehto/services";
import {
  buildShellCapabilities,
  createShellBridge,
  originRegistry,
  sessionRegistry,
  type Capability,
  type ShellBridge,
  type ShellCapabilities,
} from "@kehto/shell";
import { use$, useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import NappletConsentModal from "../../components/napplets/consent-modal";
import NappletIntentChoiceModal from "../../components/napplets/intent-choice-modal";
import { unique } from "../../helpers/array";
import { DEFAULT_APP_SETTINGS } from "../../helpers/app-settings";
import { AppSettingsQuery, BlossomServersQuery } from "../../models";
import accounts from "../../services/accounts";
import { installedNapplets$, intentHandlerPreferences$ } from "../../services/installed-napplets";
import { createAdapter } from "../../services/napplet-shell/adapter";
import { createNappletIntentService } from "../../services/napplet-shell/intent-service";
import {
  addAlwaysAllowed,
  grantCapabilities,
  isAlwaysAllowed,
  registerWindowIdentity,
  revokeCapabilities,
  unregisterWindowIdentity,
  type NappletIdentity,
} from "../../services/napplet-shell/permissions";
import { type UploadConfig } from "../../services/napplet-shell/upload-service";

type ConsentRequest = {
  event: NostrEvent;
  identity: NappletIdentity;
  capabilities: Capability[];
  resolve: (value: boolean) => void;
};

type IntentChoiceRequest = {
  archetype: string;
  candidates: readonly IntentCandidate[];
  resolve: (catalogId?: string) => void;
};

type NappletShellContextValue = {
  bridge: ShellBridge;
  /** Shell capability set computed from the adapter via buildShellCapabilities. */
  capabilities: ShellCapabilities;
  requestConsent: (event: NostrEvent, identity: NappletIdentity, capabilities: Capability[]) => Promise<boolean>;
  /** `catalogId` is the frame's NAP-INTENT identity, attested as `sender` on intents it invokes */
  registerFrame: (windowId: string, win: Window, identity: NappletIdentity, catalogId: string) => void;
  unregisterFrame: (windowId: string) => void;
};

const NappletShellContext = createContext<NappletShellContextValue | null>(null);

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
  const [frameCatalogIds] = useState(() => new Map<string, string>());

  const intent = useMemo(
    () =>
      createNappletIntentService({
        // Only one chooser at a time; a request made while one is open is cancelled
        chooseHandler: (archetype, candidates) =>
          new Promise((resolve) =>
            setIntentChoice((current) => {
              if (!current) return { archetype, candidates, resolve };
              resolve(undefined);
              return current;
            }),
          ),
        resolveSender: (windowId) => frameCatalogIds.get(windowId),
      }),
    [frameCatalogIds],
  );

  // Push `intent.changed` for every role whose handlers or default may have changed
  useEffect(() => {
    let archetypes = new Set<string>();
    const notify = () => {
      const next = new Set(installedNapplets$.value.flatMap((napplet) => napplet.archetypes.map((a) => a.name)));
      for (const archetype of new Set([...archetypes, ...next])) intent.resolver.notifyChanged(archetype);
      archetypes = next;
    };

    const subs = [installedNapplets$.subscribe(notify), intentHandlerPreferences$.subscribe(notify)];
    return () => subs.forEach((sub) => sub.unsubscribe());
  }, [intent]);

  const adapter = useMemo(
    () =>
      createAdapter(
        toast,
        intent.service,
        { getBlossomOrigins: () => blossomOriginsRef.current },
        () => uploadRef.current,
        upload.enabled,
      ),
    [toast, intent, upload.enabled],
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

  const registerFrame = useCallback<NappletShellContextValue["registerFrame"]>(
    (windowId, win, identity, catalogId) => {
      originRegistry.register(win, windowId, identity);
      registerWindowIdentity(windowId, identity);
      frameCatalogIds.set(windowId, catalogId);
    },
    [frameCatalogIds],
  );

  const unregisterFrame = useCallback<NappletShellContextValue["unregisterFrame"]>(
    (windowId) => {
      originRegistry.unregister(windowId);
      sessionRegistry.unregister(windowId);
      unregisterWindowIdentity(windowId);
      frameCatalogIds.delete(windowId);
      bridge.runtime.destroyWindow(windowId);
    },
    [bridge, frameCatalogIds],
  );

  const context = useMemo(
    () => ({ bridge, capabilities, requestConsent, registerFrame, unregisterFrame }),
    [bridge, capabilities, requestConsent, registerFrame, unregisterFrame],
  );

  const respond = useCallback(
    (allow: boolean, always = false) => {
      if (!consent) return;
      if (allow) {
        grantCapabilities(bridge, consent.identity, consent.capabilities);
        if (always) addAlwaysAllowed(consent.identity, consent.capabilities);
      } else {
        revokeCapabilities(consent.identity);
      }
      consent.resolve(allow);
      setConsent(undefined);
    },
    [bridge, consent],
  );

  const respondIntentChoice = useCallback(
    (catalogId?: string) => {
      if (!intentChoice) return;
      intentChoice.resolve(catalogId);
      setIntentChoice(undefined);
    },
    [intentChoice],
  );

  return (
    <NappletShellContext.Provider value={context}>
      {children}
      <NappletConsentModal consent={consent} onRespond={respond} />
      <NappletIntentChoiceModal intentChoice={intentChoice} onRespond={respondIntentChoice} />
    </NappletShellContext.Provider>
  );
}

export function useNappletShell() {
  const context = useContext(NappletShellContext);
  if (!context) throw new Error("NappletShellProvider missing");
  return context;
}
