/**
 * Visualize relay monitors on a map with status and location data
 * @tags nip-66, relay-discovery, monitors, map
 * @related relay-discovery/monitor-feed, relay-discovery/mailbox-map
 */
import {
  getMonitorChecks,
  getMonitorFrequency,
  getMonitorGeohash,
  isValidRelayMonitorAnnouncement,
  RELAY_MONITOR_ANNOUNCEMENT_KIND,
} from "applesauce-common/helpers";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import {
  Filter,
  getDisplayName,
  getProfilePicture,
  getSeenRelays,
  mergeRelaySets,
  NostrEvent,
  ProfileContent,
} from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { decode } from "ngeohash";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { map } from "rxjs";

import "leaflet/dist/leaflet.css";
import RelayPicker from "../../components/relay-picker";

// Create stores and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Create an address loader to load user profiles
// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

/** Create a hook for loading a users profile */
function useProfile(user: ProfilePointer): ProfileContent | undefined {
  return use$(() => eventStore.profile(user), [user.pubkey, user.relays?.join("|")]);
}

// Fix Leaflet default marker icons
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Helper function to decode geohash to lat/lng
function decodeGeohash(geohashString: string): [number, number] | null {
  if (!geohashString) return null;

  try {
    const decoded = decode(geohashString);
    return [decoded.latitude, decoded.longitude];
  } catch {
    return null;
  }
}

interface MonitorEventWithLocation extends NostrEvent {
  position?: [number, number];
}

function MonitorPopup({ event }: { event: MonitorEventWithLocation }) {
  // Subscribe to the request and wait for the profile event
  const profile = useProfile(
    useMemo(() => ({ pubkey: event.pubkey, relays: mergeRelaySets(getSeenRelays(event)) }), [event]),
  );

  const frequency = getMonitorFrequency(event);
  const checks = getMonitorChecks(event);
  const createdDate = new Date(event.created_at * 1000);

  return (
    <div className="max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="avatar">
          <div className="w-10 rounded-full">
            <img src={getProfilePicture(profile, `https://robohash.org/${event.pubkey}.png`)} alt="Profile" />
          </div>
        </div>
        <h4 className="font-bold text-lg">{getDisplayName(profile)}</h4>
      </div>
      {event.content && <p className="text-sm mb-2">{event.content}</p>}
      {frequency && (
        <div className="text-xs text-gray-600 mb-1">
          <strong>Frequency:</strong> {frequency} seconds
        </div>
      )}
      {checks.length > 0 && (
        <div className="text-xs text-gray-600 mb-1">
          <strong>Checks:</strong> {checks.join(", ")}
        </div>
      )}
      <div className="text-xs text-gray-600 mb-1">
        <strong>Created:</strong> {createdDate.toLocaleString()}
      </div>
      <div className="text-xs text-gray-600 mb-1">
        <strong>Pubkey:</strong>
        <input
          type="text"
          readOnly
          value={event.pubkey}
          className="w-full mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 font-mono text-xs cursor-text"
          onFocus={(e) => e.target.select()}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
      </div>
    </div>
  );
}

// Component to create a custom avatar marker
function AvatarMarker({ event }: { event: MonitorEventWithLocation }) {
  const profile = useProfile(
    useMemo(() => ({ pubkey: event.pubkey, relays: mergeRelaySets(getSeenRelays(event)) }), [event]),
  );

  const avatarUrl = getProfilePicture(profile, `https://robohash.org/${event.pubkey}.png`);

  // Create custom icon with avatar
  const icon = useMemo(() => {
    return L.divIcon({
      className: "avatar-marker", // Remove default marker styling
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          overflow: hidden;
          background: white;
        ">
          <img
            src="${avatarUrl}"
            alt="Avatar"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
            onerror="this.src='https://robohash.org/${event.pubkey}.png'"
          />
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20], // Center the icon on the position
      popupAnchor: [0, -20], // Position popup above the marker
    });
  }, [avatarUrl, event.pubkey]);

  if (!event.position) return null;

  return (
    <Marker position={event.position} icon={icon}>
      <Popup>
        <MonitorPopup event={event} />
      </Popup>
    </Marker>
  );
}

export default function MonitorsMap() {
  const [relayUrl, setRelayUrl] = useState<string>("wss://relay.nostr.watch/");

  // Get relay instance
  const relay = useMemo(() => (relayUrl ? pool.relay(relayUrl) : null), [relayUrl]);

  // Create filter for monitor announcements
  const relayFilter: Filter = useMemo(
    () => ({
      kinds: [RELAY_MONITOR_ANNOUNCEMENT_KIND],
      limit: 1000, // Load many events to get comprehensive data
    }),
    [],
  );

  // Subscribe to events from relay
  const events = use$(
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

  // Filter events that have geohash data
  const monitorsWithLocation = useMemo(() => {
    if (!events || events.length === 0) return [];

    const monitorsWithLocation: MonitorEventWithLocation[] = [];

    for (const event of events) {
      if (!isValidRelayMonitorAnnouncement(event)) continue;

      const geohash = getMonitorGeohash(event);
      if (!geohash) continue;

      const decoded = decodeGeohash(geohash);
      if (decoded) {
        monitorsWithLocation.push({
          ...event,
          position: decoded,
        });
      }
    }

    return monitorsWithLocation;
  }, [events]);

  // Calculate map center from monitor positions (or use default)
  const mapCenter = useMemo(() => {
    if (monitorsWithLocation.length === 0) {
      return [20, 0] as [number, number]; // Default global center
    }

    // Calculate average position
    let sumLat = 0;
    let sumLng = 0;
    let count = 0;

    for (const monitor of monitorsWithLocation) {
      if (monitor.position) {
        sumLat += monitor.position[0];
        sumLng += monitor.position[1];
        count++;
      }
    }

    if (count === 0) {
      return [20, 0] as [number, number];
    }

    return [sumLat / count, sumLng / count] as [number, number];
  }, [monitorsWithLocation]);

  return (
    <div className="space-y-2 h-full overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-2">
        <h2 className="card-title">Relay Monitors Map</h2>
        <p className="text-sm text-base-content/70">
          Select a relay to load relay monitor announcements from and see them displayed on the map. Monitors with
          geohash data will appear as markers.
        </p>

        <div className="flex gap-2 flex-wrap items-center">
          <RelayPicker value={relayUrl} onChange={setRelayUrl} />

          {events && (
            <p className="text-sm text-base-content/70 ms-auto">
              {monitorsWithLocation.length} monitors with location out of {events.length} total monitors
            </p>
          )}
        </div>
      </div>

      <div className="flex-1">
        {/* @ts-ignore - React Leaflet v5 types may not be fully compatible */}
        <MapContainer center={mapCenter} zoom={2} style={{ height: "100%", width: "100%" }}>
          {/* @ts-ignore - React Leaflet v5 types may not be fully compatible */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {monitorsWithLocation.map((monitor) => (
            <AvatarMarker key={monitor.id} event={monitor} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
