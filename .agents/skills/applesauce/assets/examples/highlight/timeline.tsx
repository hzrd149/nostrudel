/**
 * Display a timeline of highlighted articles and content
 * @tags nip-84, highlight, timeline
 * @related highlight/article
 */
import {
  getHighlightAttributions,
  getHighlightComment,
  getHighlightContext,
  getHighlightSourceAddressPointer,
  getHighlightSourceEventPointer,
  getHighlightSourceUrl,
  getHighlightText,
  HighlightAttribution,
} from "applesauce-common/helpers";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import {
  getDisplayName,
  getProfilePicture,
  getSeenRelays,
  mergeRelaySets,
  ProfileContent,
} from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { kinds, NostrEvent } from "nostr-tools";
import { naddrEncode, neventEncode, nprofileEncode, ProfilePointer } from "nostr-tools/nip19";
import { useMemo, useState } from "react";
import { map } from "rxjs";

import RelayPicker from "../../components/relay-picker";

// Create an event store for all events
const eventStore = new EventStore();

// Create a relay pool to make relay connections
const pool = new RelayPool();

// Create an address loader to load user profiles
// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  // Fallback to lookup relays if profiles cant be found
  lookupRelays: ["wss://purplepag.es"],
});

/** Create a hook for loading a users profile */
function useProfile(user: ProfilePointer): ProfileContent | undefined {
  return use$(() => eventStore.profile(user), [user.pubkey, user.relays?.join("|")]);
}

function HighlightCard({ highlight }: { highlight: NostrEvent }) {
  // Subscribe to the request and wait for the profile event
  const profile = useProfile(
    useMemo(() => ({ pubkey: highlight.pubkey, relays: mergeRelaySets(getSeenRelays(highlight)) }), [highlight]),
  );

  const highlightText = getHighlightText(highlight);
  const context = getHighlightContext(highlight);
  const comment = getHighlightComment(highlight);
  const sourceEventPointer = getHighlightSourceEventPointer(highlight);
  const sourceAddressPointer = getHighlightSourceAddressPointer(highlight);
  const sourceUrl = getHighlightSourceUrl(highlight);
  const attribution = getHighlightAttributions(highlight);

  // Generate njump.me link for source
  const getSourceLink = () => {
    if (sourceEventPointer) {
      const nevent = neventEncode(sourceEventPointer);
      return `https://njump.me/${nevent}`;
    }
    if (sourceAddressPointer) {
      const naddr = naddrEncode(sourceAddressPointer);
      return `https://njump.me/${naddr}`;
    }
    if (sourceUrl) {
      return sourceUrl;
    }
    return null;
  };

  const sourceLink = getSourceLink();

  return (
    <div className="card shadow">
      <div className="card-body">
        {/* Author info */}
        <div className="flex items-center gap-4 mb-2">
          <div className="avatar">
            <div className="w-12 rounded-full">
              <img src={getProfilePicture(profile, `https://robohash.org/${highlight.pubkey}.png`)} alt="Profile" />
            </div>
          </div>
          <div>
            <h3 className="font-bold">{getDisplayName(profile)}</h3>
            <p className="text-sm opacity-60">{new Date(highlight.created_at * 1000).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Source link */}
        {sourceLink && (
          <div className="mb-2">
            <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="link link-primary break-all">
              {sourceUrl || "View on Nostr"}
            </a>
          </div>
        )}

        {/* Context with highlighted text */}
        {context && highlightText !== context ? (
          <div className="mb-2 text-lg leading-relaxed">
            {context.slice(0, context.indexOf(highlightText))}
            <mark>{highlightText}</mark>
            {context.slice(context.indexOf(highlightText) + highlightText.length)}
          </div>
        ) : (
          /* Main highlight content when no context */
          highlightText && (
            <blockquote className="text-lg font-medium italic border-l-4 border-warning pl-4 mb-2">
              "{highlightText}"
            </blockquote>
          )
        )}

        {/* Comment */}
        {comment && (
          <div className="mb-2">
            <p>{comment}</p>
          </div>
        )}

        {/* Attribution */}
        {attribution.length > 0 && <div className="divider"></div>}
        {attribution
          .filter((a: HighlightAttribution) => a.role === "author")
          .map((author: HighlightAttribution, i: number) => (
            <div key={`author-${i}`} className="flex items-center gap-2 mb-2">
              <span className="badge badge-primary badge-sm">author</span>
              <a
                href={`https://njump.me/${nprofileEncode(author)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary text-sm"
              >
                {author.pubkey.slice(0, 8)}...{author.pubkey.slice(-8)}
              </a>
            </div>
          ))}
        {attribution
          .filter((attr) => attr.role === "editor")
          .map((editor, i) => (
            <div key={`editor-${i}`} className="flex items-center gap-2 mb-2">
              <span className="badge badge-secondary badge-sm">editor</span>
              <a
                href={`https://njump.me/${nprofileEncode(editor)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary text-sm"
              >
                {editor.pubkey.slice(0, 8)}...{editor.pubkey.slice(-8)}
              </a>
            </div>
          ))}
        {attribution
          .filter((attr) => attr.role !== "author" && attr.role !== "editor")
          .map((other, i) => (
            <div key={`other-${i}`} className="flex items-center gap-2 mb-2">
              <span className="badge badge-sm">{other.role || "mention"}</span>
              <a
                href={`https://njump.me/${nprofileEncode(other)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary text-sm"
              >
                {other.pubkey.slice(0, 8)}...{other.pubkey.slice(-8)}
              </a>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function HighlightTimeline() {
  const [relay, setRelay] = useState("wss://relay.damus.io/");

  // Create a timeline observable for highlight events (kind 9802)
  const highlights = use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [kinds.Highlights] })
        .pipe(
          // deduplicate events using the event store
          mapEventsToStore(eventStore),
          // collect all events into a timeline
          mapEventsToTimeline(),
          // Duplicate the timeline array to make react happy
          map((t) => [...t]),
        ),
    [relay],
  );

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Highlight Timeline</h1>
        <p className="opacity-60">NIP-84 highlight events from Nostr relays</p>
      </div>

      <RelayPicker value={relay} onChange={setRelay} />

      <div className="flex flex-col gap-6 py-4">
        {highlights?.length === 0 ? (
          <div className="text-center py-8">
            <p className="opacity-60">No highlights found on this relay</p>
            <p className="text-sm opacity-40 mt-2">Try switching to a different relay</p>
          </div>
        ) : (
          highlights?.map((highlight) => <HighlightCard key={highlight.id} highlight={highlight} />)
        )}
      </div>
    </div>
  );
}
