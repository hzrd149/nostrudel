import { MONITOR_STATS_KIND } from "../helpers/nostr/relay-stats";
import { TagValueLoader } from "applesauce-loaders";
import rxNostr from "./rx-nostr";
import { eventStore } from "./event-store";

export const MONITOR_PUBKEY = "151c17c9d234320cf0f189af7b761f63419fd6c38c6041587a008b7682e4640f";
export const MONITOR_RELAY = "wss://relay.nostr.watch/";

const monitorRelayStatusLoader = new TagValueLoader(rxNostr, "d", {
  name: "relay-monitor",
  kinds: [MONITOR_STATS_KIND],
  authors: [MONITOR_PUBKEY],
  since: 1704196800,
});

// start the loader and send all events to the event store
monitorRelayStatusLoader.subscribe((packet) => {
  eventStore.add(packet.event, packet.from);
});

export default monitorRelayStatusLoader;
