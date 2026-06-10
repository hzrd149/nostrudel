/**
 * Display calendar events on an interactive map with geolocation
 * @tags nip-52, calendar, map, geolocation
 * @related calendar/timeline, calendar/create-event
 */
import { EventStore } from "applesauce-core";
import { unixNow } from "applesauce-core/helpers";
import {
  DATE_BASED_CALENDAR_EVENT_KIND,
  getCalendarEventEnd,
  getCalendarEventGeohash,
  getCalendarEventImage,
  getCalendarEventLocations,
  getCalendarEventStart,
  getCalendarEventSummary,
  getCalendarEventTitle,
  TIME_BASED_CALENDAR_EVENT_KIND,
} from "applesauce-common/helpers";
import { createEventLoaderForStore, createTimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { NostrEvent } from "applesauce-core/helpers";
import { decode } from "ngeohash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import RelayPicker from "../../components/relay-picker";

// Create an event store for all events
const eventStore = new EventStore();

// Create a relay pool to make relay connections
const pool = new RelayPool();

// Create an address loader to load user profiles
// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

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

interface CalendarEventWithLocation extends NostrEvent {
  position?: [number, number];
}

function CalendarEventPopup({ event }: { event: CalendarEventWithLocation }) {
  const title = getCalendarEventTitle(event) || "Untitled Event";
  const summary = getCalendarEventSummary(event);
  const start = getCalendarEventStart(event);
  const end = getCalendarEventEnd(event);
  const image = getCalendarEventImage(event);
  const locations = getCalendarEventLocations(event);

  const startDate = start ? new Date(start * 1000) : null;
  const endDate = end ? new Date(end * 1000) : null;

  return (
    <div className="max-w-sm">
      {image && <img src={image} alt="Event" className="w-full h-32 object-cover rounded-md mb-2" />}
      <h4 className="font-bold text-lg mb-2">{title}</h4>
      {summary && <p className="text-sm mb-2">{summary}</p>}
      {startDate && (
        <div className="text-xs text-gray-600 mb-1">
          <strong>Start:</strong> {startDate.toLocaleString()}
        </div>
      )}
      {endDate && (
        <div className="text-xs text-gray-600 mb-1">
          <strong>End:</strong> {endDate.toLocaleString()}
        </div>
      )}
      {locations.length > 0 && (
        <div className="text-xs text-gray-600 mb-1">
          <strong>Location:</strong> {locations.join(", ")}
        </div>
      )}
      <div className="text-xs text-gray-500 mt-2">Event ID: {event.id.slice(0, 8)}...</div>
    </div>
  );
}

export default function CalendarMap() {
  const [relay, setRelay] = useState<string>("wss://relay.damus.io/");
  const [showPastEvents, setShowPastEvents] = useState(false);

  const timeline = useMemo(
    () =>
      createTimelineLoader(
        pool,
        [relay],
        { kinds: [DATE_BASED_CALENDAR_EVENT_KIND, TIME_BASED_CALENDAR_EVENT_KIND] },
        {
          eventStore,
        },
      ),
    [pool, eventStore, relay],
  );

  const [loading, setLoading] = useState(false);
  const loadMore = useCallback(() => {
    setLoading(true);
    timeline().subscribe({
      error: () => setLoading(false),
      complete: () => setLoading(false),
    });
  }, [timeline]);

  // Load first page of events
  useEffect(() => {
    loadMore();
  }, [loadMore]);

  // Load calendar events from selected relay (following timeline.tsx pattern)
  const events = use$(
    () =>
      eventStore.timeline({
        kinds: [DATE_BASED_CALENDAR_EVENT_KIND, TIME_BASED_CALENDAR_EVENT_KIND],
      }),
    [relay],
  );

  const filteredEvents = useMemo(() => {
    if (!events) return;

    const now = unixNow();
    return events.filter((event) => {
      const start = getCalendarEventStart(event);
      return showPastEvents ? true : start ? start < now : false;
    });
  }, [events, showPastEvents]);

  // Filter events that have location data (separate from loading)
  const eventsWithLocation = useMemo(() => {
    if (!filteredEvents) return [];

    const eventsWithLocation: CalendarEventWithLocation[] = [];

    for (const event of filteredEvents) {
      const geohash = getCalendarEventGeohash(event);
      const locations = getCalendarEventLocations(event);

      let position: [number, number] | undefined;

      if (geohash) {
        const decoded = decodeGeohash(geohash);
        if (decoded) {
          position = decoded;
        }
      }

      // If we have a position or location text, include this event
      if (position || locations.length > 0) {
        eventsWithLocation.push({
          ...event,
          position,
        });
      }
    }

    return eventsWithLocation;
  }, [filteredEvents]);

  const handleRelayChange = (relay: string) => {
    setRelay(relay);
  };

  // Default map center (San Francisco)
  const defaultCenter: [number, number] = [37.7749, -122.4194];

  return (
    <div className="space-y-2 h-full overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-2">
        <h2 className="card-title">Calendar Events Map</h2>
        <p className="text-sm text-base-content/70">
          Select a relay to load calendar events from and see them displayed on the map. Events with geohash or location
          data will appear as markers.
        </p>

        <div className="flex gap-2 flex-wrap items-center">
          <RelayPicker value={relay} onChange={handleRelayChange} />
          <button className="btn btn-sm btn-primary" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </button>

          <label className="label">
            <input
              type="checkbox"
              checked={showPastEvents}
              onChange={() => setShowPastEvents(!showPastEvents)}
              className="toggle"
            />
            Show past events
          </label>

          {events && (
            <p className="text-sm text-base-content/70 ms-auto">
              {eventsWithLocation.length} events with location out of {events.length} total events
            </p>
          )}
        </div>
      </div>

      <div className="flex-1">
        {/* @ts-ignore - React Leaflet v5 types may not be fully compatible */}
        <MapContainer center={defaultCenter} zoom={10} style={{ height: "100%", width: "100%" }}>
          {/* @ts-ignore - React Leaflet v5 types may not be fully compatible */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {eventsWithLocation.map((event) => {
            if (!event.position) return null;
            return (
              <Marker key={event.id} position={event.position}>
                <Popup>
                  <CalendarEventPopup event={event} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
