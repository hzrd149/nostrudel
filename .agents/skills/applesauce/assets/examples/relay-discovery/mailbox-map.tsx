/**
 * Visualize mailbox relays on a map with geolocation data
 * @tags nip-65, nip-66, relay-discovery, mailbox, map
 * @related relay-discovery/monitors-map, relay-discovery/contacts-relays
 */
import { RelayMonitor } from "applesauce-common/casts";
import { RELAY_MONITOR_ANNOUNCEMENT_KIND } from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { persistEventsToCache } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { decode } from "ngeohash";
import { addEvents, openDB } from "nostr-idb";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { combineLatest, map } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";
import RelayPicker from "../../components/relay-picker";

import "leaflet/dist/leaflet.css";

// Create stores and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

const cache = await openDB();
persistEventsToCache(eventStore, (events) => addEvents(cache, events));

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

// Helper function to add a small random offset to prevent stacking
// Adds +/- 10 meters of random offset to separate stacked relays
function addRandomOffset(position: [number, number]): [number, number] {
  const [lat, lng] = position;

  // Convert meters to degrees
  // 1 degree of latitude ≈ 111,000 meters
  // 1 degree of longitude ≈ 111,000 meters * cos(latitude)
  const metersToLatDegrees = 1 / 111000;
  const metersToLngDegrees = 1 / (111000 * Math.cos((lat * Math.PI) / 180));

  // Random offset between -10m and +10m
  const offsetMeters = (Math.random() - 0.5) * 500;

  const latOffset = offsetMeters * metersToLatDegrees;
  const lngOffset = offsetMeters * metersToLngDegrees;

  return [lat + latOffset, lng + lngOffset];
}

interface RelayWithLocation {
  url: string;
  position: [number, number];
  type: "inbox" | "outbox";
}

function RelayPopup({ relay }: { relay: RelayWithLocation }) {
  return (
    <div className="max-w-sm">
      <h4 className="font-bold text-lg mb-2">{relay.type === "inbox" ? "Inbox" : "Outbox"} Relay</h4>
      <div className="text-xs text-gray-600 mb-1">
        <strong>Relay URL:</strong>
        <input
          type="text"
          readOnly
          value={relay.url}
          className="w-full mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 font-mono text-xs cursor-text"
          onFocus={(e) => e.target.select()}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
      </div>
      <div className="text-xs text-gray-600 mb-1">
        <strong>Location:</strong> {relay.position[0].toFixed(4)}, {relay.position[1].toFixed(4)}
      </div>
    </div>
  );
}

// Component to create a relay marker
function RelayMarker({ relay }: { relay: RelayWithLocation }) {
  const faviconUrl = use$(() => pool.relay(relay.url).icon$, [relay.url]);

  // Create custom icon with favicon and border color based on type
  const icon = useMemo(() => {
    const borderColor = relay.type === "inbox" ? "#10b981" : "#3b82f6"; // green for inbox, blue for outbox
    return L.divIcon({
      className: "relay-marker",
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid ${borderColor};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          overflow: hidden;
          background: white;
        ">
          <img
            src="${faviconUrl}"
            alt="Relay favicon"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 32 32\\'%3E%3Ccircle cx=\\'16\\' cy=\\'16\\' r=\\'14\\' fill=\\'${borderColor.replace("#", "%23")}\\'/%3E%3Ccircle cx=\\'16\\' cy=\\'16\\' r=\\'8\\' fill=\\'white\\'/%3E%3C/svg%3E'"
          />
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  }, [faviconUrl, relay.type]);

  return (
    <Marker position={relay.position} icon={icon}>
      <Popup>
        <RelayPopup relay={relay} />
      </Popup>
    </Marker>
  );
}

// Default discovery monitor pubkey
const DEFAULT_DISCOVERY_MONITOR = "9ba046db56b8e6682c48af8d6425ffe80430a3cd0854d95381af27c5d27ca0f7";
const DEFAULT_DISCOVERY_RELAY = "wss://relay.nostr.watch/";

function MonitorOption({ monitor }: { monitor: RelayMonitor }) {
  const profile = use$(monitor.author.profile$);

  return (
    <option key={monitor.id} value={monitor.author.pubkey}>
      {profile?.displayName ?? monitor.author.pubkey.slice(0, 8) + "..."}
    </option>
  );
}

function MonitorPicker({
  monitors,
  onChange,
  value,
}: {
  monitors: RelayMonitor[];
  onChange: (monitor: string) => void;
  value: string;
}) {
  return (
    <select className="select select-bordered" value={value} onChange={(e) => onChange(e.target.value)}>
      {monitors?.map((m) => (
        <MonitorOption key={m.uid} monitor={m} />
      ))}
    </select>
  );
}

export default function OutboxMap() {
  const [relay, setRelay] = useState<string>(DEFAULT_DISCOVERY_RELAY);
  const [selectedMonitor, setSelectedMonitor] = useState<string>(DEFAULT_DISCOVERY_MONITOR);
  const [selectedPubkey, setSelectedPubkey] = useState<string>("");

  // Get the monitor's announcement event
  const monitors = use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [RELAY_MONITOR_ANNOUNCEMENT_KIND] })
        .pipe(mapEventsToStore(eventStore), mapEventsToTimeline(), castTimelineStream(RelayMonitor)),
    [relay],
  );

  // Get the selected monitor
  const monitor = useMemo(
    () => (selectedMonitor ? monitors?.find((m) => m.author.pubkey === selectedMonitor) : undefined),
    [monitors, selectedMonitor],
  );

  // Get user's mailboxes
  const mailboxes = use$(
    () => (selectedPubkey ? eventStore.mailboxes({ pubkey: selectedPubkey }) : undefined),
    [selectedPubkey],
  );

  // Get relay discovery for each inbox relay using monitor.relayStatus()
  const inboxDiscoveries = use$(
    () =>
      monitor && mailboxes?.inboxes
        ? combineLatest(
            mailboxes.inboxes.map((url) =>
              monitor.relayStatus(url).pipe(
                map((discovery) => {
                  if (!discovery) return null;
                  return { discovery, type: "inbox" as const, url };
                }),
              ),
            ),
          )
        : undefined,
    [monitor?.uid, mailboxes?.inboxes.join(",")],
  );

  // Get relay discovery for each outbox relay using monitor.relayStatus()
  const outboxDiscoveries = use$(
    () =>
      monitor && mailboxes?.outboxes
        ? combineLatest(
            mailboxes.outboxes.map((url) =>
              monitor.relayStatus(url).pipe(
                map((discovery) => {
                  if (!discovery) return null;
                  return { discovery, type: "outbox" as const, url };
                }),
              ),
            ),
          )
        : undefined,
    [monitor?.uid, mailboxes?.outboxes.join(",")],
  );

  // Extract inbox and outbox relays
  const inboxRelays = useMemo(() => {
    return mailboxes?.inboxes || [];
  }, [mailboxes]);

  const outboxRelays = useMemo(() => {
    return mailboxes?.outboxes || [];
  }, [mailboxes]);

  // Extract locations from inbox discoveries
  const inboxRelaysWithLocation = useMemo(() => {
    if (!inboxDiscoveries) return [];

    const relaysWithLocation: RelayWithLocation[] = [];

    for (const result of inboxDiscoveries) {
      if (!result || !result.discovery) continue;

      const geohash = result.discovery.geohash;
      if (!geohash) continue;

      const decoded = decodeGeohash(geohash);
      if (decoded) {
        relaysWithLocation.push({
          url: result.url,
          position: addRandomOffset(decoded),
          type: "inbox",
        });
      }
    }

    return relaysWithLocation;
  }, [inboxDiscoveries]);

  // Extract locations from outbox discoveries
  const outboxRelaysWithLocation = useMemo(() => {
    if (!outboxDiscoveries) return [];

    const relaysWithLocation: RelayWithLocation[] = [];

    for (const result of outboxDiscoveries) {
      if (!result || !result.discovery) continue;

      const geohash = result.discovery.geohash;
      if (!geohash) continue;

      const decoded = decodeGeohash(geohash);
      if (decoded) {
        relaysWithLocation.push({
          url: result.url,
          position: addRandomOffset(decoded),
          type: "outbox",
        });
      }
    }

    return relaysWithLocation;
  }, [outboxDiscoveries]);

  // Combine all relays with location
  const relaysWithLocation = useMemo(() => {
    return [...inboxRelaysWithLocation, ...outboxRelaysWithLocation];
  }, [inboxRelaysWithLocation, outboxRelaysWithLocation]);

  // Calculate map center from relay positions (or use default)
  const mapCenter = useMemo(() => {
    if (relaysWithLocation.length === 0) {
      return [20, 0] as [number, number]; // Default global center
    }

    // Calculate average position
    let sumLat = 0;
    let sumLng = 0;
    let count = 0;

    for (const relay of relaysWithLocation) {
      sumLat += relay.position[0];
      sumLng += relay.position[1];
      count++;
    }

    if (count === 0) {
      return [20, 0] as [number, number];
    }

    return [sumLat / count, sumLng / count] as [number, number];
  }, [relaysWithLocation]);

  const totalRelays = (inboxRelays.length || 0) + (outboxRelays.length || 0);
  const hasRelays = totalRelays > 0;

  return (
    <div className="space-y-2 h-full overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-2">
        <h2 className="card-title">User Mailbox Relays Map</h2>
        <p className="text-sm text-base-content/70">
          Select a monitor, then a user to view their inbox and outbox relays (NIP-65) displayed on a map. Relays with
          geohash data from relay discovery events will appear as markers. Inbox relays have green borders, outbox
          relays have blue borders.
        </p>

        <div className="flex gap-2">
          <RelayPicker value={relay} onChange={setRelay} />
          {monitors && <MonitorPicker monitors={monitors} onChange={setSelectedMonitor} value={selectedMonitor} />}
        </div>

        <PubkeyPicker value={selectedPubkey} onChange={setSelectedPubkey} />

        {!monitor && <div className="text-sm text-base-content/70">Select a monitor to view relay discovery data</div>}

        {selectedPubkey && !mailboxes && <div className="text-sm text-base-content/70">Loading mailboxes...</div>}

        {selectedPubkey && mailboxes && !hasRelays && (
          <div className="alert alert-warning">
            <span>This user has no inbox or outbox relays configured (NIP-65).</span>
          </div>
        )}

        {selectedPubkey && mailboxes && hasRelays && (
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-white"></div>
              <span>
                Inboxes: {inboxRelays.length} ({inboxRelaysWithLocation.length} with location)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-white"></div>
              <span>
                Outboxes: {outboxRelays.length} ({outboxRelaysWithLocation.length} with location)
              </span>
            </div>
          </div>
        )}

        {selectedPubkey && monitor && mailboxes && hasRelays && relaysWithLocation.length === 0 && (
          <div className="alert alert-info">
            <span>
              No location data found for this user's relays. The selected monitor may not have geohash data for these
              relays.
            </span>
          </div>
        )}
      </div>

      <div className="flex-1">
        {selectedPubkey ? (
          /* @ts-ignore - React Leaflet v5 types may not be fully compatible */
          <MapContainer
            center={mapCenter}
            zoom={relaysWithLocation.length > 0 ? 3 : 2}
            style={{ height: "100%", width: "100%" }}
          >
            {/* @ts-ignore - React Leaflet v5 types may not be fully compatible */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {relaysWithLocation.map((relay) => (
              <RelayMarker key={relay.url} relay={relay} />
            ))}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50">
            <div className="text-center">
              <p className="text-lg mb-2">Select a monitor and user to view their mailbox relays</p>
              <p className="text-sm">Use the pickers above to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
