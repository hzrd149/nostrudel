/**
 * Explore and browse content by hashtags with filtering
 * @tags nip-91, hashtags, explore, filtering
 * @related feed/relay-timeline
 */
import { Link } from "applesauce-content/nast";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { Filter, isTTag } from "applesauce-core/helpers";
import { NostrEvent } from "applesauce-core/helpers/event";
import { ComponentMap, use$, useObservableEagerState, useRenderedContent } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useMemo, useState } from "react";
import { map, of } from "rxjs";

import { useThrottle } from "react-use";
import RelayPicker from "../../components/relay-picker";

// Create stores and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

/** Create a component for rendering media links */
function LinkRenderer({ node: link }: { node: Link }) {
  return (
    <a href={link.href} target="_blank" className="text-blue-500 hover:underline">
      {link.value}
    </a>
  );
}

// Base components for rendering content (without hashtag click handler)
const baseComponents: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  link: LinkRenderer,
  mention: ({ node }) => (
    <a href={`https://njump.me/${node.encoded}`} target="_blank" className="text-purple-500 hover:underline">
      @{node.encoded.slice(0, 8)}...
    </a>
  ),
  emoji: ({ node }) => (
    <span className="text-green-500">
      <img title={node.raw} src={node.url} className="w-6 h-6 inline" /> {node.raw}
    </span>
  ),
};

function EventCard({ event, onHashtagClick }: { event: NostrEvent; onHashtagClick: (hashtag: string) => void }) {
  // Create components with hashtag click handler
  const components = useMemo<ComponentMap>(
    () => ({
      ...baseComponents,
      hashtag: ({ node }) => (
        <button onClick={() => onHashtagClick(node.hashtag)} className="text-orange-500 hover:underline cursor-pointer">
          #{node.hashtag}
        </button>
      ),
    }),
    [onHashtagClick],
  );

  const content = useRenderedContent(event, components);

  // Get hashtags from event
  const hashtags = useMemo(() => event.tags.filter((t) => t[0] === "t" && t[1]).map((t) => t[1] as string), [event]);

  return (
    <div key={event.id} className="p-4 bg-base-200 rounded-lg overflow-hidden whitespace-pre-wrap">
      <div className="mb-2 text-sm text-base-content/70">Event: {event.id.substring(0, 8)}...</div>
      {content}
      {hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {hashtags.map((tag) => (
            <span key={tag} className="badge badge-sm badge-outline">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HashtagExploreExample() {
  const [relayUrl, setRelayUrl] = useState<string>("");
  const [hashtagInput, setHashtagInput] = useState<string>("");
  const [useLocalFiltering, setUseLocalFiltering] = useState<boolean>(true);

  // Get relay instance and check NIP-91 support
  const relay = useMemo(() => (relayUrl ? pool.relay(relayUrl) : null), [relayUrl]);
  const supportedNips = useObservableEagerState(relay?.supported$ ?? of(null));
  const supportsNip91 = supportedNips?.includes(91) ?? false;

  // Parse hashtags from input (split by space/comma and filter empty)
  const hashtagFilters = useMemo(() => {
    return hashtagInput
      .split(/[\s,]+/)
      .map((h) => h.trim().replace(/^#/, "").toLowerCase())
      .filter((h) => h.length > 0);
  }, [hashtagInput]);

  const hashtags = useThrottle(hashtagFilters, 1000);

  // Create filter for relay subscription (only used when not using local filtering)
  const relayFilter: Filter = useMemo(() => {
    const base: Filter = {
      kinds: [1],
      limit: 50,
    };

    if (supportsNip91) {
      if (hashtags.length > 0) base["&t"] = hashtags;
    } else if (hashtags.length > 0) {
      // fallback to OR filtering
      base["#t"] = hashtags;
    }

    return base;
  }, [hashtags]);

  // Create filter for local filtering (always uses AND logic)
  const localEvents = use$(() => {
    return eventStore.timeline({
      kinds: [1],
      ["&t"]: hashtags,
    });
  }, [hashtags]);

  // Subscribe to events from relay (always subscribe, but filter may vary)
  const relayEvents = use$(
    () =>
      relay
        ? relay.subscription(relayFilter).pipe(
            mapEventsToStore(eventStore),
            mapEventsToTimeline(),
            // Hack to make react update
            map((e) => [...e]),
          )
        : undefined,
    [relay, relayFilter],
  );

  // Get events from store - use local filtering if enabled, otherwise use relay-filtered results
  const events = useMemo(
    () => (useLocalFiltering ? localEvents : relayEvents)?.filter((e) => e.tags.some(isTTag)),
    [useLocalFiltering, localEvents, relayEvents],
  );

  // Handle hashtag click - add to input
  const handleHashtagClick = (hashtag: string) => {
    const normalized = hashtag.toLowerCase().trim();
    if (!hashtagInput.includes(normalized)) {
      // Append to existing input, preserving the original format
      setHashtagInput((prev) => (prev.trim() ? `${prev.trim()} ${normalized}` : normalized));
    }
  };

  return (
    <div className="container mx-auto p-2 h-full">
      <div className="flex gap-2 justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Hashtag Explorer</h1>
        <RelayPicker value={relayUrl} onChange={setRelayUrl} />
      </div>

      {/* Warning if relay doesn't support NIP-91 */}
      {relayUrl && !supportsNip91 && supportedNips !== null && (
        <div className="alert alert-warning mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>
            This relay does not support NIP-91 (AND tag filters). Multiple hashtag filtering may not work as expected.
          </span>
        </div>
      )}

      {/* Filtering mode toggle */}
      <div className="mb-4 flex items-center gap-4">
        <label className="label cursor-pointer">
          <span className="label-text mr-2">Use local AND filtering</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={useLocalFiltering}
            onChange={(e) => setUseLocalFiltering(e.target.checked)}
          />
        </label>
        {useLocalFiltering && (
          <span className="text-sm text-base-content/70">
            Local filtering uses AND logic for multiple hashtags, even if relay doesn't support NIP-91
          </span>
        )}
      </div>

      {/* Hashtag input */}
      <div className="mb-4">
        <label className="label">
          <span className="label-text">Filter by hashtags (space or comma separated)</span>
        </label>
        <input
          type="text"
          placeholder="#hashtag1 #hashtag2"
          className="input input-bordered w-full"
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
        />
        {hashtagFilters.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {hashtagFilters.map((tag) => (
              <span key={tag} className="badge badge-primary">
                #{tag}
                <button
                  className="ml-1 hover:font-bold"
                  onClick={() => {
                    const newFilters = hashtagFilters.filter((t) => t !== tag);
                    setHashtagInput(newFilters.join(" "));
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Events grid */}
      {relayUrl ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events && events.length > 0 ? (
            events.map((event) => <EventCard key={event.id} event={event} onHashtagClick={handleHashtagClick} />)
          ) : (
            <div className="col-span-2 text-center text-base-content/70 py-8">
              No events with hashtags found. Try selecting a different relay or adjusting your hashtag filters.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-base-content/70 py-8">Please select a relay to start exploring hashtags.</div>
      )}
    </div>
  );
}
