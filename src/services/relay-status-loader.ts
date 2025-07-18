import { createTagValueLoader } from "applesauce-loaders/loaders";
import { MONITOR_STATS_KIND } from "../helpers/nostr/relay-stats";
import { cacheRequest } from "./event-cache";
import pool from "./pool";

export const MONITOR_PUBKEY = "151c17c9d234320cf0f189af7b761f63419fd6c38c6041587a008b7682e4640f";
export const MONITOR_RELAY = "wss://relay.nostr.watch/";

const monitorRelayStatusLoader = createTagValueLoader(pool, "d", {
  cacheRequest,
  kinds: [MONITOR_STATS_KIND],
  authors: [MONITOR_PUBKEY],
  since: 1704196800,
});

export default monitorRelayStatusLoader;
