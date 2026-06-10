/**
 * Check the health of a user's inbox and outbox relays using a relay monitor
 * @tags nip-65, nip-66, relay-discovery, mailbox, rx-views
 * @related relay-discovery/mailbox-map, relay-discovery/contacts-relays
 */
import { castUser, RelayDiscovery, RelayMonitor, User } from "applesauce-common/casts";
import { RELAY_MONITOR_ANNOUNCEMENT_KIND } from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { combineLatestByValue, defined, EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useMemo, useState } from "react";
import { catchError, isObservable, Observable, of, startWith, switchMap, takeUntil, timer } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";
import RelayPicker from "../../components/relay-picker";

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

const DEFAULT_DISCOVERY_RELAY = "wss://relay.nostr.watch/";
const DEFAULT_DISCOVERY_MONITOR = "9ba046db56b8e6682c48af8d6425ffe80430a3cd0854d95381af27c5d27ca0f7";

// ─── Rx Views ─────────────────────────────────────────────────────────────────

/** Observable view of a user's inbox relay statuses */
function inboxStatusesView(user: User | Observable<User>, monitors: RelayMonitor[] | Observable<RelayMonitor[]>) {
  const monitors$ = isObservable(monitors) ? monitors : of(monitors);
  const user$ = isObservable(user) ? user : of(user);

  return user$.pipe(
    // Select the users inboxes
    switchMap((user) => user.inboxes$),
    // Wait till they load
    defined(),
    // For each inbox get the status from the monitor
    combineLatestByValue((url) =>
      // Get the list of monitors
      monitors$.pipe(
        // For each monitor get the status of the relay
        combineLatestByValue((monitor) =>
          monitor.relayStatus(url).pipe(
            takeUntil(timer(15_000)), // 15s timeout for relay status request
            startWith(undefined), // Start with undefined to avoid loading state
            catchError((err) => of(err as Error)), // Catch error and pass back to UI
          ),
        ),
      ),
    ),
  );
}

/** Observable view of a user's outbox relay statuses */
function outboxStatusesView(user: User | Observable<User>, monitors: RelayMonitor[] | Observable<RelayMonitor[]>) {
  const monitors$ = isObservable(monitors) ? monitors : of(monitors);
  const user$ = isObservable(user) ? user : of(user);

  return user$.pipe(
    // Select the users inboxes
    switchMap((user) => user.outboxes$),
    // Wait till they load
    defined(),
    // For each inbox get the status from the monitor
    combineLatestByValue((url) =>
      // Get the list of monitors
      monitors$.pipe(
        // For each monitor get the status of the relay
        combineLatestByValue((monitor) =>
          monitor.relayStatus(url).pipe(
            takeUntil(timer(15_000)), // 15s timeout for relay status request
            startWith(undefined), // Start with undefined to avoid loading state
            catchError((err) => of(err as Error)), // Catch error and pass back to UI
          ),
        ),
      ),
    ),
  );
}

// ─── Monitor Picker ────────────────────────────────────────────────────────────

function MonitorToggle({
  monitor,
  selected,
  onToggle,
}: {
  monitor: RelayMonitor;
  selected: boolean;
  onToggle: () => void;
}) {
  const profile = use$(() => monitor.author.profile$, [monitor.author.pubkey]);
  const name = profile?.displayName ?? monitor.author.pubkey.slice(0, 8) + "…";

  return (
    <button
      className={`btn btn-sm ${selected ? "btn-primary" : "btn-ghost border border-base-300"}`}
      onClick={onToggle}
    >
      {name}
    </button>
  );
}

function MonitorPicker({
  monitors,
  value,
  onChange,
}: {
  monitors: RelayMonitor[];
  value: string[];
  onChange: (pubkeys: string[]) => void;
}) {
  function toggle(pubkey: string) {
    onChange(value.includes(pubkey) ? value.filter((p) => p !== pubkey) : [...value, pubkey]);
  }

  return (
    <div className="flex flex-wrap gap-1">
      {monitors.map((m) => (
        <MonitorToggle
          key={m.uid}
          monitor={m}
          selected={value.includes(m.author.pubkey)}
          onToggle={() => toggle(m.author.pubkey)}
        />
      ))}
    </div>
  );
}

// ─── Relay Status Table ────────────────────────────────────────────────────────

function RttBadge({ ms }: { ms: number | undefined }) {
  if (ms === undefined) return <span className="text-base-content/30">—</span>;
  const color = ms < 200 ? "text-success" : ms < 600 ? "text-warning" : "text-error";
  return <span className={color}>{ms} ms</span>;
}

type RelayStatus = RelayDiscovery | null | Error | undefined;

function StatusBadge({ discovery }: { discovery: RelayStatus }) {
  if (discovery === undefined) return <span className="loading loading-ring loading-xs" />;
  if (discovery === null) return <span className="badge badge-ghost badge-sm">Not monitored</span>;
  if (discovery instanceof Error) return <span className="badge badge-error badge-sm">Error</span>;
  if (discovery.rttOpen === undefined) return <span className="badge badge-warning badge-sm">Unknown</span>;
  return <span className="badge badge-success badge-sm">Online</span>;
}

function MonitorStatusRow({ monitor, discovery }: { monitor: RelayMonitor; discovery: RelayStatus }) {
  const profile = use$(() => monitor.author.profile$, [monitor.author.pubkey]);
  const disc = discovery instanceof RelayDiscovery ? discovery : undefined;
  const name = profile?.displayName ?? monitor.author.pubkey.slice(0, 8) + "…";

  return (
    <tr className="bg-base-200/40">
      <td className="pl-10 text-xs text-base-content/60 italic">{name}</td>
      <td>
        <StatusBadge discovery={discovery} />
      </td>
      <td className="text-xs">
        <RttBadge ms={disc?.rttOpen} />
      </td>
      <td className="text-xs">
        <RttBadge ms={disc?.rttRead} />
      </td>
      <td className="text-xs">
        <RttBadge ms={disc?.rttWrite} />
      </td>
      <td className="text-xs text-base-content/60">{disc?.networkType ?? "—"}</td>
      <td className="text-xs text-base-content/60">
        {disc?.supportedNIPs
          ? disc.supportedNIPs.slice(0, 5).join(", ") + (disc.supportedNIPs.length > 5 ? "…" : "")
          : "—"}
      </td>
    </tr>
  );
}

function RelayRow({ url, statuses }: { url: string; statuses: Map<RelayMonitor, RelayStatus> }) {
  const icon = use$(() => pool.relay(url).icon$, [url]);

  return (
    <>
      <tr>
        <td colSpan={7}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 shrink-0 rounded-full border border-base-300 overflow-hidden bg-base-200">
              <img src={icon} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-mono text-xs truncate font-semibold">{url}</span>
          </div>
        </td>
      </tr>
      {[...statuses.entries()].map(([monitor, discovery]) => (
        <MonitorStatusRow key={monitor.uid} monitor={monitor} discovery={discovery} />
      ))}
    </>
  );
}

type RelayStatusMap = Map<string, Map<RelayMonitor, RelayStatus>>;

function StatusTable({ label, statusMap }: { label: string; statusMap: RelayStatusMap | undefined }) {
  const urls = statusMap ? [...statusMap.keys()] : [];

  if (urls.length === 0 && statusMap !== undefined) {
    return (
      <div>
        <p className="text-sm font-semibold mb-1">{label}</p>
        <p className="text-sm text-base-content/40">No relays configured</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold mb-2">
        {label} {statusMap !== undefined && <span className="font-normal text-base-content/40">({urls.length})</span>}
      </p>
      {statusMap === undefined ? (
        <div className="flex items-center gap-2 text-sm text-base-content/50">
          <span className="loading loading-spinner loading-xs" />
          Waiting for relay list…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead>
              <tr>
                <th>Relay</th>
                <th>Status</th>
                <th>RTT Open</th>
                <th>RTT Read</th>
                <th>RTT Write</th>
                <th>Network</th>
                <th>NIPs</th>
              </tr>
            </thead>
            <tbody>
              {urls.map((url) => (
                <RelayRow key={url} url={url} statuses={statusMap!.get(url)!} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Example ──────────────────────────────────────────────────────────────

export default function MailboxStatuses() {
  const [discoveryRelay, setDiscoveryRelay] = useState(DEFAULT_DISCOVERY_RELAY);
  const [selectedMonitorPubkeys, setSelectedMonitorPubkeys] = useState<string[]>([DEFAULT_DISCOVERY_MONITOR]);
  const [selectedPubkey, setSelectedPubkey] = useState("");

  // Subscribe to monitor announcements on the discovery relay
  const monitors = use$(
    () =>
      pool
        .relay(discoveryRelay)
        .subscription({ kinds: [RELAY_MONITOR_ANNOUNCEMENT_KIND] })
        .pipe(mapEventsToStore(eventStore), mapEventsToTimeline(), castTimelineStream(RelayMonitor, eventStore)),
    [discoveryRelay],
  );

  const selectedMonitors = useMemo(
    () => monitors?.filter((m) => selectedMonitorPubkeys.includes(m.author.pubkey)) ?? [],
    [monitors, selectedMonitorPubkeys],
  );

  const user = useMemo(() => (selectedPubkey ? castUser(selectedPubkey, eventStore) : undefined), [selectedPubkey]);

  const inboxStatuses = use$(
    () => (user && selectedMonitors.length > 0 ? inboxStatusesView(user, selectedMonitors) : undefined),
    [user?.pubkey, selectedMonitors.map((m) => m.uid).join(",")],
  );

  const outboxStatuses = use$(
    () => (user && selectedMonitors.length > 0 ? outboxStatusesView(user, selectedMonitors) : undefined),
    [user?.pubkey, selectedMonitors.map((m) => m.uid).join(",")],
  );

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div>
        <h2 className="text-lg font-bold">Mailbox Relay Health</h2>
        <p className="text-sm text-base-content/60">
          Pick a user and relay monitors to check the health of their NIP-65 inbox and outbox relays.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <RelayPicker value={discoveryRelay} onChange={setDiscoveryRelay} />
        {monitors && monitors.length > 0 && (
          <MonitorPicker monitors={monitors} value={selectedMonitorPubkeys} onChange={setSelectedMonitorPubkeys} />
        )}
        <PubkeyPicker value={selectedPubkey} onChange={setSelectedPubkey} />
      </div>

      {!selectedPubkey && (
        <p className="text-sm text-base-content/40">Enter a pubkey above to check their relay health.</p>
      )}

      {selectedPubkey && selectedMonitors.length === 0 && (
        <div className="alert alert-warning text-sm">No monitor selected — relay status data requires a monitor.</div>
      )}

      {selectedPubkey && selectedMonitors.length > 0 && (
        <div className="flex flex-col gap-6 divide-y divide-base-300">
          <StatusTable label="Inboxes" statusMap={inboxStatuses} />
          <div className="pt-6">
            <StatusTable label="Outboxes" statusMap={outboxStatuses} />
          </div>
        </div>
      )}
    </div>
  );
}
