import type { ProfilePointer } from "nostr-tools/nip19";
import { firstValueFrom } from "rxjs";
import { switchMap } from "rxjs/operators";
import { DEFAULT_PRIMAL_CACHE_URL } from "../../const";
import { shareAndHold } from "../../helpers/observable";
import localSettings from "../preferences";

// Observable that builds PrimalCache from preferences
const primal$ = localSettings.primalCacheUrl.pipe(
  switchMap(async (url) => {
    const { PrimalCache } = await import("applesauce-extra");
    return new PrimalCache(url || DEFAULT_PRIMAL_CACHE_URL);
  }),
  shareAndHold(),
);

/**
 * Lookup users using Primal cache
 */
export async function primalLookup(search: string, limit?: number): Promise<ProfilePointer[]> {
  const primal = await firstValueFrom(primal$);

  return (await primal.userSearch(search, limit)).map((e) => ({
    pubkey: e.pubkey,
    relays: [DEFAULT_PRIMAL_CACHE_URL],
  }));
}
