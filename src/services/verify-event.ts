import { fakeVerifyEvent, setVerifyWrappedEventMethod } from "applesauce-core/helpers/event";
import { NostrEvent, verifyEvent as internalVerifyEvent } from "nostr-tools";
import { setNostrWasm, verifyEvent as wasmVerifyEvent } from "nostr-tools/wasm";
import { distinctUntilChanged } from "rxjs";

import { logger } from "../helpers/debug";
import localSettings from "./preferences";

const log = logger.extend("VerifyEvent");
let verifyEventMethod: typeof internalVerifyEvent;

function loadWithTimeout() {
  return new Promise<typeof internalVerifyEvent>((res, rej) => {
    const timeout = setTimeout(() => {
      log("Timeout");
      rej(new Error("Timeout"));
    }, 5_000);

    return import("nostr-wasm").then(({ initNostrWasm }) => {
      log("Initializing WebAssembly");

      return initNostrWasm().then((nw) => {
        clearTimeout(timeout);
        setNostrWasm(nw);
        res(wasmVerifyEvent);
        return wasmVerifyEvent;
      });
    });
  });
}

// aislop-ignore-next-line ai-slop/thin-wrapper -- indirects over the module-level verifyEventMethod, which updateVerifyMethod reassigns at runtime between the WebAssembly, internal, and fake strategies as localSettings.verifyEventMethod changes; inlining would bind callers to whichever implementation was loaded at import time and break the strategy swap. Consumers: services/event-store.ts, providers/global/napplet-shell-provider.tsx
export default function verifyEvent(event: NostrEvent) {
  return verifyEventMethod(event);
}

async function updateVerifyMethod() {
  try {
    switch (localSettings.verifyEventMethod.value) {
      case "wasm":
        if (!("WebAssembly" in window)) throw new Error("WebAssembly not supported");
        log("Loading WebAssembly module");
        verifyEventMethod = await loadWithTimeout();
        log("Loaded");
        break;
      case "none":
        log("Using fake verify event method");
        verifyEventMethod = fakeVerifyEvent;
        break;
      case "internal":
      default:
        log("Using internal nostr-tools");
        verifyEventMethod = internalVerifyEvent;
        break;
    }

    // Update wrapped verifyEvent method in applesauce-core
    setVerifyWrappedEventMethod(verifyEventMethod);
  } catch (error) {
    console.error("Failed to initialize event verification method, disabling");
    console.log(error);

    localSettings.verifyEventMethod.next("none");
    verifyEventMethod = internalVerifyEvent;
  }
}

localSettings.verifyEventMethod.pipe(distinctUntilChanged()).subscribe(updateVerifyMethod);
