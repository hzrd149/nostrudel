/**
 * Latest kind 1 post from each contact, fetched from the 3 fastest outbox relays (by RTT from a single monitor)
 * @tags nip-02, nip-65, nip-66, contacts, outbox, relay-discovery, rx-views
 * @related rx-views/mailbox-statuses, rx-views/friends-of-friends, relay-discovery/contacts-relays
 */
import { castUser, RelayDiscovery, RelayMonitor, User } from "applesauce-common/casts";
import { RELAY_MONITOR_ANNOUNCEMENT_KIND } from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { combineLatestByValue, defined, EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import type { NostrEvent } from "applesauce-core/helpers/event";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { kinds } from "nostr-tools";
import { useMemo, useState } from "react";
import {
  catchError,
  combineLatest,
  EMPTY,
  filter,
  ignoreElements,
  isObservable,
  map,
  mergeWith,
  MonoTypeOperatorFunction,
  Observable,
  of,
  startWith,
  switchMap,
  timeout,
} from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";
import RelayPicker from "../../components/relay-picker";

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

const DEFAULT_DISCOVERY_RELAY = "wss://relay.nostr.watch/";
const DEFAULT_DISCOVERY_MONITOR = "9ba046db56b8e6682c48af8d6425ffe80430a3cd0854d95381af27c5d27ca0f7";
const RELAY_STATUS_TIMEOUT_MS = 15_000;

function rttForDiscovery(d: RelayDiscovery | null | Error | undefined): number {
  if (!d || d instanceof Error) return Infinity;
  const rtt = d.rttRead ?? d.rttOpen;
  return rtt !== undefined ? rtt : Infinity;
}

// An operator to sort relays by RTT from a monitor
function sortRelaysByMonitor(
  monitor: undefined | RelayMonitor | Observable<RelayMonitor | undefined>,
): MonoTypeOperatorFunction<string[]> {
  const monitor$ = isObservable(monitor) ? monitor : of(monitor);

  return (source: Observable<string[]>) =>
    monitor$.pipe(
      // Then query monitor
      switchMap((monitor) => {
        // If no monitor set, return source as is
        if (!monitor) return source;

        // Query monitor for RTT of each relay
        return source.pipe(
          combineLatestByValue((url) =>
            monitor.relayStatus(url).pipe(
              // Map to RTT
              map(rttForDiscovery),
              // Set timeout for status request
              timeout(RELAY_STATUS_TIMEOUT_MS),
              // Catch error and return Infinity
              catchError(() => of(Infinity)),
            ),
          ),
          // Wait for at least three relays with RTT
          filter((map) => Array.from(map.values()).filter((rtt) => rtt !== Infinity).length >= 3),
          // Sort relays by RTT
          map((map) =>
            Array.from(map.entries())
              // Ignore relays with Infinite RTT
              .filter(([_, rtt]) => rtt !== Infinity)
              // Sort by fastest
              .sort((a, b) => a[1] - b[1])
              // Map list to relay url
              .map(([url]) => url),
          ),
        );
      }),
    );
}

/** Rx view: combineLatest at root (user, monitor, contacts), then one switchMap when any change */
function contactsFastestOutboxesView(
  user: User | Observable<User>,
  monitor: undefined | RelayMonitor | Observable<RelayMonitor | undefined>,
): Observable<null | Map<User, { last: NostrEvent | undefined; relays: string[] }>> {
  const user$ = isObservable(user) ? user : of(user);
  const monitor$ = isObservable(monitor) ? monitor : of(monitor);

  const contacts$ = user$.pipe(
    switchMap((u) => u.contacts$),
    defined(),
  );

  return contacts$.pipe(
    // For each contact, get the 3 outbox relays
    combineLatestByValue((contact) => {
      const onlineOutboxes$ = contact.outboxes$.pipe(
        // Wait for outboxes to load
        defined(),
        // Sort relays by RTT from monitor
        sortRelaysByMonitor(monitor$),
        // Take only the 3 fastest relays
        map((outboxes) => outboxes.slice(0, 3)),
      );

      // Request the latest note from each outbox relay
      const request$ = pool
        .request(onlineOutboxes$, {
          kinds: [kinds.ShortTextNote],
          authors: [contact.pubkey],
          limit: 2,
        })
        .pipe(
          mapEventsToStore(eventStore),
          catchError(() => EMPTY),
        );

      // Subscribe to all users events from event store
      const last = eventStore.timeline({ kinds: [kinds.ShortTextNote], authors: [contact.pubkey] }).pipe(
        // Merge with request so it starts
        mergeWith(request$.pipe(ignoreElements())),
        // Pick latest event from event store
        map((events) => events.slice(0, 1)?.[0] ?? undefined),
      );

      // Return the last event and the relays
      return combineLatest({ last, relays: onlineOutboxes$.pipe(startWith([])) });
    }),
  );
}

function timeAgo(ts: number): string {
  const seconds = Math.floor(Date.now() / 1000 - ts);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function MonitorOption({ monitor }: { monitor: RelayMonitor }) {
  const profile = use$(() => monitor.author.profile$, [monitor.author.pubkey]);
  const name = profile?.displayName ?? monitor.author.pubkey.slice(0, 8) + "…";
  return (
    <option key={monitor.uid} value={monitor.author.pubkey}>
      {name}
    </option>
  );
}

function ContactLatestRow({
  contact,
  note,
  relays,
}: {
  contact: User;
  note: NostrEvent | undefined;
  relays: string[];
}) {
  const profile = use$(() => contact.profile$, [contact.pubkey]);
  const name = profile?.displayName ?? contact.pubkey.slice(0, 8) + "…";
  const picture = profile?.picture ?? `https://robohash.org/${contact.pubkey}.png`;

  return (
    <div className="flex gap-3 p-3 border border-base-300 rounded-lg">
      <div className="avatar shrink-0">
        <div className="w-10 h-10 rounded-full border border-base-300">
          <img src={picture} alt={name} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{name}</span>
          {note && <span className="text-xs text-base-content/50 font-medium">{timeAgo(note.created_at)}</span>}
        </div>
        {relays.length > 0 && (
          <p className="text-xs text-base-content/40 mt-0.5 font-mono truncate" title={relays.join(", ")}>
            {relays.join(", ")}
          </p>
        )}
        {note ? (
          <div className="mt-2 p-2 rounded border border-base-300 bg-base-200/60">
            <p className="text-base text-base-content whitespace-pre-wrap wrap-break-word">{note.content}</p>
          </div>
        ) : (
          <p className="text-sm text-base-content/40 italic mt-1">Loading latest note…</p>
        )}
      </div>
    </div>
  );
}

export default function ContactsLatestPosts() {
  const [discoveryRelay, setDiscoveryRelay] = useState(DEFAULT_DISCOVERY_RELAY);
  const [selectedMonitorPubkey, setSelectedMonitorPubkey] = useState(DEFAULT_DISCOVERY_MONITOR);
  const [selectedPubkey, setSelectedPubkey] = useState("");

  const monitors = use$(
    () =>
      pool
        .relay(discoveryRelay)
        .subscription({ kinds: [RELAY_MONITOR_ANNOUNCEMENT_KIND] })
        .pipe(mapEventsToStore(eventStore), mapEventsToTimeline(), castTimelineStream(RelayMonitor, eventStore)),
    [discoveryRelay],
  );

  const monitor = useMemo(
    () =>
      monitors && selectedMonitorPubkey ? monitors.find((m) => m.author.pubkey === selectedMonitorPubkey) : undefined,
    [monitors, selectedMonitorPubkey],
  );

  const user = useMemo(() => (selectedPubkey ? castUser(selectedPubkey, eventStore) : undefined), [selectedPubkey]);

  const contactToLatestNote = use$(
    () => (user ? contactsFastestOutboxesView(user, monitor) : undefined),
    [user?.pubkey, monitor?.uid],
  );

  const entriesSortedByRecent =
    contactToLatestNote != null
      ? Array.from(contactToLatestNote.entries()).sort(([, a], [, b]) => {
          const ta = a.last?.created_at ?? 0;
          const tb = b.last?.created_at ?? 0;
          return tb - ta;
        })
      : [];

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div>
        <h2 className="text-lg font-bold">Contacts’ Latest Posts</h2>
        <p className="text-sm text-base-content/60">
          Load a user’s contacts, collect their NIP-65 outbox relays, pick the 3 fastest by RTT from a single monitor,
          then query those relays for kind 1 and show each contact’s latest note.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <RelayPicker value={discoveryRelay} onChange={setDiscoveryRelay} />
        {monitors && monitors.length > 0 && (
          <>
            <label className="text-xs font-medium text-base-content/60">Monitor (single, for RTT)</label>
            <select
              className="select select-bordered select-sm w-full"
              value={selectedMonitorPubkey}
              onChange={(e) => setSelectedMonitorPubkey(e.target.value)}
            >
              {monitors.map((m) => (
                <MonitorOption key={m.uid} monitor={m} />
              ))}
            </select>
          </>
        )}
        <PubkeyPicker value={selectedPubkey} onChange={setSelectedPubkey} />
      </div>

      {!selectedPubkey && (
        <p className="text-sm text-base-content/40">Enter a pubkey to load their contacts and latest posts.</p>
      )}

      {selectedPubkey && !monitor && (
        <p className="text-sm text-base-content/40">Select a relay monitor to rank outboxes by RTT.</p>
      )}

      {user && (
        <>
          {contactToLatestNote === undefined && (
            <div className="flex items-center gap-2 text-sm text-base-content/50">
              <span className="loading loading-spinner loading-xs" />
              Loading contacts and latest notes…
            </div>
          )}

          {contactToLatestNote !== undefined && entriesSortedByRecent.length === 0 && (
            <p className="text-sm text-base-content/40">No contacts found.</p>
          )}

          {contactToLatestNote != null && entriesSortedByRecent.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">
                Latest note per contact (newest first){" "}
                <span className="font-normal text-base-content/40">({entriesSortedByRecent.length})</span>
              </p>
              <div className="flex flex-col gap-2">
                {entriesSortedByRecent.map(([contact, { last, relays }]) => (
                  <ContactLatestRow key={contact.pubkey} contact={contact} note={last} relays={relays} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
