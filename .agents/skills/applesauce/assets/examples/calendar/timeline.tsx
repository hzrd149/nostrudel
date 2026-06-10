/**
 * Display a timeline of calendar events with filtering and details
 * @tags nip-52, calendar, timeline, events
 * @related calendar/create-event, calendar/map
 */
import {
  DATE_BASED_CALENDAR_EVENT_KIND,
  getCalendarEventEnd,
  getCalendarEventImage,
  getCalendarEventLocations,
  getCalendarEventParticipants,
  getCalendarEventStart,
  getCalendarEventSummary,
  getCalendarEventTitle,
  TIME_BASED_CALENDAR_EVENT_KIND,
} from "applesauce-common/helpers";
import { CalendarEventRSVPsModel } from "applesauce-common/models";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { getDisplayName, getProfilePicture, getSeenRelays, NostrEvent } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ProfilePointer } from "nostr-tools/nip19";
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
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Helper components
function Avatar({ user }: { user: ProfilePointer }) {
  const profile = use$(() => eventStore.profile(user), [user.pubkey]);
  const picture = getProfilePicture(profile, `https://robohash.org/${user.pubkey}`);

  return (
    <div className="avatar">
      <div className="w-8 h-8 rounded-full">
        {picture ? (
          <img src={picture} alt="Avatar" className="rounded-full" />
        ) : (
          <div className="bg-neutral text-neutral-content rounded-full flex items-center justify-center text-xs">
            {user.pubkey.slice(0, 2)}
          </div>
        )}
      </div>
    </div>
  );
}

function Username({ user }: { user: ProfilePointer }) {
  const profile = use$(() => eventStore.profile(user), [user.pubkey]);
  return <span>{getDisplayName(profile, "anon")}</span>;
}

function CalendarEventCard({ event, onSelect }: { event: NostrEvent; onSelect: (event: NostrEvent) => void }) {
  const title = getCalendarEventTitle(event);
  const summary = getCalendarEventSummary(event);
  const start = getCalendarEventStart(event);
  const end = getCalendarEventEnd(event);
  const image = getCalendarEventImage(event);
  const locations = getCalendarEventLocations(event);
  const participants = getCalendarEventParticipants(event);
  const relays = useMemo(() => Array.from(getSeenRelays(event) || []), [event]);

  // Load RSVPs count
  const rsvps = use$(() => eventStore.model(CalendarEventRSVPsModel, event), [event.id]);
  const rsvpCount = rsvps?.length || 0;

  const isUpcoming = start ? start > Date.now() / 1000 : false;
  const isPast = start ? start < Date.now() / 1000 : false;

  return (
    <div
      className={`card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${
        isUpcoming ? "border-l-success" : isPast ? "border-l-warning" : "border-l-base-300"
      }`}
      onClick={() => onSelect(event)}
    >
      <div className="card-body">
        {image && (
          <figure className="mb-2">
            <img src={image} alt="Event" className="rounded-lg max-h-48 object-cover w-full" />
          </figure>
        )}

        <div className="flex justify-between items-start mb-2">
          <h3 className="card-title text-lg">{title || "Untitled Event"}</h3>
          <div className="flex items-center gap-2">
            <Avatar user={{ pubkey: event.pubkey, relays }} />
            <Username user={{ pubkey: event.pubkey, relays }} />
          </div>
        </div>

        {summary && <p className="text-sm text-base-content/70 mb-3 line-clamp-2">{summary}</p>}

        <div className="space-y-2">
          {start && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{isUpcoming ? "Starts:" : isPast ? "Started:" : "Time:"}</span>
              <span>{new Date(start * 1000).toLocaleString()}</span>
            </div>
          )}

          {end && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Ends:</span>
              <span>{new Date(end * 1000).toLocaleString()}</span>
            </div>
          )}

          {locations.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Location:</span>
              <span className="truncate">{locations[0]}</span>
              {locations.length > 1 && <span className="text-xs">+{locations.length - 1} more</span>}
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              {participants.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">👥 {participants.length} participants</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {rsvpCount > 0 && <span className="badge badge-secondary">{rsvpCount} RSVPs</span>}
              <span className={`badge ${isUpcoming ? "badge-success" : isPast ? "badge-warning" : "badge-neutral"}`}>
                {isUpcoming ? "Upcoming" : isPast ? "Past" : "TBD"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarEventDetails({ event, onBack }: { event: NostrEvent; onBack: () => void }) {
  const title = getCalendarEventTitle(event);
  const start = getCalendarEventStart(event);
  const end = getCalendarEventEnd(event);
  const image = getCalendarEventImage(event);
  const locations = getCalendarEventLocations(event);
  const participants = getCalendarEventParticipants(event);
  const relays = useMemo(() => Array.from(getSeenRelays(event) || []), [event]);

  // Load RSVPs
  const rsvps = use$(() => eventStore.model(CalendarEventRSVPsModel, event), [event.id]);

  return (
    <div className="container mx-auto my-8 px-4 max-w-4xl">
      <div className="mb-6">
        <button onClick={onBack} className="btn btn-ghost btn-sm mb-4">
          ← Back to Timeline
        </button>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            {image && (
              <figure className="mb-6">
                <img src={image} alt="Event" className="rounded-lg max-h-64 object-cover w-full" />
              </figure>
            )}
            <h1 className="text-3xl font-bold">{title || "Untitled Event"}</h1>
            <div className="flex items-center gap-2">
              <Avatar user={{ pubkey: event.pubkey, relays }} />
              <span className="font-bold whitespace-pre">
                <Username user={{ pubkey: event.pubkey, relays }} />
              </span>
              <div className="text-sm text-base-content/70">Host</div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-base-content/80 whitespace-pre-line">{event.content}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Event Details</h3>
                <div className="space-y-3">
                  {start && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">🕐 Start:</span>
                      <span>{new Date(start * 1000).toLocaleString()}</span>
                    </div>
                  )}

                  {end && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">🏁 End:</span>
                      <span>{new Date(end * 1000).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="font-medium">📅 Type:</span>
                    <span>{event.kind === DATE_BASED_CALENDAR_EVENT_KIND ? "Date-based" : "Time-based"} Event</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Location</h3>
                {locations.length > 0 ? (
                  <div className="space-y-2">
                    {locations.map((location, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="font-medium">📍</span>
                        <span>{location}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-base-content/50">No location specified</p>
                )}
              </div>
            </div>

            {participants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Participants ({participants.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {participants.map((participant, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                      <Avatar user={{ pubkey: participant.pubkey, relays: participant.relays }} />
                      <div>
                        <div className="font-medium text-sm">
                          <Username user={{ pubkey: participant.pubkey, relays: participant.relays }} />
                        </div>
                        {participant.role && <div className="text-xs text-base-content/70">{participant.role}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rsvps && rsvps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">RSVPs ({rsvps.length})</h3>
                <div className="space-y-2">
                  {rsvps.map((rsvp) => (
                    <div key={rsvp.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                      <Avatar user={{ pubkey: rsvp.pubkey, relays: Array.from(getSeenRelays(rsvp) || []) }} />
                      <div className="flex-1">
                        <div className="font-medium">
                          <Username user={{ pubkey: rsvp.pubkey, relays: Array.from(getSeenRelays(rsvp) || []) }} />
                        </div>
                        <div className="text-sm text-base-content/70">
                          RSVP • {new Date(rsvp.created_at * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      {rsvp.content && (
                        <div className="text-sm bg-base-100 px-2 py-1 rounded max-w-xs">{rsvp.content}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarTimeline() {
  const [relay, setRelay] = useState("wss://relay.damus.io/");
  const [selectedEvent, setSelectedEvent] = useState<NostrEvent | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  // Create a timeline observable for calendar events
  const events = use$(
    () =>
      pool
        .relay(relay)
        .subscription({
          kinds: [DATE_BASED_CALENDAR_EVENT_KIND, TIME_BASED_CALENDAR_EVENT_KIND],
        })
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

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    const now = Date.now() / 1000;

    switch (filter) {
      case "upcoming":
        return events.filter((event) => {
          const start = getCalendarEventStart(event);
          return start && start > now;
        });
      case "past":
        return events.filter((event) => {
          const start = getCalendarEventStart(event);
          return start && start < now;
        });
      default:
        return events;
    }
  }, [events, filter]);

  if (selectedEvent) {
    return <CalendarEventDetails event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
  }

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">📅 Calendar Events Timeline</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <RelayPicker value={relay} onChange={setRelay} />

          <div className="flex gap-2">
            <button
              className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter("all")}
            >
              All Events
            </button>
            <button
              className={`btn btn-sm ${filter === "upcoming" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </button>
            <button
              className={`btn btn-sm ${filter === "past" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter("past")}
            >
              Past
            </button>
          </div>
        </div>

        {events && (
          <div className="stats shadow mb-4">
            <div className="stat">
              <div className="stat-title">Total Events</div>
              <div className="stat-value text-2xl">{events.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Showing</div>
              <div className="stat-value text-2xl">{filteredEvents.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Filter</div>
              <div className="stat-value text-2xl capitalize">{filter}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents?.map((event) => (
          <CalendarEventCard key={event.id} event={event} onSelect={setSelectedEvent} />
        ))}
      </div>

      {filteredEvents?.length === 0 && events && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">No {filter !== "all" ? filter : ""} events found</h3>
          <p className="text-base-content/70">
            {filter !== "all"
              ? `Try selecting a different filter or check back later for ${filter} events.`
              : "Try selecting a different relay or check back later for events."}
          </p>
        </div>
      )}
    </div>
  );
}
