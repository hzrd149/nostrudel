import { OptimisticEventVerifier } from "applesauce-core";
import { setVerifyWrappedEventMethod } from "applesauce-core/helpers/event";
import localforage from "localforage";
import { NostrEvent, verifyEvent as internalVerifyEvent } from "nostr-tools";
import { setNostrWasm, verifyEvent as wasmVerifyEvent } from "nostr-tools/wasm";
import { BehaviorSubject, distinctUntilChanged, firstValueFrom } from "rxjs";

import { logger } from "../helpers/debug";
import localSettings from "./preferences";

const log = logger.extend("VerifyEvent");
let verifyEventMethod: typeof internalVerifyEvent = internalVerifyEvent;
let wasmVerifier: Promise<typeof internalVerifyEvent> | undefined;

async function initializeWasmVerifier() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const wasm = await Promise.race([
      import("nostr-wasm").then(({ initNostrWasm }) => initNostrWasm()),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Loading event verification WebAssembly timed out")), 5_000);
      }),
    ]);
    setNostrWasm(wasm);
    return wasmVerifyEvent;
  } finally {
    clearTimeout(timeout);
  }
}

function loadWasmVerifier() {
  return (wasmVerifier ??= initializeWasmVerifier().catch((error) => {
    wasmVerifier = undefined;
    throw error;
  }));
}

// aislop-ignore-next-line ai-slop/thin-wrapper -- keeps consumers bound to the current verifier when the performance setting changes
export default function verifyEvent(event: NostrEvent) {
  return verifyEventMethod(event);
}

const verificationStorage = localforage.createInstance({ name: "event-verification" });
let storageGeneration = 0;
const pendingWrites = new Set<Promise<unknown>>();
let resettingTrust = false;

function createOptimisticVerifier() {
  const generation = storageGeneration;
  return new OptimisticEventVerifier({
    storage: {
      getItem: (key) => verificationStorage.getItem<string>(key),
      setItem: async (key, value) => {
        // Retired verifiers must not restore evidence after a reset.
        if (generation !== storageGeneration) return;
        const write = verificationStorage.setItem(key, value);
        pendingWrites.add(write);
        try {
          await write;
        } finally {
          pendingWrites.delete(write);
        }
      },
    },
    verifyEvent,
  });
}

export let optimisticVerifier = createOptimisticVerifier();
export const optimisticVerifier$ = new BehaviorSubject(optimisticVerifier);

/** Include persisted relays even if they have not delivered an event in this session. */
export async function loadKnownVerificationRelays() {
  // This is the v1 storage key prefix used by applesauce-core's optimistic verifier.
  const prefix = "applesauce:optimistic-verifier:v1:";
  const generation = storageGeneration;
  const keys = await verificationStorage.keys();
  if (generation !== storageGeneration) return;
  for (const key of keys) {
    if (key.startsWith(prefix)) optimisticVerifier.getRelayState(key.slice(prefix.length));
  }
}

/** Drop both persisted evidence and in-memory trust and signature caches. */
export async function resetRelayTrust() {
  if (resettingTrust) return;
  resettingTrust = true;
  const relays = await firstValueFrom(optimisticVerifier.relays$);
  storageGeneration++;
  try {
    await Promise.allSettled([...pendingWrites]);
    await verificationStorage.clear();
    optimisticVerifier = createOptimisticVerifier();
    for (const relay of relays) optimisticVerifier.getRelayState(relay);
    optimisticVerifier$.next(optimisticVerifier);
  } finally {
    resettingTrust = false;
  }
}

/** Only public notes and comments may be sampled; account, payment, app, and wrapped events stay strict. */
export function verifyStoreEvent(event: NostrEvent) {
  if (event.kind !== 1 && event.kind !== 1111) return verifyEvent(event);
  if (localSettings.verifyEventMethod.value === "none") {
    // Do not mark unchecked events verified: downstream security checks must still verify them.
    return true;
  }
  return localSettings.optimisticVerification.value && !resettingTrust
    ? optimisticVerifier.verifyEvent(event)
    : verifyEvent(event);
}

let verificationRevision = 0;
async function updateVerifyMethod(method: string) {
  const revision = ++verificationRevision;
  // Keep verification available during initialization and while switching settings.
  verifyEventMethod = internalVerifyEvent;
  setVerifyWrappedEventMethod(verifyEvent);

  if (method !== "wasm" && method !== "wasm-strict") return;
  try {
    if (!("WebAssembly" in globalThis)) throw new Error("WebAssembly not supported");
    const verifier = await loadWasmVerifier();
    if (revision === verificationRevision) verifyEventMethod = verifier;
  } catch (error) {
    log("Failed to initialize WebAssembly; keeping JavaScript signature verification", error);
  }
}

localSettings.verifyEventMethod.pipe(distinctUntilChanged()).subscribe(updateVerifyMethod);
