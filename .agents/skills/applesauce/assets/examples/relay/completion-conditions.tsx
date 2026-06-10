/**
 * Visualize how different pool.request completion conditions work in real-time
 * @tags relay, pool, request, completion, eose, performance
 * @related feed/relay-timeline, outbox/relay-selection
 */
import { mapEventsToTimeline } from "applesauce-core";
import { getTagValue, NostrEvent, relaySet } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { RelayGroup, RelayPool } from "applesauce-relay";
import { completeWhen } from "applesauce-relay/operators/complete-when";
import { GroupReqMessage } from "applesauce-relay/types";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  finalize,
  last,
  map,
  merge,
  filter as rxFilter,
  scan,
  shareReplay,
  Subscription,
  take,
  tap,
  timer,
} from "rxjs";
import RelayPicker from "../../components/relay-picker";

// Create a relay pool instance
const pool = new RelayPool();

// Types for tracking completion conditions
type TimelineMessage = GroupReqMessage & {
  timestamp: number; // ms since query start
  deltaTime: number; // ms since last message from this relay
};

interface CompletionMarker {
  type: "firstEose" | "firstEosePlusTimeout" | "allComplete" | "firstNRelays" | "eventCount" | "timeLimit";
  time: number; // when it triggered
  eventCount: number; // events received at that point
  label: string; // display name
  explanation: string; // why it completed
  color: string; // tailwind color class
}

const MESSAGE_STYLES = {
  OPEN: "badge-info",
  EVENT: "badge-success",
  EOSE: "badge-warning",
  ERROR: "badge-error",
  CLOSED: "badge-neutral",
  RELAYS: "badge-accent",
};

type RelayState = "PENDING" | "OPEN" | "EOSE" | "CLOSED" | "ERROR";

const STATE_STYLES: Record<RelayState, string> = {
  PENDING: "badge-ghost",
  OPEN: "badge-info",
  EOSE: "badge-success",
  CLOSED: "badge-neutral",
  ERROR: "badge-error",
};

function RelayBadge({ relay, state }: { relay: string; state: RelayState }) {
  const icon = use$(() => pool.relay(relay).icon$, [relay]);
  const hostname = new URL(relay).hostname;

  return (
    <div className={`badge gap-1.5 ${STATE_STYLES[state]}`}>
      <img src={icon} alt="" className="w-4 h-4 rounded-sm" onError={(e) => (e.currentTarget.style.display = "none")} />
      <span className="font-mono text-xs">{hostname}</span>
      <span className="text-xs opacity-70">{state}</span>
    </div>
  );
}

export default function CompletionConditions() {
  const [relays, setRelays] = useState<string[]>(
    relaySet([
      "wss://relay.damus.io",
      "wss://relay.snort.social",
      "wss://nos.lol",
      "wss://relay.primal.net",
      "wss://nostr.wine",
      "wss://nostr-pub.wellorder.net",
      "wss://relay.nostr.band", // Intentionally add dead relay
    ]),
  );
  const [currentRelay, setCurrentRelay] = useState("");
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [filterJson, setFilterJson] = useState('{"kinds":[1],"limit":20}');
  const [filterError, setFilterError] = useState<string | null>(null);

  // Completion configuration
  const [eventCountThreshold, setEventCountThreshold] = useState(20);
  const [firstEoseTimeout, setFirstEoseTimeout] = useState(5000);
  const [firstNRelaysCount, setFirstNRelaysCount] = useState(2);
  const [timeLimitMs, setTimeLimitMs] = useState(10000);

  // Query state
  const [timelineMessages, setTimelineMessages] = useState<TimelineMessage[]>([]);
  const [completionMarkers, setCompletionMarkers] = useState<CompletionMarker[]>([]);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Get pool status
  const poolStatuses = use$(pool.status$);

  const relayStates = useMemo(() => {
    const states = new Map<string, RelayState>();
    for (const relay of relays) {
      states.set(relay, "PENDING");
    }
    for (const msg of timelineMessages) {
      if (msg.type === "OPEN" || msg.type === "EOSE" || msg.type === "CLOSED" || msg.type === "ERROR") {
        states.set(msg.from, msg.type);
      }
    }
    return states;
  }, [relays, timelineMessages]);

  // Validate filter JSON
  const validateFilter = useCallback((json: string) => {
    try {
      JSON.parse(json);
      setFilterError(null);
      return true;
    } catch (e) {
      setFilterError("Invalid JSON");
      return false;
    }
  }, []);

  // Add relay to list
  const handleAddRelay = useCallback(() => {
    if (currentRelay && !relays.includes(currentRelay)) {
      setRelays([...relays, currentRelay]);
      setCurrentRelay("");
    }
  }, [currentRelay, relays]);

  // Remove relay from list
  const handleRemoveRelay = useCallback(
    (relay: string) => {
      setRelays(relays.filter((r) => r !== relay));
    },
    [relays],
  );

  // Fetch random relays by requesting kind 30166 relay status events from relay.nostr.watch
  const handleRandomRelays = useCallback(() => {
    setIsLoadingRandom(true);

    const monitorRelay = pool.relay("wss://relay.nostr.watch");
    monitorRelay
      .request({ kinds: [30166], limit: 200 }, { timeout: 10_000 })
      .pipe(mapEventsToTimeline(), last())
      .subscribe((events) => {
        const relays = relaySet(events.map((event) => getTagValue(event, "d")).filter((v) => v !== undefined));
        setRelays(relays.sort(() => Math.random() - 0.5).slice(0, 10));
        setIsLoadingRandom(false);
      });
  }, []);

  const handleReset = useCallback(() => {
    subscriptionsRef.current?.unsubscribe();
    subscriptionsRef.current = undefined;
    setIsQuerying(false);
    setTimelineMessages([]);
    setCompletionMarkers([]);
    setEvents([]);
  }, []);

  // Use ref to store subscriptions so we can cleanup
  const subscriptionsRef = useRef<Subscription>();

  // Start query
  const handleQuery = useCallback(() => {
    if (!validateFilter(filterJson)) return;
    if (relays.length === 0) return;

    handleReset();
    setIsQuerying(true);

    // Cleanup previous subscriptions
    subscriptionsRef.current?.unsubscribe();

    const group = pool.group(relays);
    const filter = JSON.parse(filterJson);
    const queryStartTime = Date.now();

    // Track relay-specific deltas
    const lastMessageTime = new Map<string, number>();

    // Create the root observable with message storage
    const messages$ = group.req(filter).pipe(
      tap((message) => {
        const timestamp = Date.now() - queryStartTime;
        const lastTime = lastMessageTime.get(message.from) || 0;
        const deltaTime = timestamp - lastTime;
        lastMessageTime.set(message.from, timestamp);

        // Store all messages in timeline
        setTimelineMessages((prev) => [
          ...prev,
          {
            ...message,
            timestamp,
            deltaTime,
          },
        ]);
      }),
      shareReplay(100), // Share and reply messages so conditions don't miss messages
    );

    // Fork observable for First EOSE completion
    const firstEose$ = messages$.pipe(
      completeWhen((source) =>
        source.pipe(
          rxFilter((m) => m.type === "EOSE"),
          take(1),
          map(() => true),
        ),
      ),
    );

    // Fork observable for Event Count completion
    const eventCount$ = messages$.pipe(
      completeWhen((source) =>
        source.pipe(
          rxFilter((m) => m.type === "EVENT"),
          scan((count) => count + 1, 0),
          rxFilter((count) => count >= eventCountThreshold),
          take(1),
          map(() => true),
        ),
      ),
    );

    // Fork observable for First N Relays completion
    const firstNRelays$ = messages$.pipe(
      completeWhen((source) =>
        source.pipe(
          rxFilter((m) => m.type === "EOSE"),
          scan((relaySet, msg) => {
            relaySet.add(msg.from);
            return relaySet;
          }, new Set<string>()),
          rxFilter((relaySet) => relaySet.size >= firstNRelaysCount),
          take(1),
          map(() => true),
        ),
      ),
    );

    // Fork observable for First EOSE + Timeout completion
    const firstEosePlusTimeout$ = messages$.pipe(completeWhen(RelayGroup.completeAfterFirstRelay(firstEoseTimeout)));

    // Fork observable for All EOSE completion
    const allComplete$ = messages$.pipe(completeWhen(RelayGroup.completeOnAllEose()));

    // Fork observable for Time Limit completion
    const timeLimit$ = messages$.pipe(completeWhen(() => timer(timeLimitMs).pipe(map(() => true))));

    // Helper to get explanation for each completion type
    const getExplanation = (type: string): string => {
      switch (type) {
        case "firstEose":
          return `First relay sent EOSE. Fastest completion strategy.`;
        case "eventCount":
          return `Received ${eventCountThreshold} events. Event count threshold reached.`;
        case "firstNRelays":
          return `${firstNRelaysCount} relays sent EOSE. Balanced speed vs completeness.`;
        case "firstEosePlusTimeout":
          return `${firstEoseTimeout}ms elapsed after first EOSE. Allows slower relays to contribute additional events.`;
        case "allComplete":
          return `All ${relays.length} relays sent EOSE. Maximum completeness, query complete.`;
        case "timeLimit":
          return `Time limit of ${timeLimitMs}ms reached. Query would be terminated regardless of relay status.`;
        default:
          return "";
      }
    };

    // Helper to create completion observable with finalize
    const createCompletionObservable = (type: string, label: string, color: string, observable: typeof firstEose$) => {
      const seen = new Set<string>();

      return observable.pipe(
        tap((message: GroupReqMessage) => {
          if (message.type === "EVENT") {
            seen.add(message.event.id);
          }
        }),
        finalize(() => {
          const timestamp = Date.now() - queryStartTime;

          setCompletionMarkers((prev) => [
            ...prev,
            {
              type: type as any,
              time: timestamp,
              eventCount: seen.size,
              label,
              explanation: getExplanation(type),
              color,
            },
          ]);
        }),
      );
    };

    // Merge all completion observables and subscribe to them all at once
    const completions$ = merge(
      createCompletionObservable("firstEose", "First EOSE", "bg-yellow-500", firstEose$),
      createCompletionObservable("eventCount", "Event Count", "bg-blue-500", eventCount$),
      createCompletionObservable("firstNRelays", "First N Relays", "bg-green-500", firstNRelays$),
      createCompletionObservable(
        "firstEosePlusTimeout",
        "First EOSE + Timeout",
        "bg-orange-500",
        firstEosePlusTimeout$,
      ),
      createCompletionObservable("allComplete", "All Complete", "bg-purple-500", allComplete$),
      createCompletionObservable("timeLimit", "Time Limit", "bg-red-500", timeLimit$),
    );

    // Subscribe to all observables
    const seen = new Set<string>();
    subscriptionsRef.current = completions$.subscribe({
      next: (message) => {
        if (message.type === "EVENT" && !seen.has(message.event.id)) {
          seen.add(message.event.id);
          setEvents((prev) => [...prev, message.event]);
        }
      },
      complete: () => setIsQuerying(false),
    });
  }, [
    filterJson,
    relays,
    eventCountThreshold,
    firstEoseTimeout,
    firstNRelaysCount,
    timeLimitMs,
    validateFilter,
    handleReset,
  ]);

  // Format time display
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Controls */}
      <div className="card bg-base-200">
        <div className="card-body space-y-4">
          {/* Relay Management */}
          <div>
            <label className="label">
              <span className="label-text font-semibold">Relays ({relays.length})</span>
            </label>
            <div className="flex gap-2 mb-2">
              <RelayPicker value={currentRelay} onChange={setCurrentRelay} className="flex-1" />
              <button
                className="btn btn-primary"
                onClick={handleAddRelay}
                disabled={!currentRelay || relays.includes(currentRelay)}
              >
                Add Relay
              </button>
              <button className="btn btn-secondary" onClick={handleRandomRelays} disabled={isLoadingRandom}>
                {isLoadingRandom ? "Loading..." : "Random"}
              </button>
            </div>
            {relays.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {relays.map((relay) => (
                  <div key={relay} className="badge badge-lg gap-2">
                    <span className="font-mono">{relay}</span>
                    <button className="btn btn-ghost btn-xs btn-circle" onClick={() => handleRemoveRelay(relay)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter Configuration */}
          <div>
            <label className="label">
              <span className="label-text font-semibold">Filter (JSON)</span>
              {filterError && <span className="label-text-alt text-error">{filterError}</span>}
            </label>
            <textarea
              className={`textarea textarea-bordered w-full font-mono text-sm ${filterError ? "textarea-error" : ""}`}
              rows={3}
              value={filterJson}
              onChange={(e) => {
                setFilterJson(e.target.value);
                validateFilter(e.target.value);
              }}
            />
          </div>

          {/* Completion Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="label">
                <span className="label-text">Event Count Threshold: {eventCountThreshold}</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={eventCountThreshold}
                onChange={(e) => setEventCountThreshold(Number(e.target.value))}
                className="range range-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">
                <span className="label-text">First EOSE Timeout: {formatTime(firstEoseTimeout)}</span>
              </label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={firstEoseTimeout}
                onChange={(e) => setFirstEoseTimeout(Number(e.target.value))}
                className="range range-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">
                <span className="label-text">First N Relays: {firstNRelaysCount}</span>
              </label>
              <input
                type="range"
                min="1"
                max={Math.max(relays.length, 5)}
                value={Math.min(firstNRelaysCount, relays.length)}
                onChange={(e) => setFirstNRelaysCount(Number(e.target.value))}
                className="range range-sm"
                disabled={relays.length === 0}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">
                <span className="label-text">Time Limit: {formatTime(timeLimitMs)}</span>
              </label>
              <input
                type="range"
                min="100"
                max="30000"
                step="100"
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                className="range range-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleQuery}
              disabled={isQuerying || relays.length === 0 || !!filterError}
            >
              {isQuerying ? "Querying..." : "Start Query"}
            </button>
            <button className="btn" onClick={handleReset} disabled={timelineMessages.length === 0 && !isQuerying}>
              Reset
            </button>
            {poolStatuses && Object.keys(poolStatuses).length > 0 && (
              <div className="badge badge-lg ml-auto">
                Connected: {Object.values(poolStatuses).filter((s) => s.ready).length}/
                {Object.keys(poolStatuses).length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Summary */}
      {completionMarkers.length > 0 && (
        <div className="card bg-base-100">
          <div className="card-body">
            <h2 className="card-title">Completion Summary</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th>Trigger Time</th>
                    <th>Events Received</th>
                    <th>Coverage</th>
                    <th>Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {completionMarkers
                    .slice()
                    .sort((a, b) => a.time - b.time)
                    .map((marker, idx) => {
                      const totalEvents = events.length;
                      const coverage = totalEvents > 0 ? ((marker.eventCount / totalEvents) * 100).toFixed(0) : "0";
                      const speeds = ["Fastest", "Fast", "Medium", "Slow", "Slower", "Slowest"];
                      const speed = speeds[Math.min(idx, speeds.length - 1)];

                      return (
                        <tr key={marker.type}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${marker.color}`}></div>
                              <span className="font-semibold">{marker.label}</span>
                            </div>
                          </td>
                          <td className="font-mono">{formatTime(marker.time)}</td>
                          <td>{marker.eventCount}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <progress
                                className="progress progress-primary w-20"
                                value={coverage}
                                max="100"
                              ></progress>
                              <span className="text-sm">{coverage}%</span>
                            </div>
                          </td>
                          <td>
                            <div className="badge badge-outline">{speed}</div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {timelineMessages.length > 0 && (
        <div className="card bg-base-100">
          <div className="card-body">
            <h2 className="card-title">Message Timeline</h2>
            <div className="flex flex-wrap gap-2">
              {relays.map((relay) => (
                <RelayBadge key={relay} relay={relay} state={relayStates.get(relay) || "PENDING"} />
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Relay</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Δ Time</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineMessages.map((msg, idx) => {
                    const msgType = msg.type as keyof typeof MESSAGE_STYLES;

                    // Get details based on message type
                    let details = "";
                    if (msg.type === "EVENT") {
                      details = msg.event.id.substring(0, 8);
                    } else if (msg.type === "OPEN") {
                      details = msg.from;
                    }

                    // Find if any completion marker should appear before this message
                    const markersBefore = completionMarkers.filter(
                      (m) => idx > 0 && m.time >= timelineMessages[idx - 1].timestamp && m.time < msg.timestamp,
                    );

                    return (
                      <>
                        {/* Completion markers */}
                        {markersBefore.map((marker) => {
                          const borderColor = marker.color.replace("bg-", "border-");
                          return (
                            <tr key={`completion-${marker.type}-${marker.time}`}>
                              <td colSpan={5} className={`border-l-4 ${borderColor} p-3 bg-base-200`}>
                                <div className="flex items-center gap-4">
                                  <div className="badge badge-sm">{formatTime(marker.time)}</div>
                                  <div className="font-semibold">{marker.label} would complete here</div>
                                  <div className="text-sm opacity-70">{marker.explanation}</div>
                                  <div className="badge badge-sm ml-auto">{marker.eventCount} events</div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Message row */}
                        <tr key={idx}>
                          <td className="font-mono text-xs">{formatTime(msg.timestamp)}</td>
                          <td className="font-mono text-xs truncate max-w-[200px]">{msg.from}</td>
                          <td>
                            <div className={`badge badge-sm ${MESSAGE_STYLES[msgType] || "badge-ghost"}`}>
                              {msg.type}
                            </div>
                          </td>
                          <td className="font-mono text-xs">{details}</td>
                          <td className="font-mono text-xs">{formatTime(msg.deltaTime)}</td>
                        </tr>
                      </>
                    );
                  })}

                  {/* Completion markers at the end */}
                  {completionMarkers
                    .filter(
                      (m) =>
                        timelineMessages.length === 0 ||
                        m.time >= timelineMessages[timelineMessages.length - 1].timestamp,
                    )
                    .map((marker) => {
                      const borderColor = marker.color.replace("bg-", "border-");
                      return (
                        <tr key={`completion-${marker.type}-${marker.time}`}>
                          <td colSpan={5} className={`border-l-4 ${borderColor} p-3 bg-base-200`}>
                            <div className="flex items-center gap-4">
                              <div className="badge badge-sm">{formatTime(marker.time)}</div>
                              <div className="font-semibold">{marker.label} would complete here</div>
                              <div className="text-sm opacity-70">{marker.explanation}</div>
                              <div className="badge badge-sm ml-auto">{marker.eventCount} events</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
