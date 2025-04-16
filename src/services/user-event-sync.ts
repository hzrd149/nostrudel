import { kinds } from "nostr-tools";
import { IAccount } from "applesauce-accounts";
import { combineLatest, distinct } from "rxjs";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { createRxOneshotReq } from "rx-nostr";

import { DEFAULT_LOOKUP_RELAYS } from "../const";
import { logger } from "../helpers/debug";
import replaceableEventLoader from "./replaceable-loader";
import { eventStore, queryStore } from "./event-store";
import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND } from "../helpers/app-settings";
import accounts from "./accounts";
import localSettings from "./local-settings";
import rxNostr from "./rx-nostr";

const log = logger.extend("UserEventSync");
function downloadEvents(account: IAccount, relays: string[]) {
  const cleanup: (() => void)[] = [];

  const requestReplaceable = (relays: Iterable<string>, kind: number, d?: string) => {
    replaceableEventLoader.next({ relays: [...relays], kind, pubkey: account.pubkey, identifier: d, force: true });
  };

  log("Loading outboxes");
  requestReplaceable([...relays, ...DEFAULT_LOOKUP_RELAYS], kinds.RelayList);

  const mailboxesSub = queryStore.mailboxes(account.pubkey).subscribe((mailboxes) => {
    log("Loading user information");
    requestReplaceable(mailboxes?.outboxes || relays, kinds.Metadata);
    requestReplaceable(mailboxes?.outboxes || relays, USER_BLOSSOM_SERVER_LIST_KIND);
    requestReplaceable(mailboxes?.outboxes || relays, kinds.SearchRelaysList);
    requestReplaceable(mailboxes?.outboxes || relays, APP_SETTINGS_KIND, APP_SETTING_IDENTIFIER);

    log("Loading contacts list");
    replaceableEventLoader.next({
      relays: [...localSettings.readRelays.value, ...DEFAULT_LOOKUP_RELAYS],
      kind: kinds.Contacts,
      pubkey: account.pubkey,
      force: true,
    });

    if (mailboxes?.outboxes && mailboxes.outboxes.length > 0) {
      log(`Loading delete events`);
      const req = createRxOneshotReq({
        filters: [{ kinds: [kinds.EventDeletion], authors: [account.pubkey] }],
        rxReqId: "delete-events",
      });
      const sub = rxNostr.use(req, { on: { relays: mailboxes.outboxes } }).subscribe((packet) => {
        eventStore.add(packet.event, packet.from);
      });

      cleanup.push(() => sub.unsubscribe());
    }
  });

  return () => {
    for (const fn of cleanup) fn();
    mailboxesSub.unsubscribe();
  };
}

// listen for account changes
combineLatest([accounts.active$.pipe(distinct((a) => a?.pubkey)), localSettings.readRelays]).subscribe(
  ([account, relays]) => {
    if (!!account && relays.length > 0) downloadEvents(account, relays);
  },
);
