import relayPool from "./relays/relay-pool";
import db from "./db";

relayPool.onRelayCreated.subscribe((relay) => {
  relay.onEvent.subscribe(async ({ body: event }) => {
    const seen = await db.get("events-seen", event.id);

    const now = new Date();
    if (seen) {
      seen.lastSeen = now;
      if (!seen.relays.includes(relay.url)) {
        seen.relays = seen.relays.concat(relay.url);
      }
      await db.put("events-seen", seen);
    } else {
      await db.put("events-seen", {
        id: event.id,
        relays: [relay.url],
        lastSeen: now,
      });
    }
  });
});

export async function getRelaysEventWasSeen(id: string) {
  return await db.get("events-seen", id);
}
