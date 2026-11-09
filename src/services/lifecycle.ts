import { IAccount } from "applesauce-accounts";
import { LOOKUP_RELAY_LIST_KIND } from "applesauce-common/helpers";
import { isFromCache, relaySet } from "applesauce-core/helpers";
import { defined } from "applesauce-core/observable";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { kinds, nip42 } from "nostr-tools";
import {
  combineLatest,
  catchError,
  EMPTY,
  distinct,
  distinctUntilChanged,
  filter,
  merge,
  NEVER,
  of,
  switchMap,
  tap,
} from "rxjs";

import ignoreRelayErrors from "../helpers/ignore-relay-errors";
import { logger } from "../helpers/debug";
import { RECOMMENDED_LOOKUP_RELAYS } from "../const";
import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND } from "../helpers/app-settings";
import accounts from "./accounts";
import authenticationSigner from "./authentication-signer";
import { writeEvent } from "./event-cache";
import { eventStore } from "./event-store";
import { replaceableLoader } from "./loaders";
import pool from "./pool";
import localSettings from "./preferences";

// watch for new events and send them to the cache relay
eventStore.insert$.pipe(filter((event) => !isFromCache(event))).subscribe(writeEvent);

const addressable = (account: IAccount, relays: Iterable<string>, kind: number, d?: string) => {
  return replaceableLoader({ relays: [...relays], kind, pubkey: account.pubkey, identifier: d, cache: false });
};

// listen for account changes and load users events
combineLatest([
  accounts.active$.pipe(
    defined(),
    distinct((a) => a?.pubkey),
  ),
  localSettings.fallbackRelays,
])
  .pipe(
    switchMap(([account, relays]) =>
      combineLatest([of(account), eventStore.mailboxes({ pubkey: account.pubkey, relays })] as const),
    ),
    switchMap(([account, mailboxes]) => {
      if (!mailboxes?.outboxes) return NEVER;

      const info = merge(
        // Load user information
        addressable(account, mailboxes?.outboxes, kinds.Metadata),
        addressable(account, mailboxes?.outboxes, kinds.Contacts),
        addressable(account, mailboxes?.outboxes, USER_BLOSSOM_SERVER_LIST_KIND),
        addressable(account, mailboxes?.outboxes, kinds.SearchRelaysList),
        addressable(account, relaySet(mailboxes.outboxes, RECOMMENDED_LOOKUP_RELAYS), LOOKUP_RELAY_LIST_KIND),
        addressable(account, mailboxes?.outboxes, APP_SETTINGS_KIND, APP_SETTING_IDENTIFIER),
      );

      // load latest delete events
      const deletes = pool.request(mailboxes.outboxes, {
        kinds: [kinds.EventDeletion],
        authors: [account.pubkey],
      });

      return merge(info, deletes.pipe(ignoreRelayErrors("Account deletions")));
    }),
  )
  .subscribe();

// Attempt to authenticate with all relays
pool.relays$
  .pipe(
    switchMap((relays) =>
      merge(
        ...Array.from(relays.values()).map((relay) =>
          combineLatest([relay.challenge$, accounts.active$]).pipe(
            distinctUntilChanged(
              ([challenge, account], [nextChallenge, nextAccount]) =>
                challenge === nextChallenge && account?.pubkey === nextAccount?.pubkey,
            ),
            switchMap(([challenge, account]) => {
              if (!challenge || !account || relay.isAuthenticated(account.pubkey)) return EMPTY;
              return of(nip42.makeAuthEvent(relay.url, challenge)).pipe(
                switchMap((draft) => authenticationSigner.signEvent(draft)),
                switchMap((event) => relay.auth(event)),
                catchError((error) => {
                  logger.extend("RelayAuthentication")("Authentication failed", relay.url, error);
                  return EMPTY;
                }),
              );
            }),
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
