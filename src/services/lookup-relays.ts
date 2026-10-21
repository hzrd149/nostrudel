import { castUser } from "applesauce-common/casts";
import { firstValueFrom, map, of, shareReplay, switchMap } from "rxjs";

import { RECOMMENDED_LOOKUP_RELAYS } from "../const";
import accounts from "./accounts";
import { eventStore } from "./event-store";

/**
 * The resolved lookup relays for the active account.
 * Reads the kind 10086 lookup relay list published by the account and falls back to the
 * recommended lookup relays when the user has no published list (or is not signed in).
 */
export const lookupRelays$ = accounts.active$.pipe(
  switchMap((account) => (account ? castUser(account.pubkey, eventStore).lookupRelayList$ : of(undefined))),
  map((list) => (list && list.relays.length > 0 ? list.relays : RECOMMENDED_LOOKUP_RELAYS)),
  shareReplay(1),
);

/** Returns the current resolved lookup relays */
export function getLookupRelays(): Promise<string[]> {
  return firstValueFrom(lookupRelays$);
}
