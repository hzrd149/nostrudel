import { NostrEvent, VerifiedEvent, verifiedSymbol, verifyEvent } from "nostr-tools";
import { logger } from "../../helpers/debug";

const localStorageKey = "verify-event-method";

const log = logger.extend("VerifyEvent");
let selectedMethod = "default";
let verifyEventMethod: typeof verifyEvent;
let alwaysVerify: typeof verifyEvent;

export function fakeVerifyEvent(event: NostrEvent): event is VerifiedEvent {
  return (event[verifiedSymbol] = true);
}

try {
  selectedMethod = localStorage.getItem(localStorageKey) ?? "default";

  switch (selectedMethod) {
    case "wasm":
      if (!("WebAssembly" in window)) throw new Error("WebAssembly not supported");
      log("Loading WebAssembly module");
      verifyEventMethod = alwaysVerify = (await import("./wasm")).default;
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

  verifyEventMethod = alwaysVerify = verifyEvent;
}

export { alwaysVerify, selectedMethod };
export default verifyEventMethod;
