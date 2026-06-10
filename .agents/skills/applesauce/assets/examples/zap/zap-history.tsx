/**
 * Visualize zap (Lightning payment) relationships as a graph
 * @tags nip-57, nip-65, zap, graph, lightning, outbox, cast, visualization, chart.js, react-chartjs-2
 * @related zap/timeline, zap/loading-zaps
 */
import { Zap } from "applesauce-common/casts";
import { castTimelineStream } from "applesauce-common/observable";
import { castUser, EventStore, mapEventsToStore } from "applesauce-core";
import { createEventLoaderForStore, createTimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LogarithmicScale,
  Title,
  Tooltip,
} from "chart.js";
import { Filter, kinds } from "nostr-tools";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { EMPTY } from "rxjs";

import PubkeyPicker from "../../components/pubkey-picker";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Title, Tooltip, Legend);

// Setup stores and pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Create a unified event loader so we can fetch profiles and NIP-65 mailbox lists
// for any user the chart needs to inspect
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com", "wss://indexer.coracle.social"],
});

const DEFAULT_PUBKEY = "5c508c34f58866ec7341aaf10cc1af52e9232bb9f859c8103ca5ecf2aa93bf78";

type ChartMode = "amount" | "count";
type ScaleType = "linear" | "logarithmic";

function prepareChartData(zaps: Zap[], userPubkey: string, mode: ChartMode) {
  // Project zaps onto a simple shape for charting
  const items = zaps
    .map((zap) => {
      try {
        return {
          timestamp: zap.event.created_at,
          amount: Math.round(zap.amount / 1000), // msats -> sats
          isIncoming: zap.recipient.pubkey === userPubkey,
        };
      } catch {
        return null;
      }
    })
    .filter((z): z is { timestamp: number; amount: number; isIncoming: boolean } => z !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Group by day for better visualization
  const dailyZaps = items.reduce<Record<string, { incoming: number; outgoing: number }>>((acc, zap) => {
    const date = new Date(zap.timestamp * 1000).toLocaleDateString();
    if (!acc[date]) acc[date] = { incoming: 0, outgoing: 0 };

    if (zap.isIncoming) acc[date].incoming += mode === "amount" ? zap.amount : 1;
    else acc[date].outgoing += mode === "amount" ? zap.amount : 1;

    return acc;
  }, {});

  return {
    labels: Object.keys(dailyZaps),
    datasets: [
      {
        label: `Incoming Zaps (${mode === "amount" ? "sats" : "count"})`,
        data: Object.values(dailyZaps).map((d) => d.incoming),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: `Outgoing Zaps (${mode === "amount" ? "sats" : "count"})`,
        data: Object.values(dailyZaps).map((d) => d.outgoing),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };
}

export default function ZapGraph() {
  const [pubkey, setPubkey] = useState<string>(DEFAULT_PUBKEY);
  const [loading, setLoading] = useState(false);
  const [limit] = useState(50);
  const [chartMode, setChartMode] = useState<ChartMode>("amount");
  const [scaleType, setScaleType] = useState<ScaleType>("linear");

  // Cast the pubkey into a User and subscribe to its outbox relays (NIP-65)
  const user = useMemo(() => castUser(pubkey, eventStore), [pubkey]);
  const relays = use$(user.outboxes$);

  // Build filters for incoming (#p) and outgoing (#P) zaps
  const filters = useMemo<Filter[]>(
    () => [
      { kinds: [kinds.Zap], "#p": [pubkey], limit }, // Incoming zaps
      { kinds: [kinds.Zap], "#P": [pubkey], limit }, // Outgoing zaps
    ],
    [pubkey, limit],
  );

  // Live subscription to new zaps from the user's outbox relays
  use$(() => {
    if (!relays || relays.length === 0) return EMPTY;
    return pool.subscription(relays, filters).pipe(mapEventsToStore(eventStore));
  }, [relays?.join("|"), filters]);

  // Paginated loader for historical zaps from the same outbox relays
  const loader = useMemo(() => {
    if (!relays || relays.length === 0) return null;
    return createTimelineLoader(pool, relays, filters, { eventStore });
  }, [relays?.join("|"), filters]);

  // Cast the live timeline of zap events into Zap instances
  const zaps = use$(() => eventStore.timeline(filters).pipe(castTimelineStream(Zap, eventStore)), [filters]);

  const loadMore = useCallback(() => {
    if (!loader) return;

    setLoading(true);
    loader().subscribe({ complete: () => setLoading(false) });
  }, [loader]);

  // Load the first page whenever the loader (pubkey / outbox relays) changes
  useEffect(() => {
    if (loader) loadMore();
  }, [loader]);

  const chartData = useMemo(() => {
    if (!pubkey || !zaps || zaps.length === 0) return null;
    return prepareChartData(zaps, pubkey, chartMode);
  }, [zaps, pubkey, chartMode]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: "top" as const },
        title: { text: `Zap Activity Over Time (${chartMode === "amount" ? "Amount" : "Count"})` },
      },
      scales: {
        y: {
          type: scaleType,
          min: 1,
          title: { text: chartMode === "amount" ? "Amount (sats)" : "Number of Zaps" },
        },
        x: { title: { text: "Date" } },
      },
    }),
    [chartMode, scaleType],
  );

  return (
    <div className="container mx-auto my-8 p-4">
      <div className="mb-6">
        <PubkeyPicker value={pubkey} onChange={setPubkey} />
      </div>

      {pubkey ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="text-sm text-gray-500">
              {relays && relays.length > 0
                ? `Reading from ${relays.length} outbox relay${relays.length === 1 ? "" : "s"}`
                : "Looking up outbox relays..."}
            </div>

            <div className="flex gap-4">
              <div className="join">
                <button
                  className={`btn join-item ${chartMode === "amount" ? "btn-active" : ""}`}
                  onClick={() => setChartMode("amount")}
                >
                  Amount
                </button>
                <button
                  className={`btn join-item ${chartMode === "count" ? "btn-active" : ""}`}
                  onClick={() => setChartMode("count")}
                >
                  Count
                </button>
              </div>
              <div className="join">
                <button
                  className={`btn join-item ${scaleType === "linear" ? "btn-active" : ""}`}
                  onClick={() => setScaleType("linear")}
                >
                  Linear
                </button>
                <button
                  className={`btn join-item ${scaleType === "logarithmic" ? "btn-active" : ""}`}
                  onClick={() => setScaleType("logarithmic")}
                >
                  Log
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {chartData ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div className="text-center">No zap data available</div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            {loading ? (
              <span className="loading loading-dots loading-xl"></span>
            ) : (
              <button className="btn btn-primary" onClick={loadMore} disabled={!loader}>
                Load more
              </button>
            )}
          </div>

          <div className="text-center text-sm text-gray-500">Loaded {zaps?.length ?? 0} zaps</div>
        </div>
      ) : (
        <div className="alert alert-info">Please enter a pubkey to view zap activity</div>
      )}
    </div>
  );
}
