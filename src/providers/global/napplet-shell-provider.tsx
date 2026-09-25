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

import { unique } from "../../helpers/array";
import { DEFAULT_APP_SETTINGS } from "../../helpers/app-settings";
import { getNappletTitle, type NappletIntent } from "../../helpers/nostr/napplets";
import { AppSettingsQuery, BlossomServersQuery } from "../../models";
import accounts from "../../services/accounts";
import { getInstalledNapplets, type InstalledNapplet } from "../../services/installed-napplets";
import { createAdapter } from "../../services/napplet-shell/adapter";
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
