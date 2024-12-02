import { AbstractRelay } from "nostr-tools/abstract-relay";
import RelayPool from "../classes/relay-pool";
import { localRelay } from "./local-relay";
import { offlineMode } from "./offline-mode";

const relayPoolService = new RelayPool();

setInterval(() => {
  if (document.visibilityState === "visible") {
    relayPoolService.disconnectFromUnused();
  }
}, 60_000);

offlineMode.subscribe((offline) => {
  if (offline) {
    for (const [_, relay] of relayPoolService.relays) {
      relay.close();
    }
  }
});

// add local relay
if (localRelay instanceof AbstractRelay) {
  relayPoolService.relays.set(localRelay.url, localRelay);
  localRelay.onnotice = (notice) => relayPoolService.handleRelayNotice(localRelay as AbstractRelay, notice);
}

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.relayPoolService = relayPoolService;
}

export default relayPoolService;
