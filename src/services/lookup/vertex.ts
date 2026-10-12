import type { ProfilePointer } from "nostr-tools/nip19";
import { BehaviorSubject, combineLatest, firstValueFrom, of } from "rxjs";
import { switchMap } from "rxjs/operators";

import { shareAndHold } from "../../helpers/observable";
import accounts from "../accounts";
import localSettings from "../preferences";

// Observable that builds Vertex from preferences + active account
const vertex$ = combineLatest([localSettings.vertexRelayUrl, accounts.active$]).pipe(
  switchMap(async ([relay, account]) => {
    if (!account) return null;
    const { Vertex, VERTEX_RELAY } = await import("applesauce-extra");
    return new Vertex(account.signer, relay || VERTEX_RELAY);
  }),
  shareAndHold(),
);

const trigger$ = new BehaviorSubject(0);
export function triggerBalance() {
  trigger$.next(trigger$.value + 1);
}

export const vertextBalance$ = combineLatest([vertex$, trigger$]).pipe(
  switchMap(([vertex]) => (vertex ? vertex.getCreditBalance() : of(0))),
  shareAndHold(),
);

/**
 * Lookup users using Vertex
 */
export async function vertexLookup(search: string, limit?: number): Promise<ProfilePointer[]> {
  const vertex = await firstValueFrom(vertex$);
  if (!vertex) throw new Error("Vertex requires active account");

  // aislop-ignore-next-line ai-slop/unsafe-type-assertion -- the stored vertex sort method is a free string that can hold values outside applesauce-extra's SortMethod union (the settings menu offers userPagerank and followDistance); the Vertex custom API integration is slated for replacement by the Open-Ranking protocol API, so the value is passed through unchanged rather than validated
  const method = localSettings.vertexSortMethod.value as any;
  return vertex.userSearch(search, method || "globalPagerank", limit);
}
