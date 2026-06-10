/**
 * Browse and interact with Nostr app handlers (NIP-89) to discover applications and their supported event kinds
 * @tags feed, handlers, nip-89, apps
 * @related feed/relay-timeline
 */
import {
  createHandlerLink,
  getHandlerDescription,
  getHandlerName,
  getHandlerPicture,
  getHandlerSupportedKinds,
} from "applesauce-common/helpers";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import clsx from "clsx";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo, useRef, useState } from "react";
import { map } from "rxjs";

import RelayPicker from "../../components/relay-picker";

// Create stores and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Event kind definitions with emojis and descriptions
const EVENT_KINDS = {
  0: { emoji: "👤", name: "Metadata", description: "User profile metadata" },
  1: { emoji: "📝", name: "Text Notes", description: "Short text notes" },
  3: { emoji: "👥", name: "Contacts", description: "Following/contact lists" },
  4: { emoji: "💬", name: "Encrypted DMs", description: "Direct messages" },
  5: { emoji: "🗑️", name: "Event Deletion", description: "Delete event requests" },
  6: { emoji: "🔄", name: "Reposts", description: "Repost/quote notes" },
  7: { emoji: "❤️", name: "Reactions", description: "Like/reaction to posts" },
  8: { emoji: "🏆", name: "Badge Award", description: "Badge awards to users" },
  16: { emoji: "🔄", name: "Generic Reposts", description: "Generic reposts" },
  1063: { emoji: "📁", name: "File Metadata", description: "File sharing and metadata" },
  1311: { emoji: "🎮", name: "Live Chat", description: "Live chat messages" },
  1984: { emoji: "🚫", name: "Reporting", description: "Content reporting" },
  1985: { emoji: "🔇", name: "Mute Lists", description: "User mute lists" },
  9041: { emoji: "⚡", name: "Zap Goals", description: "Crowdfunding goals" },
  9735: { emoji: "⚡", name: "Zaps", description: "Lightning payments/tips" },
  10002: { emoji: "📡", name: "Relay Lists", description: "User relay recommendations" },
  30000: { emoji: "👥", name: "Follow Lists", description: "Categorized people lists" },
  30001: { emoji: "🔖", name: "Bookmark Lists", description: "Generic lists" },
  30008: { emoji: "🏅", name: "Profile Badges", description: "Profile badge definitions" },
  30009: { emoji: "🏅", name: "Badge Definition", description: "Badge definitions" },
  30023: { emoji: "📰", name: "Articles", description: "Long-form articles" },
  30024: { emoji: "📝", name: "Drafts", description: "Draft articles" },
  30311: { emoji: "📺", name: "Live Events", description: "Live streaming events" },
  31923: { emoji: "🏷️", name: "Classified Listings", description: "Marketplace listings" },
  34235: { emoji: "🎵", name: "Music", description: "Music and audio content" },
  2: { emoji: "📡", name: "Recommend Relay", description: "Relay recommendations" },
  13: { emoji: "🔒", name: "Seal", description: "Encrypted messages seal" },
  14: { emoji: "🔐", name: "Private DMs", description: "Private direct messages" },
  40: { emoji: "📺", name: "Channel Creation", description: "Create chat channels" },
  41: { emoji: "⚙️", name: "Channel Metadata", description: "Channel settings/info" },
  42: { emoji: "💬", name: "Channel Message", description: "Messages in channels" },
  43: { emoji: "🙈", name: "Hide Message", description: "Hide channel messages" },
  44: { emoji: "🔇", name: "Mute User", description: "Mute users in channels" },
  1040: { emoji: "⏰", name: "Timestamps", description: "OpenTimestamps proofs" },
  1059: { emoji: "🎁", name: "Gift Wrap", description: "Wrapped encrypted messages" },
  1971: { emoji: "🐛", name: "Problem Tracker", description: "Issue/bug tracking" },
  4550: { emoji: "✅", name: "Post Approval", description: "Community post approvals" },
  5999: { emoji: "💼", name: "Job Request", description: "Job posting requests" },
  6999: { emoji: "📋", name: "Job Result", description: "Job completion results" },
  7000: { emoji: "⭐", name: "Job Feedback", description: "Job performance feedback" },
  9734: { emoji: "⚡", name: "Zap Request", description: "Lightning payment requests" },
  9802: { emoji: "🔆", name: "Highlights", description: "Content highlights" },
  10000: { emoji: "🔇", name: "Mute Lists", description: "User mute preferences" },
  10001: { emoji: "📌", name: "Pin Lists", description: "Pinned content lists" },
  10003: { emoji: "🔖", name: "Bookmarks", description: "Personal bookmarks" },
  10004: { emoji: "🏘️", name: "Communities", description: "Community memberships" },
  10005: { emoji: "💬", name: "Public Chats", description: "Public chat rooms" },
  10006: { emoji: "🚫", name: "Blocked Relays", description: "Blocked relay lists" },
  10007: { emoji: "🔍", name: "Search Relays", description: "Search relay preferences" },
  10015: { emoji: "🎯", name: "Interests", description: "Interest categories" },
  10030: { emoji: "😀", name: "Emojis", description: "Custom emoji sets" },
  10050: { emoji: "📨", name: "DM Relays", description: "Direct message relays" },
  10096: { emoji: "📁", name: "File Server", description: "File server preferences" },
  13194: { emoji: "💳", name: "Wallet Info", description: "NWC wallet information" },
  21000: { emoji: "⚡", name: "Lightning RPC", description: "Lightning network RPC" },
  22242: { emoji: "🔐", name: "Client Auth", description: "Client authentication" },
  23194: { emoji: "💳", name: "Wallet Request", description: "NWC wallet requests" },
  23195: { emoji: "💳", name: "Wallet Response", description: "NWC wallet responses" },
  24133: { emoji: "🔗", name: "Nostr Connect", description: "Remote signing protocol" },
  27235: { emoji: "🔒", name: "HTTP Auth", description: "HTTP authentication" },
  30002: { emoji: "📡", name: "Relay Sets", description: "Relay set collections" },
  30003: { emoji: "🔖", name: "Bookmark Sets", description: "Bookmark collections" },
  30004: { emoji: "📚", name: "Curation Sets", description: "Curated content sets" },
  30015: { emoji: "🎯", name: "Interest Sets", description: "Interest collections" },
  30017: { emoji: "🏪", name: "Market Stall", description: "Marketplace stall setup" },
  30018: { emoji: "🛍️", name: "Market Product", description: "Marketplace products" },
  30030: { emoji: "😀", name: "Emoji Sets", description: "Custom emoji collections" },
  30078: { emoji: "📱", name: "Application", description: "App recommendations" },
  30315: { emoji: "📊", name: "User Status", description: "User status updates" },
  30402: { emoji: "🏷️", name: "Classified Ad", description: "Classified advertisements" },
  30403: { emoji: "📝", name: "Draft Classified", description: "Draft classified ads" },
  31922: { emoji: "📅", name: "Date", description: "Calendar date events" },
  31924: { emoji: "📅", name: "Calendar", description: "Calendar definitions" },
  31925: { emoji: "✅", name: "RSVP", description: "Event RSVP responses" },
  31989: { emoji: "🔗", name: "Handler Recommendation", description: "App handler recommendations" },
  31990: { emoji: "ℹ️", name: "Handler Information", description: "App handler information" },
  34550: { emoji: "🏘️", name: "Community", description: "Community definitions" },
};

function HandlerCard({ handler }: { handler: NostrEvent }) {
  const modal = useRef<HTMLDialogElement>(null);
  const supportedKinds = getHandlerSupportedKinds(handler);

  // Create a dummy pointer for the link creation (we'll use the first supported kind)
  const dummyPointer = { kind: supportedKinds[0], pubkey: handler.pubkey, identifier: handler.id };
  const link = createHandlerLink(handler, dummyPointer);

  return (
    <div key={handler.id} className="card bg-base-100 shadow-md">
      <figure className="px-4 pt-4">
        <img
          src={getHandlerPicture(handler, `https://robohash.org/${handler.pubkey}.png`)}
          alt={getHandlerName(handler)}
          className="rounded-xl w-24 h-24 object-cover"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{getHandlerName(handler)}</h2>

        <p className="text-sm">{getHandlerDescription(handler)}</p>

        <div>
          <p className="text-sm font-bold">Supported Event Types:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {supportedKinds.map((kind) => {
              const kindInfo = EVENT_KINDS[kind as keyof typeof EVENT_KINDS];
              return (
                <span
                  key={kind}
                  className="badge badge-secondary badge-sm"
                  title={kindInfo ? `${kindInfo.emoji} ${kindInfo.name} - ${kindInfo.description}` : `Kind ${kind}`}
                >
                  {kindInfo ? `${kindInfo.emoji} ${kindInfo.name}` : `Kind ${kind}`}
                </span>
              );
            })}
          </div>
        </div>

        <div className="card-actions mt-2 items-center">
          {!link && <p className="text-sm text-red-500">Missing NIP-89 "web" link</p>}

          <div className="join ms-auto">
            <button className="btn btn-sm join-item" onClick={() => modal.current?.showModal()}>
              View Event
            </button>
            <a
              className={clsx("btn btn-primary btn-sm join-item", { "btn-disabled": !link })}
              href={link && new URL("/", link).toString()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open App
            </a>
          </div>
        </div>
      </div>

      {/* Modal for viewing raw event */}
      <dialog className="modal" ref={modal}>
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="font-bold text-lg mb-4">Raw Event Data</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(handler, null, 2)}</pre>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

export default function AppHandlersExample() {
  const [relay, setRelay] = useState<string>("wss://relay.damus.io/");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedKinds, setSelectedKinds] = useState<Set<number>>(new Set());

  // Fetch all application handlers
  const allHandlers = use$(
    () =>
      pool
        .subscription([relay], {
          kinds: [kinds.Handlerinformation],
        })
        .pipe(
          // Deduplicate events with the store
          mapEventsToStore(eventStore),
          // Map events into a timeline
          mapEventsToTimeline(),
          // Duplicate the timeline to force react to re-render
          map((t) => [...t]),
        ),
    [relay],
  );

  // Filter handlers based on search term and selected kinds
  const filteredHandlers = useMemo(() => {
    if (!allHandlers) return [];

    return allHandlers.filter((handler) => {
      // Ignore handlers without metadata
      if (handler.content.length === 0) return false;

      // Filter by search term
      if (searchTerm) {
        const name = getHandlerName(handler).toLowerCase();
        const description = getHandlerDescription(handler)?.toLowerCase() ?? "";
        const searchLower = searchTerm.toLowerCase();

        if (!name.includes(searchLower) && !description.includes(searchLower)) {
          return false;
        }
      }

      // Filter by selected kinds
      if (selectedKinds.size > 0) {
        const supportedKinds = getHandlerSupportedKinds(handler);
        const hasMatchingKind = supportedKinds.some((kind) => selectedKinds.has(kind));
        if (!hasMatchingKind) {
          return false;
        }
      }

      return true;
    });
  }, [allHandlers, searchTerm, selectedKinds]);

  // Get statistics about available kinds
  const availableKinds = useMemo(() => {
    if (!allHandlers) return new Map<number, number>();

    const kindCounts = new Map<number, number>();
    allHandlers.forEach((handler) => {
      getHandlerSupportedKinds(handler)
        // Ignore DVM kinds (5000-7000)
        .filter((kind) => kind < 5000 || kind > 7000)
        .forEach((kind) => {
          kindCounts.set(kind, (kindCounts.get(kind) || 0) + 1);
        });
    });

    return kindCounts;
  }, [allHandlers]);

  const handleKindToggle = (kind: number) => {
    const newSelected = new Set(selectedKinds);
    if (newSelected.has(kind)) {
      newSelected.delete(kind);
    } else {
      newSelected.add(kind);
    }
    setSelectedKinds(newSelected);
  };

  const isLoading = !allHandlers;

  return (
    <div className="container mx-auto my-8 p-4">
      <h1 className="text-3xl font-bold mb-2">📱 Nostr Apps</h1>
      <p className="text-gray-600 mb-6">
        Discover applications that can handle different types of Nostr events. Find the perfect app for your needs.
      </p>

      <div className="stats shadow mb-6">
        <div className="stat">
          <div className="stat-figure text-secondary">📱</div>
          <div className="stat-title">Total Apps</div>
          <div className="stat-value">{allHandlers?.length || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-secondary">⚡</div>
          <div className="stat-title">Event Types</div>
          <div className="stat-value">{availableKinds.size}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-secondary">🔍</div>
          <div className="stat-title">Filtered Results</div>
          <div className="stat-value">{filteredHandlers?.length || 0}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        {/* Search and Relay Picker */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            className="input input-bordered flex-1 min-w-xs"
            placeholder="🔍 Search apps by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <RelayPicker value={relay} onChange={setRelay} />
        </div>

        {/* Event Type Filters */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Filter by Event Type</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedKinds(new Set())}>
              All Types
            </button>
            {Array.from(availableKinds.entries())
              .sort(([a], [b]) => a - b)
              .map(([kind, count]) => {
                const kindInfo = EVENT_KINDS[kind as keyof typeof EVENT_KINDS];
                const isSelected = selectedKinds.has(kind);
                return (
                  <button
                    key={kind}
                    className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}`}
                    onClick={() => handleKindToggle(kind)}
                    title={kindInfo ? kindInfo.description : `Event kind ${kind}`}
                  >
                    {kindInfo ? `${kindInfo.emoji} ${kindInfo.name}` : `Kind ${kind}`} ({count})
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="loading loading-spinner loading-lg"></div>
          <span className="ml-2">Loading applications...</span>
        </div>
      )}

      {/* Results */}
      {!isLoading && (
        <>
          <h2 className="text-xl font-semibold mb-4">
            Apps for {selectedKinds.size > 0 ? "Selected Event Types" : "All Event Types"}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredHandlers.length} {filteredHandlers.length === 1 ? "app" : "apps"})
            </span>
          </h2>

          {filteredHandlers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHandlers.map((handler) => (
                <HandlerCard key={handler.id} handler={handler} />
              ))}
            </div>
          ) : (
            <div className="alert alert-info">
              <span>
                {searchTerm || selectedKinds.size > 0
                  ? "No apps found matching your filters. Try adjusting your search or selection."
                  : "No application handlers found on this relay."}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
