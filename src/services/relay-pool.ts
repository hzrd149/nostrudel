import RelayPool from "../classes/relay-pool";
import { offlineMode } from "./offline-mode";

const relayPoolService = new RelayPool();

setInterval(() => {
  if (document.visibilityState === "visible") {
    relayPoolService.reconnectRelays();
    relayPoolService.pruneRelays();
  }
}, 1000 * 15);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    relayPoolService.reconnectRelays();
  }
});

offlineMode.subscribe((offline) => {
  if (offline) {
    for (const [_, relay] of relayPoolService.relays) {
      relay.close();
    }
  }
});

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayPoolService = relayPoolService;
}

export default relayPoolService;
