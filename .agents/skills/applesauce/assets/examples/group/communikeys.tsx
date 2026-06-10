/**
 * Display and manage communikey groups with member lists
 * @tags group, communikeys
 * @related group/groups, group/threads
 */
import { EventStore } from "applesauce-core";
import { getDisplayName, getProfilePicture, getTagValue, isRTag, ProfileContent } from "applesauce-core/helpers";
import { createEventLoaderForStore, createTimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { NostrEvent } from "applesauce-core/helpers";
import { ProfilePointer } from "nostr-tools/nip19";
import { useCallback, useEffect, useMemo, useState } from "react";

import RelayPicker from "../../components/relay-picker";

// Community Creation Event kind as per NIP-CC
const COMMUNITY_CREATION_KIND = 10222;

const eventStore = new EventStore();
const pool = new RelayPool();

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/"],
});

/** Create a hook for loading a users profile */
function useProfile(user: ProfilePointer): ProfileContent | undefined {
  return use$(() => eventStore.profile(user), [user.pubkey, user.relays?.join("|")]);
}

function getCommunityContentTypes(event: NostrEvent) {
  const contentTypes: {
    name: string;
    kinds: number[];
    fee?: { amount: string; unit: string };
    exclusive?: boolean;
    roles?: string[];
  }[] = [];

  let currentContentType: any = null;

  for (const tag of event.tags) {
    if (tag[0] === "content") {
      // Start new content type
      if (currentContentType) {
        contentTypes.push(currentContentType);
      }
      currentContentType = {
        name: tag[1],
        kinds: [],
        exclusive: false,
        roles: [],
      };
    } else if (tag[0] === "k" && currentContentType) {
      // Add kind to current content type
      const kind = parseInt(tag[1]);
      if (!isNaN(kind)) {
        currentContentType.kinds.push(kind);
      }
    } else if (tag[0] === "fee" && currentContentType) {
      // Add fee to current content type
      currentContentType.fee = {
        amount: tag[1],
        unit: tag[2] || "sat",
      };
    } else if (tag[0] === "exclusive" && currentContentType) {
      // Set exclusive flag
      currentContentType.exclusive = tag[1] === "true";
    } else if (tag[0] === "role" && currentContentType) {
      // Add roles
      currentContentType.roles = tag.slice(1);
    }
  }

  // Add the last content type
  if (currentContentType) {
    contentTypes.push(currentContentType);
  }

  return contentTypes;
}

function CommunityCard({ community }: { community: NostrEvent }) {
  const profile = useProfile({ pubkey: community.pubkey });
  const displayName = getDisplayName(profile) || community.pubkey.slice(0, 16) + "...";
  const picture = getProfilePicture(profile, `https://robohash.org/${community.pubkey}`);
  const description = getTagValue(community, "description") || profile?.about || "No description available";
  const location = getTagValue(community, "location");
  const contentTypes = useMemo(() => getCommunityContentTypes(community), [community]);
  const relays = useMemo(() => community.tags.filter(isRTag).map((r) => r[1]), [community]);

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full">
              <img src={picture} alt={displayName} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="card-title text-lg font-semibold truncate">{displayName}</h3>
            <div className="text-sm opacity-60 truncate">{community.pubkey.slice(0, 16)}...</div>
          </div>
        </div>

        <p className="text-sm opacity-80 line-clamp-3 mb-3">{description}</p>

        {location && <div className="text-xs opacity-60 mb-2">📍 {location}</div>}

        <div className="space-y-2">
          <div className="text-sm font-medium">Content Types:</div>
          <div className="flex flex-wrap gap-1">
            {contentTypes.map((contentType, index) => (
              <div key={index} className="badge badge-outline badge-sm">
                {contentType.name}
                {contentType.fee && (
                  <span className="ml-1 text-xs">
                    ({contentType.fee.amount} {contentType.fee.unit})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {relays.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Relays:</div>
            <div className="flex flex-col gap-1">
              {relays.map((relay, index) => (
                <div key={index} className="text-xs opacity-60 truncate font-mono">
                  {relay}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunitiesGrid({ communities }: { communities: NostrEvent[] }) {
  if (communities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏘️</div>
        <h3 className="text-xl font-semibold mb-2">No Communities Found</h3>
        <p className="text-base-content/60">
          No communities were found on this relay. Try selecting a different relay.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {communities.map((community) => (
        <CommunityCard key={community.pubkey} community={community} />
      ))}
    </div>
  );
}

export default function CommunikeysExample() {
  const [selectedRelay, setSelectedRelay] = useState("wss://relay.damus.io/");

  const timeline = useMemo(
    () => createTimelineLoader(pool, [selectedRelay], { kinds: [COMMUNITY_CREATION_KIND] }, { eventStore }),
    [selectedRelay],
  );

  useEffect(() => {
    timeline().subscribe();
  }, [timeline]);

  // Load communities from the selected relay
  const communities = use$(() => eventStore.timeline({ kinds: [COMMUNITY_CREATION_KIND] }), [eventStore]);

  const handleRelayChange = useCallback((relay: string) => {
    setSelectedRelay(relay);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Communi-keys Browser</h1>
        <p className="text-base-content/60 mb-6">
          Browse communities using the NIP-CC Communi-keys specification. Select a relay to discover communities hosted
          on it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="form-control w-full sm:w-auto">
            <label className="label">
              <span className="label-text">Select Relay</span>
            </label>
            <RelayPicker value={selectedRelay} onChange={handleRelayChange} className="w-full sm:w-96" />
          </div>
        </div>
      </div>

      {selectedRelay && <CommunitiesGrid communities={communities || []} />}

      {!selectedRelay && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold mb-2">Select a Relay</h3>
          <p className="text-base-content/60">Choose a relay from the dropdown above to start browsing communities.</p>
        </div>
      )}
    </div>
  );
}
