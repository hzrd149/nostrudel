import { kinds } from "nostr-tools";
import _throttle from "lodash.throttle";
import { combineLatest, distinct, filter } from "rxjs";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";

import { COMMON_CONTACT_RELAY } from "../const";
import { logger } from "../helpers/debug";
import accountService from "./account";
import clientRelaysService from "./client-relays";
import { offlineMode } from "./offline-mode";
import replaceableEventsService from "./replaceable-events";
import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND } from "./user-app-settings";
import { queryStore } from "./event-store";
import { Account } from "../classes/accounts/account";

const log = logger.extend("UserEventSync");
function downloadEvents(account: Account) {
  const relays = clientRelaysService.readRelays.value;

  const requestReplaceable = (relays: Iterable<string>, kind: number, d?: string) => {
    replaceableEventsService.requestEvent(relays, kind, account.pubkey, d, {
      alwaysRequest: true,
    });
  };

  log("Loading outboxes");
  requestReplaceable([...relays, COMMON_CONTACT_RELAY], kinds.RelayList);

  const mailboxesSub = queryStore.mailboxes(account.pubkey).subscribe((mailboxes) => {
    log("Loading user information");
    requestReplaceable(mailboxes?.outboxes || relays, kinds.Metadata);
    requestReplaceable(mailboxes?.outboxes || relays, USER_BLOSSOM_SERVER_LIST_KIND);
    requestReplaceable(mailboxes?.outboxes || relays, kinds.SearchRelaysList);
    requestReplaceable(mailboxes?.outboxes || relays, APP_SETTINGS_KIND, APP_SETTING_IDENTIFIER);

    log("Loading contacts list");
    replaceableEventsService.requestEvent(
      [...clientRelaysService.readRelays.value, COMMON_CONTACT_RELAY],
      kinds.Contacts,
      account.pubkey,
      undefined,
      {
        alwaysRequest: true,
      },
    );
  });

  return () => {
    mailboxesSub.unsubscribe();
  };
}

combineLatest([
  // listen for account changes
  accountService.current.pipe(
    filter((a) => !!a),
    distinct((a) => a.pubkey),
  ),
  // listen for offline mode changes
  offlineMode.pipe(distinct()),
])
  .pipe(filter(([_, offline]) => !offline))
  .subscribe(([account]) => downloadEvents(account));
