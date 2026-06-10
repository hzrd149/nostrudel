/**
 * Discover and browse Cashu mint information and recommendations from the Nostr network
 * @tags wallet, mint, cashu, discovery
 * @related wallet/wallet
 */
import { castUser, User } from "applesauce-common/casts";
import { castTimelineStream } from "applesauce-common/observable";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { MintInfo, MintRecommendation } from "applesauce-wallet/casts";
import { CASHU_MINT_INFO_KIND, MINT_RECOMMENDATION_KIND } from "applesauce-wallet/helpers";
import { useMemo, useState } from "react";
import RelayPicker from "../../components/relay-picker";

// Make sure casts are registered
import "applesauce-wallet/casts";

// Create an event store for all events
const eventStore = new EventStore();

// Create a relay pool to make relay connections
const pool = new RelayPool();

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

/** A component for rendering user avatars */
function Avatar({ user, size = "w-12" }: { user: User; size?: string }) {
  const picture = use$(user.profile$.picture);

  return (
    <div className="avatar">
      <div className={`${size} rounded-full`}>
        <img src={picture || `https://robohash.org/${user.pubkey}.png`} alt={user.pubkey} />
      </div>
    </div>
  );
}

/** A component for rendering usernames */
function Username({ user }: { user: User }) {
  const displayName = use$(user.profile$.displayName);

  return <>{displayName || user.pubkey.slice(0, 8) + "..."}</>;
}

// Component to display a single mint info card in the list
function MintInfoCard({ mintInfo, onClick }: { mintInfo: MintInfo; onClick: () => void }) {
  const author = useMemo(() => castUser(mintInfo.event.pubkey, eventStore), [mintInfo.event.pubkey]);

  return (
    <div className="card bg-base-100 cursor-pointer" onClick={onClick}>
      <div className="card-body p-4">
        <div className="flex items-start gap-4">
          <Avatar user={author} />
          <div className="flex-1">
            <h2 className="card-title">{mintInfo.metadata?.name || mintInfo.metadata?.display_name || mintInfo.url}</h2>
            <p className="text-base-content/70 mb-2">
              <Username user={author} />
            </p>
            {mintInfo.url && (
              <a
                href={mintInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary link break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {mintInfo.url}
              </a>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {mintInfo.network && <span className="badge badge-outline">Network: {mintInfo.network}</span>}
              {mintInfo.nuts && mintInfo.nuts.length > 0 && (
                <span className="badge badge-outline">NUTs: {mintInfo.nuts.join(", ")}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to display a single recommendation
function RecommendationCard({ recommendation }: { recommendation: MintRecommendation }) {
  const author = useMemo(() => castUser(recommendation.event.pubkey, eventStore), [recommendation.event.pubkey]);

  return (
    <div className="card bg-base-200">
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <Avatar user={author} size="w-10" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">
                <Username user={author} />
              </span>
              <span className="text-base-content/60">{recommendation.createdAt.toLocaleString()}</span>
            </div>
            {recommendation.comment && <p className="whitespace-pre-wrap mb-2">{recommendation.comment}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to display mint details and recommendations
function MintDetailsView({ mintInfo, onBack }: { mintInfo: MintInfo; onBack: () => void }) {
  const author = useMemo(() => castUser(mintInfo.event.pubkey, eventStore), [mintInfo.event.pubkey]);

  // Fetch recommendations for the mint
  use$(() => {
    const relays = mintInfo.seen;
    if (!relays || relays.size === 0) return undefined;

    return pool
      .subscription(Array.from(relays), { kinds: [MINT_RECOMMENDATION_KIND], "#u": [mintInfo.url] })
      .pipe(mapEventsToStore(eventStore));
  }, [mintInfo.id]);

  // Get recommendations for this mint
  const recommendations = use$(() => mintInfo.recomendations$, [mintInfo.id]);

  return (
    <div className="container mx-auto my-8 px-4">
      <button className="btn btn-ghost mb-4" onClick={onBack}>
        ← Back to List
      </button>

      <div className="card bg-base-100">
        <div className="card-body p-4">
          <h1 className="card-title mb-4">
            {mintInfo.metadata?.name || mintInfo.metadata?.display_name || "Unnamed Mint"}
          </h1>

          <div className="divider"></div>

          <div className="space-y-4">
            <div>
              <h2 className="font-semibold mb-2">Mint Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Published by:</span> <Username user={author} />
                </div>
                {mintInfo.url && (
                  <div>
                    <span className="font-semibold">URL:</span>{" "}
                    <a
                      href={mintInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary link break-all"
                    >
                      {mintInfo.url}
                    </a>
                  </div>
                )}
                {mintInfo.mintPubkey && (
                  <div>
                    <span className="font-semibold">Mint Pubkey:</span>{" "}
                    <span className="font-mono">{mintInfo.mintPubkey}</span>
                  </div>
                )}
                {mintInfo.network && (
                  <div>
                    <span className="font-semibold">Network:</span> <span>{mintInfo.network}</span>
                  </div>
                )}
                {mintInfo.nuts && mintInfo.nuts.length > 0 && (
                  <div>
                    <span className="font-semibold">Supported NUTs:</span> <span>{mintInfo.nuts.join(", ")}</span>
                  </div>
                )}
                {mintInfo.metadata && Object.keys(mintInfo.metadata).length > 0 && (
                  <div>
                    <span className="font-semibold">Metadata:</span>
                    <pre className="mt-2 p-2 bg-base-200 rounded overflow-auto">
                      {JSON.stringify(mintInfo.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="divider"></div>

            <div>
              <h2 className="font-semibold mb-4">
                Recommendations ({Array.isArray(recommendations) ? recommendations.length : 0})
              </h2>
              {Array.isArray(recommendations) && recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec: MintRecommendation) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              ) : (
                <p className="text-base-content/60">No recommendations yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component
export default function MintDiscovery() {
  const [relay, setRelay] = useState("wss://relay.damus.io/");
  const [selectedMint, setSelectedMint] = useState<MintInfo | null>(null);

  // Subscribe to mint info events from the relay
  use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [CASHU_MINT_INFO_KIND] })
        .pipe(
          // deduplicate events using the event store
          mapEventsToStore(eventStore),
        ),
    [relay],
  );

  // Get mint info events from the store and cast them
  const mints = use$(
    () => eventStore.timeline({ kinds: [CASHU_MINT_INFO_KIND] }).pipe(castTimelineStream(MintInfo, eventStore)),
    [],
  );

  // If a mint is selected, show the details view
  if (selectedMint) return <MintDetailsView mintInfo={selectedMint} onBack={() => setSelectedMint(null)} />;

  // Otherwise show the list view
  return (
    <div className="container mx-auto my-8 px-4">
      <div className="mb-4">
        <h1 className="font-bold mb-2">Cashu Mint Discovery</h1>
        <p className="text-base-content/70 mb-4">
          Browse Cashu mint information events (kind:38172) published on Nostr relays.
        </p>
        <RelayPicker value={relay} onChange={setRelay} />
      </div>

      <div className="flex flex-col gap-2">
        {mints && mints.length > 0 ? (
          mints.map((mintInfo) => (
            <MintInfoCard key={mintInfo.id} mintInfo={mintInfo} onClick={() => setSelectedMint(mintInfo)} />
          ))
        ) : (
          <div className="text-center py-8 text-base-content/60">
            <p>No mint info events found. Try selecting a different relay.</p>
          </div>
        )}
      </div>
    </div>
  );
}
