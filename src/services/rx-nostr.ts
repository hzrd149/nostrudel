import { createRxNostr } from "rx-nostr";
import { combineLatest } from "rxjs";

import verifyEvent from "./verify-event";
import { logger } from "../helpers/debug";
import clientRelaysService from "./client-relays";
import RelaySet from "../classes/relay-set";

const log = logger.extend("rx-nostr");

const rxNostr = createRxNostr({
  verifier: async (event) => {
    try {
      return verifyEvent(event);
    } catch (error) {}
    return false;
  },
  connectionStrategy: "lazy-keep",
  disconnectTimeout: 120_000,
});

// TODO: remove this when client relays are not longer needed
combineLatest([clientRelaysService.readRelays, clientRelaysService.writeRelays]).subscribe(([read, write]) => {
  const relays = RelaySet.from(read, write);

  // update the default relays
  rxNostr.setDefaultRelays(relays.urls.map((url) => ({ url, read: read.has(url), write: write.has(url) })));
});

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.rxNostr = rxNostr;

  rxNostr.createConnectionStateObservable().subscribe((state) => log(state.state, state.from));
}

export default rxNostr;
