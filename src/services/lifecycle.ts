import { IAccount } from "applesauce-accounts";
import { isFromCache } from "applesauce-core/helpers";
import { defined, mapEventsToStore } from "applesauce-core/observable";
import { onlyEvents } from "applesauce-relay";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { kinds, nip42 } from "nostr-tools";
import {
  combineLatest,
  distinct,
  distinctUntilChanged,
  filter,
  ignoreElements,
  map,
  merge,
  NEVER,
  of,
  share,
  switchMap,
  tap,
  timer,
} from "rxjs";

import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND } from "../helpers/app-settings";
import { MailboxesQuery } from "../models";
import { DirectMessageRelays } from "../models/messages";
import accounts from "./accounts";
import authenticationSigner from "./authentication-signer";
import { writeEvent } from "./event-cache";
import { eventStore } from "./event-store";
import { addressLoader } from "./loaders";
import pool from "./pool";
import localSettings from "./preferences";

// watch for new events and send them to the cache relay
eventStore.insert$.pipe(filter((event) => !isFromCache(event))).subscribe(writeEvent);

const addressable = (account: IAccount, relays: Iterable<string>, kind: number, d?: string) => {
  return addressLoader({ relays: [...relays], kind, pubkey: account.pubkey, identifier: d, cache: false });
};

// listen for account changes and load users events
combineLatest([
  accounts.active$.pipe(
    defined(),
    distinct((a) => a?.pubkey),
  ),
  localSettings.readRelays,
])
  .pipe(
    switchMap(([account, relays]) =>
      combineLatest([of(account), eventStore.model(MailboxesQuery, { pubkey: account.pubkey, relays })] as const),
    ),
    switchMap(([account, mailboxes]) => {
      if (!mailboxes?.outboxes) return NEVER;

      const info = merge(
        // Load user information
        addressable(account, mailboxes?.outboxes, kinds.Metadata),
        addressable(account, mailboxes?.outboxes, kinds.Contacts),
        addressable(account, mailboxes?.outboxes, USER_BLOSSOM_SERVER_LIST_KIND),
        addressable(account, mailboxes?.outboxes, kinds.SearchRelaysList),
        addressable(account, mailboxes?.outboxes, APP_SETTINGS_KIND, APP_SETTING_IDENTIFIER),
      );

      // load latest delete events
      const deletes = pool.request(mailboxes.outboxes, {
        kinds: [kinds.EventDeletion],
        authors: [account.pubkey],
      });

      return merge(info, deletes);
    }),
  )
  .subscribe();

// Attempt to authenticate with all relays
pool.relays$
  .pipe(
    switchMap((relays) =>
      merge(
        ...Array.from(relays.values()).map((relay) =>
          relay.challenge$.pipe(
            defined(),
            // Wait for a challenge to change
            distinctUntilChanged(),
            // Create auth draft
            map((c) => nip42.makeAuthEvent(relay.url, c)),
            // sign draft
            switchMap((draft) => authenticationSigner.signEvent(draft)),
            // send auth event
            switchMap((event) => relay.auth(event)),
          ),
        ),
      ),
    ),
  )
  .subscribe();

// Update authentication signer when relays status change
pool.relays$
  .pipe(
    switchMap((relays) =>
      merge(
        ...Array.from(relays.values()).map((relay) =>
          relay.connected$.pipe(
            // Update signer when relay connection state changes
            tap((connected) => authenticationSigner.handleRelayConnectionState(relay.url, connected)),
          ),
        ),
      ),
    ),
  )
  .subscribe();

// Observable to subscribe to NIP-65 inboxes for legacy messages
export const legacyMessageSubscription = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return NEVER;
    const inboxes = eventStore.model(MailboxesQuery, account.pubkey).pipe(
      defined(),
      map((m) => m?.inboxes),
    );
    return combineLatest([of(account), inboxes]);
  }),
  // Open a subscription to all relays for incoming messages
  switchMap(([account, inboxes]) =>
    pool
      .subscription(inboxes, { kinds: [kinds.EncryptedDirectMessage], "#p": [account.pubkey] })
      .pipe(onlyEvents(), mapEventsToStore(eventStore)),
  ),
  // Ingore all updates since subscribes will get the events from the store
  ignoreElements(),
  // Ensure only one subscription is created and keep it alive for 30 seconds after last subscriber
  share({ resetOnRefCountZero: () => timer(30_000) }),
);

// Observable to subscribe to NIP-65 inboxes for wrapped messages
export const wrappedMessageSubscription = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return NEVER;
    const inboxes = eventStore.model(DirectMessageRelays, account.pubkey).pipe(defined());
    return combineLatest([of(account), inboxes]);
  }),
  // Open a subscription to all relays for incoming messages
  switchMap(([account, inboxes]) =>
    pool
      .subscription(inboxes, { kinds: [kinds.GiftWrap], "#p": [account.pubkey] })
      .pipe(onlyEvents(), mapEventsToStore(eventStore)),
  ),
  // Ingore all updates since subscribes will get the events from the store
  ignoreElements(),
  // Ensure only one subscription is created and keep it alive for 30 seconds after last subscriber
  share({ resetOnRefCountZero: () => timer(30_000) }),
);
