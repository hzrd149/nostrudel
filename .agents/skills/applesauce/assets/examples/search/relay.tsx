/**
 * Search for users on a NIP-50 capable relay (default relay.ditto.pub)
 * @tags nip-50, search, relay
 * @related search/primal, search/vertex
 */
import { mapEventsToStore, mapEventsToTimeline, EventStore } from "applesauce-core";
import { getDisplayName, getProfilePicture, ProfileContent } from "applesauce-core/helpers";
import { ProfilePointer } from "applesauce-core/helpers/pointers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { kinds } from "nostr-tools";
import { npubEncode, nprofileEncode } from "nostr-tools/nip19";
import { useEffect, useMemo, useState } from "react";
import { lastValueFrom } from "rxjs";

import RelayPicker from "../../components/relay-picker";

const DEFAULT_SEARCH_RELAY = "wss://relay.ditto.pub";

// Create an event store for all events
const eventStore = new EventStore();

// Create a relay pool to make relay connections
const pool = new RelayPool();

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  // Fallback to lookup relays if profiles cant be found
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

/** Create a hook for loading a users profile */
function useProfile(user: ProfilePointer): ProfileContent | undefined {
  return use$(() => eventStore.profile(user), [user.pubkey, user.relays?.join("|")]);
}

function ProfileListItem({ user }: { user: ProfilePointer }) {
  const profile = useProfile(user);
  const npub = npubEncode(user.pubkey);
  const nprofile = nprofileEncode(user);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(npub);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy npub:", err);
    }
  };

  const displayName = getDisplayName(profile, user.pubkey.slice(0, 8));
  const about = profile?.about || `User profile for ${displayName}`;
  const pubkeyShort = user.pubkey.slice(0, 8).toUpperCase();

  return (
    <li className="list-row">
      <div>
        <img
          className="size-10 rounded-box"
          src={getProfilePicture(profile, `https://robohash.org/${user.pubkey}.png`)}
          alt={displayName}
        />
      </div>
      <div>
        <div>{displayName}</div>
        <div className="text-xs uppercase font-semibold opacity-60">{pubkeyShort}</div>
      </div>
      <p className="list-col-wrap text-xs">{about}</p>
      <button className="btn btn-square btn-ghost" onClick={handleCopy} title={copied ? "Copied!" : "Copy npub"}>
        {copied ? (
          <svg
            className="size-[1.2em]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg
            className="size-[1.2em]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>
      <a
        href={`https://njump.me/${nprofile}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-square btn-ghost"
        title="View profile"
      >
        <svg
          className="size-[1.2em]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" x2="21" y1="14" y2="3" />
        </svg>
      </a>
    </li>
  );
}

export default function RelaySearch() {
  const [relay, setRelay] = useState(DEFAULT_SEARCH_RELAY);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfilePointer[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Recommended relays that are known to support NIP-50 user search
  const recommendedRelays = useMemo(
    () => ["wss://relay.ditto.pub", "wss://nostrarchives.com/", "wss://search.nos.today", "wss://relay.noswhere.com"],
    [],
  );

  // Clear results when the relay changes
  useEffect(() => {
    setSearchResults([]);
    setSearchError(null);
  }, [relay]);

  const handleSearch = async () => {
    if (!query.trim() || !relay) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      // NIP-50: use the `search` filter on a kind 0 (profile) query.
      // `limit` caps the number of results; most relays enforce their own caps as well.
      const events = await lastValueFrom(
        pool
          .relay(relay)
          .request({ kinds: [kinds.Metadata], search: query.trim(), limit: 50 }, { timeout: 10_000 })
          .pipe(mapEventsToStore(eventStore), mapEventsToTimeline()),
      );

      // Convert the profile events into ProfilePointers for display
      const results: ProfilePointer[] = events.map((event) => ({
        pubkey: event.pubkey,
        relays: [relay],
      }));

      setSearchResults(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search";
      setSearchError(errorMessage);
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="card-title text-2xl mb-2">Relay User Search</h1>
      <p className="text-sm opacity-70 mb-4">
        Search for users on a NIP-50 capable relay. Results come from profile (kind 0) events matching the search term.
      </p>

      {/* Relay picker */}
      <div className="form-control w-full mb-2">
        <label className="label">
          <span className="label-text font-semibold">Search relay</span>
        </label>
        <RelayPicker value={relay} onChange={setRelay} common={recommendedRelays} supportedNips={["50"]} />
      </div>

      {/* Search input */}
      <div className="form-control w-full mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search for users..."
            className="input input-bordered flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="btn btn-primary" onClick={handleSearch} disabled={searching || !relay}>
            {searching ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>

      {/* Show search error */}
      {searchError && (
        <div className="alert alert-error mb-4">
          <span>{searchError}</span>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <>
          <div className="text-sm mb-2">
            <span>Search Results ({searchResults.length})</span>
          </div>
          <ul className="list bg-base-100 rounded-box">
            {searchResults.map((user) => (
              <ProfileListItem key={user.pubkey} user={user} />
            ))}
          </ul>
        </>
      )}

      {/* Show message when no results */}
      {query && !searching && searchResults.length === 0 && !searchError && (
        <div className="alert alert-info">
          <span>No results found. Try a different search query or relay.</span>
        </div>
      )}
    </div>
  );
}
