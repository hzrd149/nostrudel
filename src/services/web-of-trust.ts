import { NostrEvent, kinds } from "nostr-tools";
import _throttle from "lodash.throttle";

import { PubkeyGraph } from "../classes/pubkey-graph";
import { COMMON_CONTACT_RELAY } from "../const";
import { logger } from "../helpers/debug";
import accountService from "./account";
import replaceableEventsService from "./replaceable-events";
import { getPubkeysFromList } from "../helpers/nostr/lists";

const log = logger.extend("web-of-trust");
let webOfTrust = new PubkeyGraph("");

let newEvents = 0;
const throttleUpdateWebOfTrust = _throttle(() => {
  log("Computing web-of-trust with", newEvents, "new events");
  webOfTrust.compute();
  newEvents = 0;
}, 5_000);

export function loadSocialGraph(
  web: PubkeyGraph,
  kind: number,
  pubkey: string,
  relay?: string,
  maxLvl = 0,
  walked: Set<string> = new Set(),
) {
  const contacts = replaceableEventsService.requestEvent(
    relay ? [relay, COMMON_CONTACT_RELAY] : [COMMON_CONTACT_RELAY],
    kind,
    pubkey,
  );

  walked.add(pubkey);

  const handleEvent = (event: NostrEvent) => {
    web.handleEvent(event);
    newEvents++;
    throttleUpdateWebOfTrust();

    if (maxLvl > 0) {
      for (const person of getPubkeysFromList(event)) {
        if (walked.has(person.pubkey)) continue;

        loadSocialGraph(web, kind, person.pubkey, person.relay, maxLvl - 1, walked);
      }
    }
  };

  if (contacts.value) {
    handleEvent(contacts.value);
  } else {
    contacts.once((event) => handleEvent(event));
  }
}

accountService.current.subscribe((account) => {
  if (!account) return;

  webOfTrust = new PubkeyGraph(account.pubkey);

  if (import.meta.env.DEV) {
    //@ts-expect-error
    window.webOfTrust = webOfTrust;
  }

  loadSocialGraph(webOfTrust, kinds.Contacts, account.pubkey, undefined, 1);
});

export function getWebOfTrust() {
  return webOfTrust;
}
