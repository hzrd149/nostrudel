/**
 * Check which metadata events are present on a user's outbox relays
 * @tags nip-65, outbox, metadata, distribution, rx-views
 */
import { castUser, User } from "applesauce-common/casts";
import { catchErrorInline, combineLatestByValue, defined, EventStore, mapEventsToTimeline } from "applesauce-core";
import { NostrEvent } from "applesauce-core/helpers/event";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { Relay, RelayPool } from "applesauce-relay";
import { kinds } from "nostr-tools";
import { useMemo, useState } from "react";
import { isObservable, map, Observable, of, switchMap, takeUntil, timer } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";

const METADATA_KINDS: Record<string, number> = {
  Profile: kinds.Metadata,
  Contacts: kinds.Contacts,
  Relays: kinds.RelayList,
  Bookmarks: kinds.BookmarkList,
  Pins: kinds.Pinlist,
  Mutes: kinds.Mutelist,
  "Search Relays": kinds.SearchRelaysList,
  "Blocked Relays": kinds.BlockedRelaysList,
  Blossom: kinds.BlossomServerList,
  "DM Relays": kinds.DirectMessageRelaysList,
};

const KIND_LABELS = Object.keys(METADATA_KINDS);

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// ─── Rx View ───────────────────────────────────────────────────────────────────

/** A RxJS view that checks what metadata events are on the users outbox relays */
function MetadataDistributionView(user: User | Observable<User>): Observable<Map<Relay, NostrEvent[] | Error>> {
  const user$ = isObservable(user) ? user : of(user);

  return user$.pipe(
    switchMap((user) =>
      user.outboxes$.pipe(
        // Wait till the outboxes load
        defined(),
        // Get relay instances
        map((outboxes) => outboxes.map((url) => pool.relay(url))),
        // For each outbox get the metadata events
        combineLatestByValue((relay) =>
          // Get the metadata events from the relay
          relay
            .request({
              kinds: Object.values(METADATA_KINDS),
              authors: [user.pubkey],
            })
            .pipe(
              mapEventsToTimeline(), // Convert the events stream to a timeline
              takeUntil(timer(10_000)), // Cancel the request after 10 seconds
              catchErrorInline(), // Catch relay errors
            ),
        ),
      ),
    ),
  );
}

// ─── Components ────────────────────────────────────────────────────────────────

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

function KindBadge({ label, event }: { label: string; event: NostrEvent | undefined; loading: boolean }) {
  if (event) {
    const date = new Date(event.created_at * 1000).toLocaleDateString();
    const age = timeAgo(event.created_at);
    return (
      <div
        className="flex flex-col items-center gap-0.5 px-2 py-1 rounded border border-success/30 bg-success/10"
        title={`kind ${event.kind} — ${date}`}
      >
        <span className="text-success text-xs font-medium leading-none">{label}</span>
        <span className="text-success/60 text-[10px] leading-none">{age}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center px-2 py-1 rounded border border-base-300 bg-base-200/40 opacity-40">
      <span className="text-xs leading-none">{label}</span>
    </div>
  );
}

function RelayRow({
  relay,
  events,
  visibleLabels,
}: {
  relay: Relay;
  events: NostrEvent[] | Error | undefined;
  visibleLabels: string[];
}) {
  const icon = use$(() => relay.icon$, [relay.url]);

  const kindByNumber = useMemo(() => {
    if (!events || events instanceof Error) return new Map<number, NostrEvent>();
    const map = new Map<number, NostrEvent>();
    for (const event of events) map.set(event.kind, event);
    return map;
  }, [events]);

  const isLoading = events === undefined;
  const isError = events instanceof Error;
  const presentCount =
    isError || isLoading ? 0 : visibleLabels.filter((l) => kindByNumber.has(METADATA_KINDS[l])).length;

  return (
    <div className="border border-base-300 rounded-lg overflow-hidden">
      {/* Relay header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-base-200/50 border-b border-base-300">
        <div className="w-5 h-5 shrink-0 rounded-full border border-base-300 overflow-hidden bg-base-300">
          {icon && <img src={icon} alt="" className="w-full h-full object-cover" />}
        </div>
        <span className="font-mono text-xs font-semibold flex-1 truncate">{relay.url}</span>
        {isLoading && <span className="loading loading-spinner loading-xs opacity-40" />}
        {isError && <span className="badge badge-error badge-sm">Error</span>}
        {!isLoading && !isError && (
          <span className="text-xs text-base-content/40">
            {presentCount}/{KIND_LABELS.length}
          </span>
        )}
      </div>

      {/* Kind grid */}
      <div className="p-3">
        {isError ? (
          <p className="text-xs text-error/70">{(events as Error).message}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleLabels.map((label) => (
              <KindBadge
                key={label}
                label={label}
                event={kindByNumber.get(METADATA_KINDS[label])}
                loading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserHeader({ user }: { user: User }) {
  const profile = use$(() => user.profile$, [user.pubkey]);
  const name = profile?.displayName ?? user.pubkey.slice(0, 8) + "…";
  const picture = profile?.picture ?? `https://robohash.org/${user.pubkey}.png`;

  return (
    <div className="flex items-center gap-3 p-3 border border-base-300 rounded-lg">
      <div className="avatar">
        <div className="w-12 h-12 rounded-full border border-base-300">
          <img src={picture} alt={name} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="font-semibold">{name}</div>
        <div className="text-xs text-base-content/50 font-mono truncate">{user.pubkey}</div>
      </div>
    </div>
  );
}

// ─── Main Example ──────────────────────────────────────────────────────────────

export default function MetadataDistribution() {
  const [selectedPubkey, setSelectedPubkey] = useState("");

  const user = useMemo(() => (selectedPubkey ? castUser(selectedPubkey, eventStore) : undefined), [selectedPubkey]);

  const distribution = use$(() => (user ? MetadataDistributionView(user) : undefined), [user?.pubkey]);

  const relayEntries = distribution ? [...distribution.entries()] : null;

  // Only show kinds that appear on at least one relay
  const visibleLabels = useMemo(() => {
    if (!relayEntries) return KIND_LABELS;
    const present = new Set<string>();
    for (const [, events] of relayEntries) {
      if (!events || events instanceof Error) continue;
      for (const event of events) {
        const label = KIND_LABELS.find((l) => METADATA_KINDS[l] === event.kind);
        if (label) present.add(label);
      }
    }
    return KIND_LABELS.filter((l) => present.has(l));
  }, [relayEntries]);

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div>
        <h2 className="text-lg font-bold">Metadata Distribution</h2>
        <p className="text-sm text-base-content/60">
          Checks which metadata events (profile, contacts, relay lists, etc.) are present on each of a user's outbox
          relays.
        </p>
      </div>

      <PubkeyPicker value={selectedPubkey} onChange={setSelectedPubkey} />

      {!selectedPubkey && (
        <p className="text-sm text-base-content/40">Enter a pubkey above to inspect their relay metadata coverage.</p>
      )}

      {user && (
        <>
          <UserHeader user={user} />

          {relayEntries === null && (
            <div className="flex items-center gap-2 text-sm text-base-content/50">
              <span className="loading loading-spinner loading-xs" />
              Waiting for outbox relay list…
            </div>
          )}

          {relayEntries !== null && relayEntries.length === 0 && (
            <p className="text-sm text-base-content/40">No outbox relays found for this user.</p>
          )}

          {relayEntries !== null && relayEntries.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">
                Outbox Relays <span className="font-normal text-base-content/40">({relayEntries.length})</span>
              </p>
              {relayEntries.map(([relay, events]) => (
                <RelayRow key={relay.url} relay={relay} events={events} visibleLabels={visibleLabels} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
