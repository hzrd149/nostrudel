import { NostrEvent, VerifiedEvent, verifiedSymbol, verifyEvent } from "nostr-tools";
import { logger } from "../../helpers/debug";
import { setNostrWasm, verifyEvent as wasmVerifyEvent } from "nostr-tools/wasm";

const localStorageKey = "verify-event-method";

const log = logger.extend("VerifyEvent");
let selectedMethod = "default";
let verifyEventMethod: typeof verifyEvent;
let alwaysVerify: typeof verifyEvent;

export function fakeVerifyEvent(event: NostrEvent): event is VerifiedEvent {
  return (event[verifiedSymbol] = true);
}

function loadWithTimeout() {
  return new Promise<typeof verifyEvent>((res, rej) => {
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

try {
  selectedMethod = localStorage.getItem(localStorageKey) ?? "default";

  switch (selectedMethod) {
    case "wasm":
      if (!("WebAssembly" in window)) throw new Error("WebAssembly not supported");
      log("Loading WebAssembly module");
      verifyEventMethod = alwaysVerify = await loadWithTimeout();
      log("Loaded");
      break;
    case "none":
      log("Using fake verify event method");
      verifyEventMethod = fakeVerifyEvent;
      alwaysVerify = verifyEvent;
      break;
    case "default":
    default:
      log("Using nostr-tools default");
      verifyEventMethod = alwaysVerify = verifyEvent;
      break;
  }
} catch (error) {
  console.error("Failed to initialize event verification method, falling back to default");
  console.log(error);

  localStorage.setItem(localStorageKey, "default");
  verifyEventMethod = alwaysVerify = verifyEvent;
}

export { alwaysVerify, selectedMethod };
export default verifyEventMethod;
