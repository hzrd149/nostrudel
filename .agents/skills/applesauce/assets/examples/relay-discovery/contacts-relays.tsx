/**
 * Discover relays from user contact lists and recommendations
 * @tags nip-02, nip-65, nip-66, relay-discovery, contacts, relays
 * @related relay-discovery/attributes, relay-discovery/monitor-feed
 */
import { castUser, RelayMonitor, User } from "applesauce-common/casts";
import { RELAY_MONITOR_ANNOUNCEMENT_KIND } from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useMemo, useState } from "react";
import { combineLatest, map } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";
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

type RelayStatus = "online" | "offline" | "unknown";

interface RelayWithUsers {
  url: string;
  users: User[];
  status: RelayStatus;
  lastChecked: Date | null;
}

function RelayStatusBadge({ status }: { status: RelayStatus }) {
  const statusConfig = {
    online: { label: "Online", className: "badge-success" },
    offline: { label: "Offline", className: "badge-error" },
    unknown: { label: "Unknown", className: "badge-warning" },
  };

  const config = statusConfig[status];

  return <span className={`badge ${config.className}`}>{config.label}</span>;
}

function RelayListItem({ relay, monitor }: { relay: RelayWithUsers; monitor: RelayMonitor | undefined }) {
  // Get relay discovery status from monitor
  const discovery = use$(() => (monitor ? monitor.relayStatus(relay.url) : undefined), [monitor?.uid, relay.url]);

  // Determine status based on discovery event
  const status = useMemo(() => {
    if (!discovery || !monitor) return "unknown" as RelayStatus;

    const frequency = monitor.frequency;
    if (!frequency) return "unknown" as RelayStatus;

    const eventTime = discovery.event.created_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const age = (now - eventTime) / 1000; // Age in seconds

    // If the event is older than the monitor's frequency, consider it offline
    if (age > frequency) {
      return "offline" as RelayStatus;
    }

    return "online" as RelayStatus;
  }, [discovery, monitor]);

  const lastChecked = useMemo(() => {
    if (!discovery) return null;
    return new Date(discovery.event.created_at * 1000);
  }, [discovery]);

  // Get favicon URL (from NIP-11 or fallback to /favicon.ico)
  const faviconUrl = use$(() => pool.relay(relay.url).icon$, [relay.url]);

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
                  ${relay.url.slice(0, 1).toUpperCase()}
                </div>
              `;
            }}
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm font-medium truncate">{relay.url}</div>
        <div className="flex gap-4 text-xs text-base-content/60 mt-1">
          <RelayStatusBadge status={status} />
          <span>
            {relay.users.length} {relay.users.length === 1 ? "user" : "users"}
          </span>
        </div>
      </div>
      {lastChecked && <div className="text-xs text-base-content/50 shrink-0">{lastChecked.toLocaleTimeString()}</div>}
    </div>
  );
}

function MonitorOption({ monitor }: { monitor: RelayMonitor }) {
  const profile = use$(() => monitor.author.profile$, [monitor.author.pubkey]);

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

export default function ContactsRelays() {
  const [relay, setRelay] = useState<string>(DEFAULT_DISCOVERY_RELAY);
  const [selectedMonitor, setSelectedMonitor] = useState<string>(DEFAULT_DISCOVERY_MONITOR);
  const [selectedPubkey, setSelectedPubkey] = useState<string>("");

  // Get the monitor's announcement event
  const monitors = use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [RELAY_MONITOR_ANNOUNCEMENT_KIND] })
        .pipe(mapEventsToStore(eventStore), mapEventsToTimeline(), castTimelineStream(RelayMonitor, eventStore)),
    [relay],
  );

  // Get the selected monitor
  const monitor = useMemo(
    () => (selectedMonitor && monitors ? monitors.find((m) => m.author.pubkey === selectedMonitor) : undefined),
    [monitors, selectedMonitor],
  );

  // Cast the selected pubkey to a User
  const user = useMemo(() => (selectedPubkey ? castUser(selectedPubkey, eventStore) : undefined), [selectedPubkey]);

  // Get user's contacts
  const contacts = use$(() => (user ? user.contacts$ : undefined), [user?.pubkey]);

  // Get outbox relays for each contact
  const contactsWithOutboxes = use$(
    () =>
      contacts
        ? combineLatest(contacts.map((contact) => contact.outboxes$.pipe(map((outboxes) => ({ contact, outboxes })))))
        : undefined,
    [contacts?.map((c) => c.pubkey).join(",")],
  );

  // Aggregate relays by popularity
  const relaysByPopularity = useMemo(() => {
    if (!contactsWithOutboxes) return [];

    const relayMap = new Map<string, User[]>();

    for (const { contact, outboxes } of contactsWithOutboxes) {
      if (!outboxes) continue;

      for (const relayUrl of outboxes) {
        if (!relayMap.has(relayUrl)) {
          relayMap.set(relayUrl, []);
        }
        const users = relayMap.get(relayUrl)!;
        if (!users.find((u) => u.pubkey === contact.pubkey)) {
          users.push(contact);
        }
      }
    }

    // Convert to array and sort by popularity (number of users)
    const relays: RelayWithUsers[] = Array.from(relayMap.entries())
      .map(([url, users]) => ({
        url,
        users,
        status: "unknown" as RelayStatus,
        lastChecked: null,
      }))
      .sort((a, b) => b.users.length - a.users.length);

    return relays;
  }, [contactsWithOutboxes]);

  return (
    <div className="space-y-4 h-full overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-2">
        <h2 className="card-title">Contacts' Outbox Relays</h2>
        <p className="text-sm text-base-content/70">
          Select a monitor and a user to view their contacts' outbox relays aggregated by popularity. Each relay shows
          which users are using it and its latest status from the monitor.
        </p>

        <div className="flex gap-2">
          <RelayPicker value={relay} onChange={setRelay} />
          {monitors && <MonitorPicker monitors={monitors} onChange={setSelectedMonitor} value={selectedMonitor} />}
        </div>

        <PubkeyPicker value={selectedPubkey} onChange={setSelectedPubkey} />

        {!monitor && <div className="text-sm text-base-content/70">Select a monitor to view relay discovery data</div>}

        {selectedPubkey && !contacts && <div className="text-sm text-base-content/70">Loading contacts...</div>}

        {selectedPubkey && contacts && contacts.length === 0 && (
          <div className="alert alert-warning">
            <span>This user has no contacts.</span>
          </div>
        )}

        {selectedPubkey && contacts && contacts.length > 0 && (
          <div className="text-sm text-base-content/70">
            Found {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
            {relaysByPopularity.length > 0 && ` with ${relaysByPopularity.length} unique outbox relays`}
          </div>
        )}
      </div>

      {selectedPubkey && contacts && contacts.length > 0 ? (
        relaysByPopularity.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {relaysByPopularity.map((relay) => (
              <RelayListItem key={relay.url} relay={relay} monitor={monitor} />
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            <span>No outbox relays found for this user's contacts.</span>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center h-full text-base-content/50">
          <div className="text-center">
            <p className="text-lg mb-2">Select a monitor and user to view their contacts' outbox relays</p>
            <p className="text-sm">Use the pickers above to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
