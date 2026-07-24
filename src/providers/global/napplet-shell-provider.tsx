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
  createIntentService,
  createLinkService,
  createNotifyService,
  createOutboxService,
  createRelayPoolOutboxRouter,
  createRelayPoolService,
  createThemeService,
  createUploadService,
  type IntentAvailability,
  type IntentCandidate,
  type IntentRequest,
  type IntentResult,
  type OutboxRelayPool,
  type RelayListEntry,
} from "@kehto/services";
import type {
  CommonActionResult,
  CommonFollowsResult,
  CommonProfileResult,
  CommonProfileTarget,
  CommonReaction,
  CommonReportReason,
  CommonReportTarget,
} from "@napplet/core";
import { FollowUser, UnfollowUser } from "applesauce-actions/actions";
import { ReactionFactory } from "applesauce-common/factories";
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
import { use$, useEventModel } from "applesauce-react/hooks";
import { EventTemplate, Filter, kinds, nip19, NostrEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { catchError, filter, firstValueFrom, Observable, of, take, timeout, toArray } from "rxjs";

import { unique } from "../../helpers/array";
import { DEFAULT_APP_SETTINGS } from "../../helpers/app-settings";
import { stripSensitiveMetadataOnFile } from "../../helpers/image";
import { simpleMultiServerUpload } from "../../helpers/media-upload/blossom";
import { conventionId, getNappletTitle, type NappletIntent } from "../../helpers/nostr/napplets";
import { AppSettingsQuery, BlossomServersQuery } from "../../models";
import accounts from "../../services/accounts";
import { cacheRequest, eventCache$, writeEvent } from "../../services/event-cache";
import { eventStore } from "../../services/event-store";
import pool from "../../services/pool";
import localSettings from "../../services/preferences";
import {
  getDefaultIntentHandler,
  getInstalledNapplets,
  getInstalledNappletsForIntent,
  type InstalledNapplet,
} from "../../services/installed-napplets";
import actions from "../../services/actions";
import verifyEvent from "../../services/verify-event";

type NappletIdentity = {
  pubkey: string;
  dTag: string;
  aggregateHash: string;
  title?: string;
};

type ResourceIdentity = Pick<NappletIdentity, "pubkey" | "dTag" | "aggregateHash" | "title">;

type ConsentRequest = {
  event: NostrEvent;
  identity: NappletIdentity;
  capabilities: Capability[];
  resolve: (value: boolean) => void;
};

type ResourceConsentRequest = {
  identity: ResourceIdentity;
  origin: string;
  resolve: (value: "deny" | "once" | "always") => void;
};

type IntentChoiceRequest = {
  archetype: string;
  action: string;
  payload: Record<string, string>;
  resolve: (handler?: InstalledNapplet) => void;
};

type UploadConfig = {
  enabled: boolean;
  servers: string[];
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

const ALWAYS_ALLOW_STORAGE_KEY = "nostrudel:napplet:always-allow";
const RESOURCE_ALWAYS_ALLOW_STORAGE_KEY = "nostrudel:napplet:resource:always-allow";

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

const windowIdentities = new Map<string, ResourceIdentity>();

function identityKey(identity: NappletIdentity) {
  return `${identity.pubkey}:${identity.dTag}:${identity.aggregateHash}`;
}

function resourceGrantKey(identity: ResourceIdentity, origin: string) {
  return `${identity.pubkey}:${identity.dTag}:${identity.aggregateHash}:${origin}`;
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

function getAlwaysAllowedResourceOrigins() {
  try {
    return JSON.parse(localStorage.getItem(RESOURCE_ALWAYS_ALLOW_STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function addAlwaysAllowedResourceOrigin(identity: ResourceIdentity, origin: string) {
  const allowed = new Set(getAlwaysAllowedResourceOrigins());
  allowed.add(resourceGrantKey(identity, origin));
  localStorage.setItem(RESOURCE_ALWAYS_ALLOW_STORAGE_KEY, JSON.stringify(Array.from(allowed)));
}

function isAlwaysAllowedResourceOrigin(identity: ResourceIdentity, origin: string) {
  return getAlwaysAllowedResourceOrigins().includes(resourceGrantKey(identity, origin));
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

function installedHandlersFor(archetype: string) {
  return getInstalledNapplets().flatMap((napplet) => {
    const entry = napplet.archetypes.find((item) => item.name === archetype);
    return entry ? [{ napplet, entry }] : [];
  });
}

function candidateFor(handler: ReturnType<typeof installedHandlersFor>[number], action?: string): IntentCandidate {
  return {
    dTag: handler.napplet.address,
    title: handler.napplet.title,
    actions: handler.entry.actions,
    protocols: handler.entry.protocols.length
      ? handler.entry.protocols
      : handler.entry.actions.map((action) => conventionId(handler.entry.name, action)),
    isDefault: getDefaultIntentHandler(handler.entry.name, action)?.address === handler.napplet.address,
  };
}

function availabilityFor(archetype: string): IntentAvailability {
  const handlers = installedHandlersFor(archetype);
  return {
    archetype,
    available: handlers.length > 0,
    candidates: handlers.map((handler) => candidateFor(handler)),
    hasDefault: handlers.some((handler) => !!getDefaultIntentHandler(archetype, handler.entry.actions[0])),
  };
}

function failed(archetype: string, action: string, error: string): IntentResult {
  return { ok: false, archetype, action, handled: false, error };
}

function handlerMatchesPreference(napplet: InstalledNapplet, preference: string) {
  return preference === napplet.address;
}

function createNappletIntentService(options: {
  navigate: () => ((intent: NappletIntent, handler: InstalledNapplet) => void) | null;
  chooseHandler: (intent: NappletIntent) => Promise<InstalledNapplet | undefined>;
}) {
  return createIntentService({
    resolver: {
      available: (archetype) => availabilityFor(archetype),

      handlers: () => {
        const archetypes = new Set<string>();
        for (const napplet of getInstalledNapplets()) {
          for (const archetype of napplet.archetypes) archetypes.add(archetype.name);
        }
        return Array.from(archetypes).map(availabilityFor);
      },

      invoke: async (request: IntentRequest) => {
        const { archetype } = request;
        const action = request.action ?? "open";
        const handlers = installedHandlersFor(archetype).filter((handler) => handler.entry.actions.includes(action));
        const payload = asIntentPayload(request.payload);

        if (handlers.length === 0) {
          const handler = await options.chooseHandler({ archetype, action, payload });
          if (!handler) return failed(archetype, action, "no napplet selected");

          const navigate = options.navigate();
          if (!navigate) return failed(archetype, action, "napplet frame is not available");

          window.setTimeout(() => navigate({ archetype, action, payload }, handler), 0);

          return {
            ok: true,
            archetype,
            action,
            handled: true,
            handler: handler.address,
            windowId: `napplet:${handler.address}`,
            protocol: request.protocol ?? conventionId(archetype, action),
          };
        }

        const preference = request.handler;
        const defaultHandler = getDefaultIntentHandler(archetype, action);
        const handler =
          typeof preference === "string" && preference !== "default" && preference !== "choose"
            ? handlers.find((item) => handlerMatchesPreference(item.napplet, preference))
            : defaultHandler
              ? handlers.find((item) => item.napplet.address === defaultHandler.address)
              : getInstalledNappletsForIntent(archetype, action).length > 0
                ? handlers.find(
                    (item) => item.napplet.address === getInstalledNappletsForIntent(archetype, action)[0].address,
                  )
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

        const intent = { archetype, action, payload };
        window.setTimeout(() => navigate(intent, handler.napplet), 0);

        return {
          ok: true,
          archetype,
          action,
          handled: true,
          handler: handler.napplet.address,
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

function normalizeCommonPubkey(value: string) {
  if (/^[0-9a-f]{64}$/i.test(value)) return value.toLowerCase();

  try {
    const decoded = nip19.decode(value);
    if (decoded.type === "npub") return decoded.data;
    if (decoded.type === "nprofile") return decoded.data.pubkey;
  } catch {
    // handled by returning undefined below
  }
}

function normalizeCommonEventId(value: string) {
  if (/^[0-9a-f]{64}$/i.test(value)) return value.toLowerCase();

  try {
    const decoded = nip19.decode(value);
    if (decoded.type === "note") return decoded.data;
    if (decoded.type === "nevent") return decoded.data.id;
  } catch {
    // handled by returning undefined below
  }
}

function getProfilePointer(target: CommonProfileTarget) {
  if (/^[0-9a-f]{64}$/i.test(target))
    return { pubkey: target.toLowerCase(), relays: undefined as string[] | undefined };

  try {
    const decoded = nip19.decode(target);
    if (decoded.type === "npub") return { pubkey: decoded.data, relays: undefined as string[] | undefined };
    if (decoded.type === "nprofile") return { pubkey: decoded.data.pubkey, relays: decoded.data.relays };
  } catch {
    // handled by returning undefined below
  }
}

async function publishCommonEvent(label: string, draft: EventTemplate | NostrEvent): Promise<CommonActionResult> {
  try {
    const account = accounts.active;
    if (!account) return { ok: false, error: "not-signed-in" };

    const event =
      Reflect.has(draft, "id") && Reflect.has(draft, "sig") ? (draft as NostrEvent) : await account.signEvent(draft);

    await writeEvent(event);
    eventStore.add(event);
    pool.publish(getWriteRelays(), event);

    return { ok: true, eventId: event.id, event };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function getCommonProfile(target: CommonProfileTarget): Promise<CommonProfileResult> {
  const pointer = getProfilePointer(target);
  if (!pointer) return { ok: false, pubkey: "", error: "invalid-profile-target" };

  const event = await firstOrUndefined(
    eventStore.replaceable({ kind: kinds.Metadata, pubkey: pointer.pubkey, relays: pointer.relays }),
    5000,
  );
  if (!event) return { ok: true, pubkey: pointer.pubkey, profile: null };

  try {
    return { ok: true, pubkey: pointer.pubkey, profile: JSON.parse(event.content), result: { event } };
  } catch {
    return { ok: false, pubkey: pointer.pubkey, error: "invalid-profile-metadata", result: { event } };
  }
}

async function getCommonFollows(): Promise<CommonFollowsResult> {
  const account = accounts.active;
  if (!account) return { ok: false, pubkeys: [], error: "not-signed-in" };

  return { ok: true, pubkeys: await getIdentityFollows(account.pubkey) };
}

async function changeCommonFollow(pubkeys: string[], follow: boolean): Promise<CommonActionResult> {
  const normalized = pubkeys.map(normalizeCommonPubkey);
  if (normalized.some((pubkey) => !pubkey)) return { ok: false, error: "invalid-pubkey" };

  let result: CommonActionResult = { ok: true };
  for (const pubkey of normalized as string[]) {
    await actions.exec(follow ? FollowUser : UnfollowUser, pubkey).forEach(async (event) => {
      result = await publishCommonEvent(follow ? "Follow user" : "Unfollow user", event);
    });
    if (!result.ok) return result;
  }

  return result;
}

async function reactCommon(
  targetEventId: string,
  reaction: CommonReaction,
  customEmojiHref: string | undefined,
): Promise<CommonActionResult> {
  const eventId = normalizeCommonEventId(targetEventId);
  if (!eventId) return { ok: false, error: "invalid-event-id" };

  const event = await firstOrUndefined(eventStore.event(eventId), 5000);
  if (!event) return { ok: false, error: "event-not-found" };

  const emoji = customEmojiHref ? { shortcode: reaction, url: customEmojiHref } : reaction;
  const draft = await ReactionFactory.create(event, emoji as string);
  return publishCommonEvent("Reaction", draft as unknown as EventTemplate);
}

function createReportDraft(
  target: CommonReportTarget,
  reason: CommonReportReason,
  text: string,
): EventTemplate | undefined {
  if (target.type === "pubkey") {
    const pubkey = normalizeCommonPubkey(target.pubkey);
    if (!pubkey) return;
    return {
      kind: kinds.Report,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["p", pubkey, reason]],
      content: text,
    };
  }

  const eventId = normalizeCommonEventId(target.id);
  if (!eventId) return;

  const tags = [["e", eventId, reason]];
  const pubkey = target.pubkey && normalizeCommonPubkey(target.pubkey);
  if (pubkey) tags.push(["p", pubkey]);
  return { kind: kinds.Report, created_at: Math.floor(Date.now() / 1000), tags, content: text };
}

function reportCommon(target: CommonReportTarget, reason: CommonReportReason, text: string) {
  const draft = createReportDraft(target, reason, text);
  if (!draft) return Promise.resolve({ ok: false, error: "invalid-report-target" });
  return publishCommonEvent("Report", draft);
}

function blobToFile(data: ArrayBuffer | Blob, filename: string | undefined, mimeType: string | undefined) {
  if (data instanceof File) return data;

  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  return new File([blob], filename || "upload", { type: mimeType || blob.type });
}

function createBlossomUploadService(upload: UploadConfig) {
  return createUploadService({
    uploadInfo: {
      rails: [
        {
          rail: "blossom",
          enabled: upload.enabled,
          returns: ["url", "sha256", "size", "mimeType", "nip94"],
        },
      ],
    },
    uploader: {
      upload: async (request: any, ctx: any) => {
        if (!upload.enabled) throw new Error("Blossom upload is not configured");
        if (request.rail && request.rail !== "blossom") throw new Error("Only Blossom uploads are supported");

        const account = accounts.active;
        if (!account) throw new Error("No active account to sign upload auth");

        ctx.onStatus({ ok: true, uploadId: ctx.uploadId, status: "uploading", rail: "blossom" });

        const file = await stripSensitiveMetadataOnFile(blobToFile(request.data, request.filename, request.mimeType));
        const blob = await simpleMultiServerUpload(upload.servers, file, account.signEvent.bind(account));
        const nip94 = (Reflect.get(blob, "nip94") || []) as string[][];

        return {
          ok: true,
          uploadId: ctx.uploadId,
          status: "complete",
          rail: "blossom",
          url: blob.url,
          fallbackUrls: upload.servers.map((server) => `${server.replace(/\/$/, "")}/${blob.sha256}`),
          sha256: blob.sha256,
          size: blob.size ?? file.size,
          mimeType: blob.type || file.type || nip94.find((tag) => tag[0] === "m")?.[1],
          nip94,
        };
      },
    },
  });
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  const chunk = 32768;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function requestIdFromMessage(message: any) {
  if (typeof message.id === "string" && message.id.length > 0) return message.id;
  if (typeof message.requestId === "string" && message.requestId.length > 0) return message.requestId;
  return null;
}

function sendResourceError(send: (message: any) => void, requestId: string, code: string, message: string) {
  send({
    type: "resource.bytes.error",
    id: requestId,
    requestId,
    code,
    message,
    error: code === "denied" ? "blocked-by-policy" : code === "invalid-url" ? "invalid-request" : "network-error",
  });
}

function createResourceService(options: {
  blossomOrigins: string[];
  requestGrant: (identity: ResourceIdentity, origin: string) => Promise<boolean>;
}) {
  const inFlight = new Map<string, AbortController>();
  const perWindow = new Map<string, Set<string>>();

  const isGranted = async (identity: ResourceIdentity, origin: string) => {
    if (options.blossomOrigins.includes(origin)) return true;
    if (isAlwaysAllowedResourceOrigin(identity, origin)) return true;
    return options.requestGrant(identity, origin);
  };

  const track = (windowId: string, requestId: string, controller: AbortController) => {
    inFlight.set(requestId, controller);
    if (!perWindow.has(windowId)) perWindow.set(windowId, new Set());
    perWindow.get(windowId)!.add(requestId);
  };

  const untrack = (windowId: string, requestId: string) => {
    inFlight.delete(requestId);
    perWindow.get(windowId)?.delete(requestId);
  };

  const fetchOne = async (
    windowId: string,
    requestId: string,
    url: string,
    init: any,
    send: (message: any) => void,
  ) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      sendResourceError(send, requestId, "invalid-url", `invalid URL: ${url}`);
      return;
    }

    const identity = windowIdentities.get(windowId);
    if (!identity) {
      sendResourceError(send, requestId, "denied", "napplet identity not resolvable");
      return;
    }
    if (!(await isGranted(identity, parsed.origin))) {
      sendResourceError(send, requestId, "denied", `origin ${parsed.origin} not granted`);
      return;
    }

    const controller = new AbortController();
    track(windowId, requestId, controller);
    try {
      const response = await fetch(url, {
        method: init?.method,
        headers: init?.headers ? { ...init.headers } : undefined,
        signal: controller.signal,
      });
      const buffer = await response.arrayBuffer();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => (headers[key] = value));
      const mime = response.headers.get("content-type") || "application/octet-stream";
      send({
        type: "resource.bytes.result",
        id: requestId,
        requestId,
        blob: new Blob([buffer], { type: mime }),
        mime,
        status: response.status,
        headers,
        bodyBase64: arrayBufferToBase64(buffer),
      });
    } catch (e) {
      const aborted = controller.signal.aborted || (e instanceof Error && e.name === "AbortError");
      sendResourceError(
        send,
        requestId,
        aborted ? "canceled" : "network-error",
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      untrack(windowId, requestId);
    }
  };

  return {
    descriptor: {
      name: "resource",
      version: "1.0.0",
      description: "NAP-RESOURCE shell fetch with noStrudel origin policy",
    },
    handleMessage(windowId: string, message: any, send: (message: any) => void) {
      switch (message.type) {
        case "resource.info": {
          const id = requestIdFromMessage(message);
          if (id) send({ type: "resource.info.result", id, info: { schemes: [{ scheme: "https", enabled: true }] } });
          return;
        }
        case "resource.bytes": {
          const id = requestIdFromMessage(message);
          if (id && typeof message.url === "string") fetchOne(windowId, id, message.url, message.init, send);
          return;
        }
        case "resource.bytesMany": {
          const id = requestIdFromMessage(message);
          if (!id || !Array.isArray(message.urls)) return;
          Promise.all(
            message.urls.map(async (url: string) => {
              const itemId = `${id}:${url}`;
              let result: any;
              await fetchOne(windowId, itemId, url, message.init, (response) => (result = response));
              if (result?.type === "resource.bytes.result")
                return { url, ok: true, blob: result.blob, mime: result.mime };
              return {
                url,
                ok: false,
                error: result?.error ?? "network-error",
                code: result?.code,
                message: result?.message,
              };
            }),
          ).then((items) => send({ type: "resource.bytesMany.result", id, requestId: id, items }));
          return;
        }
        case "resource.cancel": {
          const id = requestIdFromMessage(message);
          if (id) inFlight.get(id)?.abort();
          return;
        }
      }
    },
    onWindowDestroyed(windowId: string) {
      for (const id of perWindow.get(windowId) ?? []) inFlight.get(id)?.abort();
      perWindow.delete(windowId);
    },
  };
}

function getReadRelays() {
  return localSettings.fallbackRelays.value;
}

function getWriteRelays() {
  return unique([...localSettings.extraPublishRelays.value, ...localSettings.fallbackRelays.value]);
}

function createAdapter(
  toast: ReturnType<typeof useToast>,
  getIntentNavigator: () => ((intent: NappletIntent, handler: InstalledNapplet) => void) | null,
  chooseIntentHandler: (intent: NappletIntent) => Promise<InstalledNapplet | undefined>,
  resource: {
    blossomOrigins: string[];
    requestGrant: (identity: ResourceIdentity, origin: string) => Promise<boolean>;
  },
  upload: UploadConfig,
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
    capabilities: { disabledDomains: [...DISABLED_NAP_DOMAINS, ...(upload.enabled ? [] : ["upload"])] },
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
    common: createCommonService({
      getProfile: getCommonProfile,
      follows: getCommonFollows,
      follow: (pubkeys) => changeCommonFollow(pubkeys, true),
      unfollow: (pubkeys) => changeCommonFollow(pubkeys, false),
      react: reactCommon,
      report: reportCommon,
    }),
    resource: createResourceService(resource),
    upload: createBlossomUploadService(upload),
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
  const [consent, setConsent] = useState<ConsentRequest>();
  const [resourceConsent, setResourceConsent] = useState<ResourceConsentRequest>();
  const [intentChoice, setIntentChoice] = useState<IntentChoiceRequest>();
  const sessionResourceGrantsRef = useRef(new Set<string>());
  const resourceGrantQueueRef = useRef(Promise.resolve());
  const intentNavigatorRef = useRef<((intent: NappletIntent, handler: InstalledNapplet) => void) | null>(null);
  const getIntentNavigator = useCallback(() => intentNavigatorRef.current, []);
  const installedNapplets = useMemo(() => getInstalledNapplets(), [intentChoice]);

  const requestResourceGrant = useCallback((identity: ResourceIdentity, origin: string) => {
    const ask = async () => {
      const key = resourceGrantKey(identity, origin);
      if (sessionResourceGrantsRef.current.has(key) || isAlwaysAllowedResourceOrigin(identity, origin)) return true;

      const response = await new Promise<"deny" | "once" | "always">((resolve) =>
        setResourceConsent({ identity, origin, resolve }),
      );

      if (response === "deny") return false;
      if (response === "always") addAlwaysAllowedResourceOrigin(identity, origin);
      else sessionResourceGrantsRef.current.add(key);
      return true;
    };

    const next = resourceGrantQueueRef.current.then(ask, ask);
    resourceGrantQueueRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, []);

  const resource = useMemo(
    () => ({ blossomOrigins, requestGrant: requestResourceGrant }),
    [blossomOrigins, requestResourceGrant],
  );

  const chooseIntentHandler = useCallback((intent: NappletIntent) => {
    if (getInstalledNapplets().length === 0) return Promise.resolve(undefined);
    return new Promise<InstalledNapplet | undefined>((resolve) => setIntentChoice({ ...intent, resolve }));
  }, []);

  const adapter = useMemo(
    () => createAdapter(toast, getIntentNavigator, chooseIntentHandler, resource, upload),
    [toast, getIntentNavigator, chooseIntentHandler, resource, upload],
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
    windowIdentities.set(windowId, identity);
  }, []);

  const unregisterFrame = useCallback<NappletShellContextValue["unregisterFrame"]>(
    (windowId) => {
      originRegistry.unregister(windowId);
      sessionRegistry.unregister(windowId);
      windowIdentities.delete(windowId);
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

  const respondResource = useCallback(
    (response: "deny" | "once" | "always") => {
      if (!resourceConsent) return;
      resourceConsent.resolve(response);
      setResourceConsent(undefined);
    },
    [resourceConsent],
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
      <Modal isOpen={!!resourceConsent} onClose={() => respondResource("deny")} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Allow network access?</ModalHeader>
          <ModalBody>
            {resourceConsent && (
              <Text>
                <Code>{resourceConsent.identity.title || resourceConsent.identity.dTag}</Code> wants to connect to{" "}
                <Code>{resourceConsent.origin}</Code>.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="ghost" onClick={() => respondResource("deny")}>
                Deny
              </Button>
              <Button onClick={() => respondResource("once")}>Allow once</Button>
              <Button colorScheme="primary" onClick={() => respondResource("always")}>
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
