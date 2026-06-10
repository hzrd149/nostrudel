/**
 * Load timeline events with pagination support for efficient data loading
 * @tags loader, timeline, pagination
 * @related loader/timeline-scrolling, feed/relay-timeline
 */
import { EventStore } from "applesauce-core";
import { getSeenRelays, mergeRelaySets } from "applesauce-core/helpers";
import { createTimelineLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";

const eventStore = new EventStore();
const pool = new RelayPool();

import { nip19, NostrEvent } from "nostr-tools";
import { insertEventIntoDescendingList } from "nostr-tools/utils";
import { useCallback, useMemo, useState } from "react";

function EventRow({ event, relays }: { event: NostrEvent; relays: string[] }) {
  const seen = getSeenRelays(event);
  const truncatedId = event.id.slice(0, 4);

  const npub = useMemo(() => {
    try {
      return nip19.npubEncode(event.pubkey);
    } catch (e) {
      return event.pubkey;
    }
  }, [event.pubkey]);

  const truncatedNpub = npub.slice(0, 8);
  const truncatedContent = event.content.length > 50 ? `${event.content.slice(0, 50)}...` : event.content;

  return (
    <tr>
      <td>{truncatedId}</td>
      <td>{truncatedNpub}</td>
      <td className="truncate">{truncatedContent}</td>
      {relays.map((relay) => (
        <td key={relay} title={relay}>
          {seen?.has(relay) ? "✅" : "❌"}
        </td>
      ))}
    </tr>
  );
}

export default function PaginatedTimelineExample() {
  const [limit, setLimit] = useState(20);
  const [relays, _setRelays] = useState(mergeRelaySets(["wss://relay.damus.io", "wss://nos.lol", "wss://nostr.land"]));

  const loader = useMemo(() => {
    return createTimelineLoader(pool, relays, [{ kinds: [1] }], { limit, eventStore });
  }, [relays, limit]);

  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const next = useCallback(() => {
    setLoading(true);
    loader().subscribe({
      next: (evnet) => setEvents((prev) => Array.from(insertEventIntoDescendingList(prev, evnet))),
      complete: () => {
        setLoading(false);
      },
    });
  }, [loader]);

  return (
    <div className="container mx-auto my-8">
      <div className="flex gap-2">
        <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />

        <button className="btn" onClick={() => setEvents([])}>
          Clear
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Pubkey</th>
            <th>Content</th>
            {relays.map((r) => (
              <th key={r} />
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <EventRow key={event.id} event={event} relays={relays} />
          ))}
        </tbody>
      </table>

      <div className="flex justify-center my-4">
        {loading ? (
          <span className="loading loading-dots loading-xl"></span>
        ) : (
          <button className="btn btn-primary block" onClick={next}>
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
