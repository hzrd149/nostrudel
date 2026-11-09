import { useToast } from "@chakra-ui/react";
import type { IntentCandidate } from "@kehto/services";
import {
  buildShellCapabilities,
  createShellBridge,
  originRegistry,
  sessionRegistry,
  type ShellBridge,
  type ShellCapabilities,
} from "@kehto/shell";
import { use$, useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { getNappletWebrtcIdentity } from "../../helpers/nostr/napplet-webrtc";
import NappletConsentModal from "../../components/napplets/consent-modal";
import NappletIntentChoiceModal from "../../components/napplets/intent-choice-modal";
import { unique } from "../../helpers/array";
import { DEFAULT_APP_SETTINGS } from "../../helpers/app-settings";
import { AppSettingsQuery, BlossomServersQuery } from "../../models";
import accounts from "../../services/accounts";
import { installedNapplets$, intentHandlerPreferences$ } from "../../services/installed-napplets";
import { handlerPreferences$, handlerManifests$ } from "../../services/handler-preference-state";
import { getNappletIdentity, getUnsupportedNappletRequirements } from "../../helpers/nostr/napplets";
import { loadNostrResource } from "../../services/napplet-shell/resource-nostr";
import { createAdapter } from "../../services/napplet-shell/adapter";
import { createNappletIntentService } from "../../services/napplet-shell/intent-service";
import {
  addAlwaysAllowed,
  getWindowIdentity,
  grantCapabilities,
  hasApprovedCapability,
  getPermissionDecision,
  getLaunchPermissions,
  identityKey,
  getSessionCapabilities,
  permissionChanges$,
  synchronizePermissionStorage,
  registerWindowIdentity,
  revokeCapabilities,
  unregisterWindowIdentity,
  type NappletIdentity,
} from "../../services/napplet-shell/permissions";
import { type UploadConfig } from "../../services/napplet-shell/upload-service";

import NappletRuntimeConsentModal from "../../components/napplets/runtime-consent-modal";
import {
  createPermissionController,
  type PermissionPrompt,
  type PermissionAnswer,
} from "../../services/napplet-shell/permission-controller";
import { synchronizeRuntimePermissions } from "../../services/napplet-shell/permission-runtime";
import { createPermissionGate } from "../../services/napplet-shell/permission-gate";
import { getNappletPermissions, type NappletPermission } from "../../services/napplet-shell/permission-types";

type ConsentRequest = {
  event: NostrEvent;
  identity: NappletIdentity;
  capabilities: NappletPermission[];
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
  requestConsent: (event: NostrEvent, identity: NappletIdentity, capabilities: NappletPermission[]) => Promise<boolean>;
  /** `catalogId` is the frame's NAP-INTENT identity, attested as `sender` on intents it invokes */
  registerFrame: (
    windowId: string,
    win: Window,
    identity: NappletIdentity,
    catalogId: string,
    manifest: NostrEvent,
    onReady: () => void,
    onRevoked: () => void,
  ) => void;
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
  const permissionControllerRef = useRef<ReturnType<typeof createPermissionController>>();
  const permissionGateRef = useRef<ReturnType<typeof createPermissionGate>>();
  const frameCallbacks = useRef(new Map<string, { onReady: () => void; onRevoked: () => void }>());
  const launchGrantsRef = useRef(new Map<string, NappletPermission[]>());
  const [runtimeConsent, setRuntimeConsent] = useState<
    PermissionPrompt & { resolve(answer: PermissionAnswer): void }
  >();
  const runtimeQueueRef = useRef<(PermissionPrompt & { resolve(answer: PermissionAnswer): void })[]>([]);
  const [frameWebrtcIdentities] = useState(() => new Map<string, string>());
  const webrtc = useMemo(
    () => ({
      resolveIdentity: (windowId: string) => frameWebrtcIdentities.get(windowId),
      requestConsent: (windowId: string) =>
        permissionControllerRef.current?.authorize(windowId, "webrtc:connect") ?? Promise.resolve(false),
    }),
    [frameWebrtcIdentities],
  );
  const cvm = useMemo(
    () => ({
      resolveIdentity: (windowId: string) => frameWebrtcIdentities.get(windowId),
      requestConsent: (windowId: string, signal: AbortSignal) =>
        permissionControllerRef.current?.authorize(windowId, "cvm:call", signal) ?? Promise.resolve(false),
    }),
    [frameWebrtcIdentities],
  );
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
        isHandlerAllowed: (manifest) =>
          getUnsupportedNappletRequirements(manifest).length === 0 &&
          getNappletPermissions(manifest).every(
            (permission) => getPermissionDecision(getNappletIdentity(manifest), permission) !== "block",
          ),
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

    const subs = [
      installedNapplets$.subscribe(notify),
      intentHandlerPreferences$.subscribe(notify),
      handlerPreferences$.subscribe(notify),
      handlerManifests$.subscribe(notify),
    ];
    return () => subs.forEach((sub) => sub.unsubscribe());
  }, [intent]);

  const adapter = useMemo(
    () =>
      createAdapter(
        toast,
        intent.service,
        {
          getBlossomOrigins: () => blossomOriginsRef.current,
          authorize: (windowId, permission, signal) =>
            permissionControllerRef.current?.authorize(windowId, permission, signal) ?? Promise.resolve(false),
          loadNostr: loadNostrResource,
        },
        () => uploadRef.current,
        upload.enabled,
        webrtc,
        cvm,
      ),
    [toast, intent, upload.enabled, webrtc, cvm],
  );
  const bridge = useMemo(
    () =>
      createShellBridge({
        ...adapter,
        filterNappletMessage: (windowId, message) =>
          permissionGateRef.current?.filterMessage(windowId, message) ?? "drop",
        onNappletMessage: (windowId, message) => {
          if (message.type === "shell.ready") {
            const callbacks = frameCallbacks.current.get(windowId);
            queueMicrotask(() => {
              if (callbacks && callbacks === frameCallbacks.current.get(windowId) && originRegistry.getPort(windowId)) {
                callbacks.onReady();
              }
            });
          }
        },
        onNappletRevoked: ({ windowId }) => frameCallbacks.current.get(windowId)?.onRevoked(),
      }),
    [adapter],
  );
  // Single source of truth for advertised NAP domains: derived from the same
  // adapter the bridge uses, so shell.init and the namespace prelude can't drift.
  const capabilities = useMemo(() => buildShellCapabilities(adapter), [adapter]);

  useEffect(() => {
    const controller = createPermissionController({
      identity: getWindowIdentity,
      ask: (prompt) =>
        new Promise((resolve) => {
          if (prompt.signal.aborted) {
            resolve("deny");
            return;
          }
          const request = {
            ...prompt,
            resolve: (answer: PermissionAnswer) => {
              prompt.signal.removeEventListener("abort", abort);
              resolve(answer);
              runtimeQueueRef.current = runtimeQueueRef.current.filter((item) => item !== request);
              setRuntimeConsent(runtimeQueueRef.current[0]);
            },
          };
          const abort = () => request.resolve("deny");
          prompt.signal.addEventListener("abort", abort, { once: true });
          runtimeQueueRef.current.push(request);
          setRuntimeConsent(runtimeQueueRef.current[0]);
        }),
      grant: (identity, permission) =>
        grantCapabilities(bridge, identity, [...new Set([...getSessionCapabilities(identity), permission])]),
    });
    permissionControllerRef.current = controller;
    for (const windowId of originRegistry.getAllWindowIds()) controller.register(windowId);
    const gate = createPermissionGate(
      bridge,
      (windowId, permission, signal) => controller.authorize(windowId, permission, signal),
      capabilities.domains,
    );
    permissionGateRef.current = gate;
    window.addEventListener("message", bridge.handleMessage);
    window.addEventListener("storage", synchronizePermissionStorage);
    const changes = permissionChanges$.subscribe((change) =>
      synchronizeRuntimePermissions(bridge, adapter.services ?? {}, change),
    );
    const sub = accounts.active$.subscribe((account) => bridge.publishIdentityChanged(account?.pubkey ?? ""));
    return () => {
      changes.unsubscribe();
      sub.unsubscribe();
      gate.destroy();
      permissionGateRef.current = undefined;
      controller.dispose();
      permissionControllerRef.current = undefined;
      window.removeEventListener("message", bridge.handleMessage);
      window.removeEventListener("storage", synchronizePermissionStorage);
      bridge.destroy();
    };
  }, [bridge, adapter, capabilities.domains]);

  const requestConsent = useCallback<NappletShellContextValue["requestConsent"]>(
    async (event, identity, capabilities) => {
      if (
        capabilities.every(
          (permission) =>
            getPermissionDecision(identity, permission) === "allow" ||
            (getPermissionDecision(identity, permission) !== "block" && hasApprovedCapability(identity, permission)),
        )
      ) {
        const selected = getLaunchPermissions(identity);
        launchGrantsRef.current.set(identityKey(identity), selected);
        grantCapabilities(bridge, identity, selected);
        return true;
      }

      return new Promise((resolve) =>
        setConsent((current) => {
          if (current) {
            resolve(false);
            return current;
          }
          return { event, identity, capabilities, resolve };
        }),
      );
    },
    [bridge],
  );

  const registerFrame = useCallback<NappletShellContextValue["registerFrame"]>(
    (windowId, win, identity, catalogId, manifest, onReady, onRevoked) => {
      originRegistry.register(win, windowId, identity);
      registerWindowIdentity(windowId, identity);
      const selected = launchGrantsRef.current.get(identityKey(identity));
      if (selected) {
        launchGrantsRef.current.delete(identityKey(identity));
        grantCapabilities(bridge, identity, selected);
      }
      permissionControllerRef.current?.register(windowId);
      frameCatalogIds.set(windowId, catalogId);
      frameWebrtcIdentities.set(windowId, getNappletWebrtcIdentity(manifest));
      frameCallbacks.current.set(windowId, { onReady, onRevoked });
    },
    [bridge, frameCatalogIds, frameWebrtcIdentities],
  );

  const unregisterFrame = useCallback<NappletShellContextValue["unregisterFrame"]>(
    (windowId) => {
      frameCallbacks.current.delete(windowId);
      permissionControllerRef.current?.destroyWindow(windowId);
      frameWebrtcIdentities.delete(windowId);
      originRegistry.unregister(windowId);
      sessionRegistry.unregister(windowId);
      unregisterWindowIdentity(windowId);
      frameCatalogIds.delete(windowId);
      bridge.runtime.destroyWindow(windowId);
    },
    [bridge, frameCatalogIds, frameWebrtcIdentities],
  );

  const context = useMemo(
    () => ({ bridge, capabilities, requestConsent, registerFrame, unregisterFrame }),
    [bridge, capabilities, requestConsent, registerFrame, unregisterFrame],
  );

  const respond = useCallback(
    (allow: boolean, always = false, selected: NappletPermission[] = []) => {
      if (!consent) return;
      if (allow) {
        launchGrantsRef.current.set(identityKey(consent.identity), selected);
        grantCapabilities(bridge, consent.identity, [
          ...new Set([...getSessionCapabilities(consent.identity), ...selected]),
        ]);
        if (always) addAlwaysAllowed(consent.identity, selected);
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
      <NappletRuntimeConsentModal prompt={runtimeConsent} onRespond={(answer) => runtimeConsent?.resolve(answer)} />
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
