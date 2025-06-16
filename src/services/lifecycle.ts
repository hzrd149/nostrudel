import { IAccount } from "applesauce-accounts";
import { mergeRelaySets } from "applesauce-core/helpers";
import { defined } from "applesauce-core/observable";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { kinds, nip42 } from "nostr-tools";
import { combineLatest, distinct, distinctUntilChanged, map, merge, NEVER, switchMap, tap, throttleTime } from "rxjs";

import { DEFAULT_LOOKUP_RELAYS } from "../const";
import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND } from "../helpers/app-settings";
import { logger } from "../helpers/debug";
import accounts from "./accounts";
import authenticationSigner from "./authentication-signer";
import { cacheRelay$ } from "./cache-relay";
import { eventStore } from "./event-store";
import { addressLoader } from "./loaders";
import localSettings from "./local-settings";
import pool from "./pool";
import { saveSocialGraph, socialGraph } from "./social-graph";

const log = logger.extend("Lifecycle");

const requestReplaceable = (account: IAccount, relays: Iterable<string>, kind: number, d?: string) => {
  addressLoader({ relays: [...relays], kind, pubkey: account.pubkey, identifier: d, cache: false }).subscribe();
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
    switchMap(([account, relays]) => {
      if (relays.length === 0) return NEVER;

      log("Loading outboxes");
      requestReplaceable(account, mergeRelaySets(relays, DEFAULT_LOOKUP_RELAYS), kinds.RelayList);

      return eventStore.mailboxes(account.pubkey).pipe(
        defined(),
        // Once mailboxes are loaded, load user information
        switchMap((mailboxes) => {
          log("Loading user information");
          requestReplaceable(account, mailboxes?.outboxes || relays, kinds.Metadata);
          requestReplaceable(account, mailboxes?.outboxes || relays, kinds.Contacts);
          requestReplaceable(account, mailboxes?.outboxes || relays, USER_BLOSSOM_SERVER_LIST_KIND);
          requestReplaceable(account, mailboxes?.outboxes || relays, kinds.SearchRelaysList);
          requestReplaceable(account, mailboxes?.outboxes || relays, APP_SETTINGS_KIND, APP_SETTING_IDENTIFIER);

          // load latest delete events
          const deletes = pool.request(mailboxes.outboxes || relays, {
            kinds: [kinds.EventDeletion],
            authors: [account.pubkey],
          });

          log("Loading delete events");
          return merge(deletes);
        }),
      );
    }),
  )
  .subscribe((event) => {
    eventStore.add(event);
    if (cacheRelay$.value) cacheRelay$.value.publish(event);
  });

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

// Add all profile and contact and mute lists to social graph
eventStore
  .filters({ kinds: [kinds.Contacts, kinds.Mutelist] })
  .pipe(
    tap((event) => socialGraph.handleEvent(event)),
    // Update social graph and save
    throttleTime(5_000),
    tap(() => {
      socialGraph.recalculateFollowDistances();
      saveSocialGraph();
    }),
  )
  .subscribe();

// Set social graph root to active account
accounts.active$.subscribe((active) => {
  if (active) socialGraph.setRoot(active.pubkey);
});
