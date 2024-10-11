import { kinds } from "nostr-tools";
import _throttle from "lodash.throttle";

import { COMMON_CONTACT_RELAY } from "../const";
import { logger } from "../helpers/debug";
import accountService from "./account";
import clientRelaysService from "./client-relays";
import { offlineMode } from "./offline-mode";
import replaceableEventsService from "./replaceable-events";
import userAppSettings, { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND } from "./user-app-settings";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { queryStore } from "./event-store";

const log = logger.extend("user-event-sync");

function downloadEvents() {
  const account = accountService.current.value!;
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
    userAppSettings.requestAppSettings(account.pubkey, relays, { alwaysRequest: true });

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

let unsubscribe: Function | undefined;
function update() {
  const account = accountService.current.value;
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = undefined;
  }

  if (offlineMode.value) return;
  if (!account) return;
  unsubscribe = downloadEvents();
}

accountService.current.subscribe(update);
offlineMode.subscribe(update);
