import { kinds } from "nostr-tools";
import { COMMON_CONTACT_RELAY } from "../const";
import { logger } from "../helpers/debug";
import accountService from "./account";
import clientRelaysService from "./client-relays";
import { offlineMode } from "./offline-mode";
import replaceableEventLoaderService from "./replaceable-event-requester";
import userAppSettings from "./settings/user-app-settings";
import userMailboxesService from "./user-mailboxes";
import userMetadataService from "./user-metadata";

const log = logger.extend("user-event-sync");

function loadContactsList() {
  const account = accountService.current.value!;

  log("Loading contacts list");
  replaceableEventLoaderService.requestEvent(
    [...clientRelaysService.readRelays.value, COMMON_CONTACT_RELAY],
    kinds.Contacts,
    account.pubkey,
    undefined,
    {
      alwaysRequest: true,
    },
  );
}

function downloadEvents() {
  const account = accountService.current.value!;
  const relays = clientRelaysService.readRelays.value;

  log("Loading user information");
  userMetadataService.requestMetadata(account.pubkey, [...relays, COMMON_CONTACT_RELAY], { alwaysRequest: true });
  userMailboxesService.requestMailboxes(account.pubkey, [...relays, COMMON_CONTACT_RELAY], { alwaysRequest: true });
  userAppSettings.requestAppSettings(account.pubkey, relays, { alwaysRequest: true });

  loadContactsList();
}

accountService.current.subscribe((account) => {
  if (!account) return;
  downloadEvents();
});

offlineMode.subscribe((offline) => {
  if (!offline && accountService.current.value) downloadEvents();
});
