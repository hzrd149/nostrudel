import type { ProfilePointer } from "nostr-tools/nip19";
import { firstValueFrom } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { DEFAULT_RELATR_SERVER } from "../../const";
import { shareAndHold } from "../../helpers/observable";
import localSettings from "../preferences";

export const relatrServer$ = localSettings.relatrServer.pipe(
  map((server) => {
    if (!server) return null;

    // Use default if no server is configured
    const pubkey = server?.pubkey || DEFAULT_RELATR_SERVER.pubkey;

    const relays = server?.relays && server.relays.length > 0 ? server.relays : DEFAULT_RELATR_SERVER.relays;
    if (relays.length === 0) return null;

    return { pubkey, relays };
  }),
);

// Observable that builds RelatrClient from preferences
export const relatr$ = relatrServer$.pipe(
  switchMap(async (pointer) => {
    const { RelatrClient } = await import("../../classes/ctxcn/RelatrClient");
    const server = pointer ?? DEFAULT_RELATR_SERVER;
    return new RelatrClient({ serverPubkey: server.pubkey, relays: server.relays });
  }),
  shareAndHold(),
);

/** Lookup users using Relatr server */
export async function lookupRelatr(search: string, limit?: number): Promise<ProfilePointer[]> {
  const relatr = await firstValueFrom(relatr$);

  if (!relatr) throw new Error("Relatr not configured");

  const result = await relatr.SearchProfiles(search, limit);

  return result.results.map((r) => ({
    pubkey: r.pubkey,
  }));
}
