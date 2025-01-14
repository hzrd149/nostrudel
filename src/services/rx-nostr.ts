import { createRxNostr } from "rx-nostr";
import verifyEvent from "./verify-event";
import { logger } from "../helpers/debug";
import clientRelaysService from "./client-relays";
import { isFromCache } from "applesauce-core/helpers";

const log = logger.extend("rx-nostr");

const rxNostr = createRxNostr({
  verifier: async (event) => {
    try {
      return verifyEvent(event);
    } catch (error) {}
    return false;
  },
  connectionStrategy: "lazy-keep",
  // disconnectTimeout: 60_000,
});

// TODO: remove this when client relays are not longer needed
clientRelaysService.readRelays.subscribe((relays) => {
  rxNostr.setDefaultRelays(relays.urls);
});

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.rxNostr = rxNostr;

  rxNostr.createConnectionStateObservable().subscribe((state) => log(state.state, state.from));
}

export default rxNostr;
