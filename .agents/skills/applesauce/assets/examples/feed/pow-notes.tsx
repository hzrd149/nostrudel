/**
 * Display notes with proof of work (mining difficulty) requirements
 * @tags nip-13, feed, pow, mining
 * @related feed/relay-timeline
 */
import { EventStore } from "applesauce-core";
import {
  getDisplayName,
  getOrComputeCachedValue,
  getProfilePicture,
  getSeenRelays,
  mergeRelaySets,
  ProfileContent,
} from "applesauce-core/helpers";
import { createEventLoaderForStore, createTimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { NostrEvent } from "applesauce-core/helpers";
import { ProfilePointer } from "nostr-tools/nip19";
import { useCallback, useEffect, useMemo, useState } from "react";

import RelayPicker from "../../components/relay-picker";

// Create an event store for all events
const eventStore = new EventStore();

// Create a relay pool to make relay connections
const pool = new RelayPool();

// Create an address loader to load user profiles
// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// NIP-13 Proof of Work calculation
const PoWDifficultySymbol = Symbol.for("pow-difficulty");

/**
 * Calculates the NIP-13 proof of work difficulty (number of leading zero bits) for a note ID
 * Based on the NIP-13 specification
 */
function countLeadingZeroes(hex: string): number {
  let count = 0;

  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i], 16);
    if (nibble === 0) {
      count += 4;
    } else {
      count += Math.clz32(nibble) - 28;
      break;
    }
  }

  return count;
}

/**
 * Gets the NIP-13 proof of work difficulty for a note
 */
function getPoWDifficulty(event: NostrEvent): number {
  return getOrComputeCachedValue(event, PoWDifficultySymbol, () => {
    return countLeadingZeroes(event.id);
  });
}

/**
 * Gets the target difficulty from a note's nonce tag
 */
function getTargetDifficulty(event: NostrEvent): number | undefined {
  const nonceTag = event.tags.find((tag) => tag[0] === "nonce");
  if (!nonceTag || nonceTag.length < 3) return undefined;
  const target = parseInt(nonceTag[2]);
  return isNaN(target) ? undefined : target;
}

/** Create a hook for loading a users profile */
function useProfile(user: ProfilePointer): ProfileContent | undefined {
  return use$(() => eventStore.profile(user), [user.pubkey, user.relays?.join("|")]);
}

function Note({ note }: { note: NostrEvent }) {
  const profile = useProfile(
    useMemo(() => ({ pubkey: note.pubkey, relays: mergeRelaySets(getSeenRelays(note)) }), [note]),
  );

  const powDifficulty = getPoWDifficulty(note);
  const targetDifficulty = getTargetDifficulty(note);

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex items-center gap-4 mb-2">
          <div className="avatar">
            <div className="w-12 rounded-full">
              <img src={getProfilePicture(profile, `https://robohash.org/${note.pubkey}.png`)} alt="Profile" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="card-title">{getDisplayName(profile)}</h2>
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <span className="badge badge-sm badge-outline">PoW: {powDifficulty} bits</span>
              {targetDifficulty && (
                <span className="badge badge-sm badge-secondary">Target: {targetDifficulty} bits</span>
              )}
            </div>
          </div>
        </div>
        <p className="whitespace-pre-wrap">{note.content}</p>
        <div className="text-xs text-base-content/50 mt-2">{new Date(note.created_at * 1000).toLocaleString()}</div>
      </div>
    </div>
  );
}

function PoWDistributionGraph({ notes, minDifficulty }: { notes: NostrEvent[]; minDifficulty: number }) {
  const distributionData = useMemo(() => {
    if (!notes || notes.length === 0) return [];

    // Calculate distribution of notes by PoW difficulty
    const maxDifficulty = Math.max(...notes.map(getPoWDifficulty), minDifficulty + 10);
    const data = [];

    for (let difficulty = 0; difficulty <= maxDifficulty; difficulty++) {
      const count = notes.filter((note) => getPoWDifficulty(note) === difficulty).length;
      data.push({ difficulty, count });
    }

    return data;
  }, [notes, minDifficulty]);

  const maxCount = Math.max(...distributionData.map((d) => d.count), 1);

  return (
    <div className="card bg-base-100 shadow-md mb-4">
      <div className="card-body">
        <h3 className="card-title text-lg">PoW Distribution</h3>
        <p className="text-sm text-base-content/60 mb-4">Number of notes with exactly X difficulty bits</p>

        <div className="h-40 flex items-end gap-1 overflow-x-auto">
          {distributionData.map(({ difficulty, count }) => (
            <div key={difficulty} className="flex flex-col items-center min-w-0 flex-shrink-0">
              <div className="text-xs text-center mb-1 text-base-content/60">{count}</div>
              <div
                className={`w-4 bg-primary transition-all duration-300 ${
                  difficulty === minDifficulty ? "bg-secondary" : ""
                }`}
                style={{
                  height: `${Math.max((count / maxCount) * 120, 2)}px`,
                }}
              />
              <div className="text-xs text-center mt-1 writing-mode-vertical-lr text-base-content/60">{difficulty}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-xs text-base-content/60 mt-2">
          <span>Difficulty (bits)</span>
          <span>Total notes: {notes?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}

export default function PoWNotes() {
  const [relay, setRelay] = useState("wss://relay.damus.io/");
  const [minDifficulty, setMinDifficulty] = useState(0);
  const [sortBy, setSortBy] = useState<"date" | "pow">("date");
  const [loading, setLoading] = useState(false);

  // Create a timeline loader
  const timelineLoader = useMemo(() => createTimelineLoader(pool, [relay], { kinds: [1] }, { eventStore }), [relay]);

  // Load initial events on mount
  useEffect(() => {
    timelineLoader().subscribe();
  }, [timelineLoader]);

  // Get all events from the event store
  const allEvents = use$(() => eventStore.timeline({ kinds: [1] }), []);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    if (!allEvents) return [];

    // Filter by minimum PoW difficulty
    const filtered = allEvents.filter((event) => getPoWDifficulty(event) >= minDifficulty);

    // Sort by selected criteria
    if (sortBy === "pow") {
      return filtered.sort((a, b) => getPoWDifficulty(b) - getPoWDifficulty(a));
    } else {
      return filtered.sort((a, b) => b.created_at - a.created_at);
    }
  }, [allEvents, minDifficulty, sortBy]);

  // Load more events handler
  const handleLoadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    timelineLoader().subscribe({
      complete: () => setLoading(false),
      error: () => setLoading(false),
    });
  }, [timelineLoader, loading]);

  return (
    <div className="container mx-auto my-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">⚡ Proof of Work Notes</h1>
        <p className="text-base-content/70 mb-4">
          View kind 1 notes filtered by NIP-13 proof of work difficulty. Higher difficulty means more computational work
          was done to create the note.
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <RelayPicker value={relay} onChange={setRelay} />
        <button className="btn btn-primary" onClick={handleLoadMore} disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Minimum PoW Difficulty</h3>
              <span className="text-lg font-mono">{minDifficulty} bits</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={minDifficulty}
              onChange={(e) => setMinDifficulty(parseInt(e.target.value))}
              className="range range-primary"
              step="1"
            />
            <div className="w-full flex justify-between text-xs px-2 text-base-content/60">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title mb-4">Sort Notes</h3>
            <select
              className="select select-bordered w-full"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "pow")}
            >
              <option value="date">Most Recent First</option>
              <option value="pow">Highest PoW First</option>
            </select>
            <div className="mt-2 text-sm text-base-content/60">
              Showing {filteredAndSortedEvents.length} of {allEvents?.length || 0} notes
            </div>
          </div>
        </div>
      </div>

      {allEvents && <PoWDistributionGraph notes={allEvents} minDifficulty={minDifficulty} />}

      <div className="flex flex-col gap-4">
        {filteredAndSortedEvents.length === 0 && allEvents && allEvents.length > 0 ? (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body text-center">
              <p className="text-lg">No notes found with difficulty ≥ {minDifficulty} bits</p>
              <p className="text-base-content/60">Try lowering the minimum difficulty</p>
            </div>
          </div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body text-center">
              <p className="text-lg">Loading notes...</p>
              <p className="text-base-content/60">Connecting to {relay}</p>
            </div>
          </div>
        ) : (
          filteredAndSortedEvents.map((event) => <Note key={event.id} note={event} />)
        )}
      </div>
    </div>
  );
}
