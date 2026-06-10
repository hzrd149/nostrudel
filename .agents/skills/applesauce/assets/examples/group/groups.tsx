/**
 * Browse and manage Nostr groups with metadata and member information
 * @tags nip-29, nip-42, group, groups
 * @related group/communikeys, group/relay-chat
 */
import { encodeGroupPointer, getGroupPointerFromMetadata } from "applesauce-common/helpers";
import { mapEventsToTimeline } from "applesauce-core";
import { getTagValue, NostrEvent } from "applesauce-core/helpers";
import { use$, useObservableEagerMemo } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { useCallback, useState } from "react";
import { map } from "rxjs";
import RelayPicker from "../../components/relay-picker";

// NIP-29 Group Metadata Event kind
const GROUP_METADATA_KIND = 39000;

const pool = new RelayPool();

function GroupCard({ group, relay }: { group: NostrEvent; relay: string }) {
  const groupPointer = getGroupPointerFromMetadata(group, relay);
  if (!groupPointer) return null;

  const name = groupPointer.name || getTagValue(group, "name") || "Unnamed Group";
  const about = getTagValue(group, "about") || "No description available";
  const picture = getTagValue(group, "picture");

  // Get status tags
  const publicTag = group.tags.find((t) => t[0] === "public");
  const privateTag = group.tags.find((t) => t[0] === "private");
  const openTag = group.tags.find((t) => t[0] === "open");
  const closedTag = group.tags.find((t) => t[0] === "closed");

  const isPublic = !!publicTag;
  const isPrivate = !!privateTag;
  const isOpen = !!openTag;
  const isClosed = !!closedTag;

  const groupPointerString = encodeGroupPointer(groupPointer);

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary transition-colors">
      <div className="card-body p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="avatar shrink-0">
            <div className="w-16 h-16 rounded-lg bg-base-200 flex items-center justify-center">
              {picture ? <img src={picture} alt={name} className="object-cover w-full h-full" /> : <span>👥</span>}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="card-title truncate">{name}</h3>
              {isPrivate && <div className="badge badge-soft badge-warning">Private</div>}
              {isPublic && <div className="badge badge-soft badge-success">Public</div>}
              {isOpen && <div className="badge badge-soft badge-info">Open</div>}
              {isClosed && <div className="badge badge-soft badge-error">Closed</div>}
            </div>
          </div>
        </div>

        <p className="line-clamp-3 mb-4">{about}</p>

        <div className="flex flex-col gap-2">
          <div className="break-all bg-base-200 p-2 rounded select-all">{groupPointerString}</div>
        </div>
      </div>
    </div>
  );
}

function GroupsGrid({ groups, relay }: { groups: NostrEvent[]; relay: string }) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">👥</div>
        <h3 className="mb-2">No Groups Found</h3>
        <p className="text-base-content">
          No groups were found on this relay. Try selecting a different relay or check if the relay supports NIP-29.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <GroupCard key={`${group.pubkey}-${getTagValue(group, "d") || "_"}`} group={group} relay={relay} />
      ))}
    </div>
  );
}

export default function GroupsExample() {
  const [selectedRelay, setSelectedRelay] = useState("wss://pyramid.fiatjaf.com/");

  const groups = use$(() => {
    if (!selectedRelay) return undefined;

    return pool
      .relay(selectedRelay)
      .subscription({ kinds: [GROUP_METADATA_KIND] })
      .pipe(
        mapEventsToTimeline(),
        map((events) => [...events]),
      );
  }, [selectedRelay]);

  // Subscribe to authentication state for the selected relay
  const authRequiredForRead = useObservableEagerMemo(
    () => (selectedRelay ? pool.relay(selectedRelay).authRequiredForRead$ : undefined),
    [selectedRelay],
  );
  const authenticated = useObservableEagerMemo(
    () => (selectedRelay ? pool.relay(selectedRelay).authenticated$ : undefined),
    [selectedRelay],
  );

  // Handle authentication with extension signer
  const handleAuthenticate = useCallback(async () => {
    if (authenticated || !selectedRelay) return;

    try {
      const signer = new ExtensionSigner();

      // Authenticate with the relay
      await pool
        .relay(selectedRelay)
        .authenticate(signer)
        .then((response) => console.log("Authentication response:", response))
        .catch((error) => console.error("Authentication error:", error));
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  }, [selectedRelay, authenticated]);

  const handleRelayChange = useCallback((relay: string) => {
    setSelectedRelay(relay);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="mb-2">NIP-29 Groups Explorer</h1>
        <p className="text-base-content mb-6">
          Browse groups using the NIP-29 specification. Select a relay to discover groups hosted on it. Each group card
          displays the group pointer which can be selected and copied for use in other examples.
        </p>

        <div className="flex gap-2 items-center">
          <RelayPicker
            value={selectedRelay}
            onChange={handleRelayChange}
            className="w-full sm:w-96"
            supportedNips={["29"]}
          />
          {authenticated && (
            <div className="mb-4">
              <div className="badge badge-success">Authenticated</div>
            </div>
          )}
        </div>
      </div>

      {selectedRelay && (
        <>
          {authRequiredForRead && !authenticated && (
            <div className="mb-4">
              <div className="alert alert-warning">
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
                <div className="flex-1">
                  <h3 className="font-bold">Authentication Required</h3>
                  <div className="text-xs">This relay requires authentication to read groups.</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={handleAuthenticate}>
                  Authenticate
                </button>
              </div>
            </div>
          )}
          <div className="mb-4">
            Found {groups?.length || 0} group{groups?.length !== 1 ? "s" : ""} on {selectedRelay}
          </div>
          <GroupsGrid groups={groups || []} relay={selectedRelay} />
        </>
      )}

      {!selectedRelay && (
        <div className="text-center py-12">
          <div className="mb-4">🔗</div>
          <h3 className="mb-2">Select a Relay</h3>
          <p className="text-base-content">Choose a NIP-29 relay from the dropdown above to start browsing groups.</p>
        </div>
      )}
    </div>
  );
}
