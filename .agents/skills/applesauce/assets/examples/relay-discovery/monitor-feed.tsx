/**
 * Display relay monitor announcements and status information
 * @tags nip-66, relay-discovery, monitor, feed
 * @related relay-discovery/monitors-map, relay-discovery/attributes
 */
import { RelayDiscovery, RelayMonitor } from "applesauce-common/casts";
import { RELAY_DISCOVERY_KIND, RELAY_MONITOR_ANNOUNCEMENT_KIND } from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { unixNow } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useMemo, useState } from "react";
import { map } from "rxjs";
import RelayPicker from "../../components/relay-picker";

// Create stores and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Default discovery monitor pubkey
const DEFAULT_DISCOVERY_MONITOR = "9ba046db56b8e6682c48af8d6425ffe80430a3cd0854d95381af27c5d27ca0f7";
const DEFAULT_DISCOVERY_RELAY = "wss://relay.nostr.watch/";

// Component to display a relay discovery event in the feed
function RelayDiscoveryItem({ discovery }: { discovery: RelayDiscovery }) {
  const relayUrl = discovery.url;

  // Get favicon URL (from NIP-11 or fallback to /favicon.ico)
  const faviconUrl = use$(() => (relayUrl ? pool.relay(relayUrl).icon$ : undefined), [relayUrl]);

  if (!relayUrl) return null;

  return (
    <div className="flex items-center gap-3 p-3 border-b border-base-300 hover:bg-base-200 transition-colors">
      <div className="avatar shrink-0">
        <div className="w-10 h-10 rounded-full border-2 border-base-300">
          <img
            src={faviconUrl}
            alt="Relay favicon"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a simple circle icon
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (!target.parentElement) return;
              target.parentElement.innerHTML = `
                <div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                  ${relayUrl.slice(0, 1).toUpperCase()}
                </div>
              `;
            }}
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm font-medium truncate">{relayUrl}</div>
        <div className="flex gap-4 text-xs text-base-content/60 mt-1">
          {discovery.rttOpen !== undefined && <span>Open: {discovery.rttOpen}ms</span>}
          {discovery.rttRead !== undefined && <span>Read: {discovery.rttRead}ms</span>}
          {discovery.rttWrite !== undefined && <span>Write: {discovery.rttWrite}ms</span>}
          {discovery.networkType && <span>Network: {discovery.networkType}</span>}
        </div>
      </div>
      <div className="text-xs text-base-content/50 shrink-0">
        {new Date(discovery.event.created_at * 1000).toLocaleTimeString()}
      </div>
    </div>
  );
}

// Component that displays a live feed of relay discovery events from a monitor
function RelayDiscoveryFeed({ monitor, fallbackRelay }: { monitor: RelayMonitor; fallbackRelay: string }) {
  // Subscribe to all relay discovery events from the monitor
  const discoveries =
    use$(() => {
      // Use monitor's outboxes$ observable with fallback to selected relay
      return pool
        .subscription(
          monitor.author.outboxes$.pipe(map((outboxes) => outboxes || [fallbackRelay])),
          {
            kinds: [RELAY_DISCOVERY_KIND],
            authors: [monitor.author.pubkey],
            // In the last 5 minutes
            since: unixNow() - 5 * 60,
          },
          { eventStore },
        )
        .pipe(mapEventsToStore(eventStore), mapEventsToTimeline(), castTimelineStream(RelayDiscovery));
    }, [monitor.uid]) ?? [];

  return (
    <div className="flex-1 overflow-y-auto">
      {discoveries.length > 0 && (
        <div className="divide-y divide-base-300">
          {discoveries.map((discovery) => (
            <RelayDiscoveryItem key={discovery.event.id} discovery={discovery} />
          ))}
        </div>
      )}

      {discoveries.length === 0 && (
        <div className="flex items-center justify-center h-full text-base-content/50">
          <div className="text-center">
            <p className="text-lg mb-2">No relay discovery events found yet</p>
            <p className="text-sm">The monitor may not have published any events recently.</p>
          </div>
        </div>
      )}
    </div>
  );
}

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

function RelayStatusBadge({ relay }: { relay: string }) {
  const connected = use$(() => pool.relay(relay).connected$, [relay]);
  return <div className={`badge ${connected ? "badge-success" : "badge-error"}`}>{relay}</div>;
}

export default function MonitorFeed() {
  const [relay, setRelay] = useState<string>(DEFAULT_DISCOVERY_RELAY);
  const [selected, setSelected] = useState<string>(DEFAULT_DISCOVERY_MONITOR);

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
    () => (selected ? monitors?.find((m) => m.author.pubkey === selected) : undefined),
    [monitors, selected],
  );

  const outboxes = use$(monitor?.author.outboxes$);

  return (
    <div className="space-y-4 h-full overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-4">
        <h2 className="card-title">Monitor Relay Discovery Feed</h2>
        <p className="text-sm text-base-content/70">
          Select a relay (fallback) and a monitor to see a live feed of all relay discovery events that monitor is
          producing.
        </p>

        <div className="flex gap-2">
          <RelayPicker value={relay} onChange={setRelay} />
          {monitors && <MonitorPicker monitors={monitors} onChange={setSelected} value={selected} />}
        </div>

        {outboxes && (
          <div className="flex gap-2 flex-wrap">
            {outboxes.map((outbox) => (
              <RelayStatusBadge key={outbox} relay={outbox} />
            ))}
          </div>
        )}
      </div>

      {monitor ? (
        <RelayDiscoveryFeed monitor={monitor} fallbackRelay={relay} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center h-full text-base-content/50">
            <div className="text-center">
              <p className="text-lg mb-2">Select a monitor to view relay discovery events</p>
              <p className="text-sm">Use the pubkey picker above to get started</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
