import { LOOKUP_RELAY_LIST_KIND } from "applesauce-common/helpers";
import { firstValueFrom, map, of, shareReplay, switchMap } from "rxjs";

import { RECOMMENDED_LOOKUP_RELAYS } from "../const";
import { getRelaysFromList } from "../helpers/nostr/lists";
import accounts from "./accounts";
import { eventStore } from "./event-store";

/**
 * The resolved lookup relays for the active account.
 * Reads the NIP-51 kind 10086 lookup relay list published by the account and falls back to the
 * hard-coded recommended lookup relays when the user has no published list (or is not signed in).
 */
export const lookupRelays$ = accounts.active$.pipe(
  switchMap((account) =>
    account ? eventStore.replaceable({ kind: LOOKUP_RELAY_LIST_KIND, pubkey: account.pubkey }) : of(undefined),
  ),
  map((event) => {
    if (!event) return RECOMMENDED_LOOKUP_RELAYS;
    const relays = getRelaysFromList(event);
    return relays.length > 0 ? relays : RECOMMENDED_LOOKUP_RELAYS;
  }),
  shareReplay(1),
);

/** Returns the current resolved lookup relays */
export function getLookupRelays(): Promise<string[]> {
  return firstValueFrom(lookupRelays$);
}
