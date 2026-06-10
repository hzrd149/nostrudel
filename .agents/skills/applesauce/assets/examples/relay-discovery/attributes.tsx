/**
 * Discover and display relay attributes and metadata
 * @tags nip-66, relay-discovery, attributes, metadata
 * @related relay-discovery/contacts-relays, relay-discovery/monitor-feed
 */
import {
  getRelayDiscoveryAttributes,
  getRelayDiscoveryURL,
  isValidRelayDiscovery,
  RELAY_DISCOVERY_KIND,
} from "applesauce-common/helpers";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { Filter, NostrEvent } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { CategoryScale, Chart as ChartJS, LinearScale, Title, Tooltip } from "chart.js";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { useThrottle } from "react-use";
import { of } from "rxjs";

import RelayPicker, { COMMON_RELAYS } from "../../components/relay-picker";

// Register ChartJS components
ChartJS.register(WordCloudController, WordElement, CategoryScale, LinearScale, Title, Tooltip);

// Create stores and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

interface AttributeData {
  attribute: string;
  relayCount: number;
}

interface WordCloudDataPoint {
  key: string;
  value: number;
}

interface RelayData {
  url: string;
  attributes: string[];
}

/**
 * Counts the number of unique relays that have each attribute
 */
function countRelaysPerAttribute(events: NostrEvent[]): AttributeData[] {
  // Map of relay URL -> set of attributes
  const relayAttributes = new Map<string, Set<string>>();

  // Process each event
  for (const event of events) {
    if (!isValidRelayDiscovery(event)) continue;

    const relayUrl = getRelayDiscoveryURL(event);
    if (!relayUrl) continue;

    const attributes = getRelayDiscoveryAttributes(event);
    if (attributes.length === 0) continue;

    // Get or create the set of attributes for this relay
    if (!relayAttributes.has(relayUrl)) {
      relayAttributes.set(relayUrl, new Set());
    }

    // Add all attributes for this relay
    const attributeSet = relayAttributes.get(relayUrl)!;
    for (const attr of attributes) {
      attributeSet.add(attr);
    }
  }

  // Count how many relays have each attribute
  const attributeCounts = new Map<string, number>();

  for (const [_, attributes] of relayAttributes.entries()) {
    for (const attr of attributes) {
      attributeCounts.set(attr, (attributeCounts.get(attr) || 0) + 1);
    }
  }

  // Convert to array and sort by count (descending)
  return Array.from(attributeCounts.entries())
    .map(([attribute, relayCount]) => ({ attribute, relayCount }))
    .sort((a, b) => b.relayCount - a.relayCount);
}

/**
 * Converts attribute data to word cloud format
 */
function prepareWordCloudData(attributeData: AttributeData[]): WordCloudDataPoint[] {
  return attributeData.map((data) => ({
    key: data.attribute,
    value: data.relayCount,
  }));
}

/**
 * Extracts relay data with their attributes
 */
function extractRelayData(events: NostrEvent[]): RelayData[] {
  // Map of relay URL -> set of attributes
  const relayAttributes = new Map<string, Set<string>>();

  // Process each event
  for (const event of events) {
    if (!isValidRelayDiscovery(event)) continue;

    const relayUrl = getRelayDiscoveryURL(event);
    if (!relayUrl) continue;

    const attributes = getRelayDiscoveryAttributes(event);
    if (attributes.length === 0) continue;

    // Get or create the set of attributes for this relay
    if (!relayAttributes.has(relayUrl)) {
      relayAttributes.set(relayUrl, new Set());
    }

    // Add all attributes for this relay
    const attributeSet = relayAttributes.get(relayUrl)!;
    for (const attr of attributes) {
      attributeSet.add(attr);
    }
  }

  // Convert to array and sort by URL
  return Array.from(relayAttributes.entries())
    .map(([url, attributes]) => ({
      url,
      attributes: Array.from(attributes).sort(),
    }))
    .sort((a, b) => a.url.localeCompare(b.url));
}

export default function RelayDiscoveryAttributes() {
  const [relayUrl, setRelayUrl] = useState<string>("wss://relay.nostr.watch/");
  const [attributeInput, setAttributeInput] = useState<string>("");
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container dimensions and update on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Get relay instance and check NIP-91 support
  const relay = useMemo(() => (relayUrl ? pool.relay(relayUrl) : null), [relayUrl]);
  const supportedNips = use$(() => relay?.supported$ ?? of(null), [relay]);
  const supportsNip91 = supportedNips?.includes(91) ?? false;

  // Parse attributes from input (split by space/comma and filter empty)
  const attributeFilters = useMemo(() => {
    return attributeInput
      .split(/[\s,]+/)
      .map((a) => a)
      .filter((a) => a.length > 0);
  }, [attributeInput]);

  const attributes = useThrottle(attributeFilters, 1000);

  // Create filter for relay subscription
  const relayFilter: Filter = useMemo(() => {
    const base: Filter = {
      authors: ["9bbbb845e5b6c831c29789900769843ab43bb5047abe697870cb50b6fc9bf923"],
      kinds: [RELAY_DISCOVERY_KIND],
      limit: 1000, // Load many events to get comprehensive data
    };

    if (attributes.length > 0) {
      if (supportsNip91) {
        base["&W"] = attributes;
      } else {
        // fallback to OR filtering
        base["#W"] = attributes;
      }
    }

    return base;
  }, [attributes, supportsNip91, relay]);

  // Subscribe to events from relay
  use$(
    () => (relay ? relay.subscription(relayFilter).pipe(mapEventsToStore(eventStore)) : undefined),
    [relay, relayFilter],
  );

  // Get events from the event store so & tags always work
  const events = use$(
    () =>
      eventStore.timeline(
        attributes.length > 0
          ? {
              kinds: [RELAY_DISCOVERY_KIND],
              "&W": attributes,
            }
          : {
              kinds: [RELAY_DISCOVERY_KIND],
            },
      ),
    [attributes],
  );

  // Count relays per attribute
  const attributeData = useMemo(() => {
    if (!events || events.length === 0) return [];
    return countRelaysPerAttribute(events);
  }, [events]);

  // Get all unique attributes for buttons
  const allAttributes = useMemo(() => {
    if (!events || events.length === 0) return [];
    const attributeSet = new Set<string>();
    for (const event of events) {
      if (!isValidRelayDiscovery(event)) continue;
      const attrs = getRelayDiscoveryAttributes(event);
      for (const attr of attrs) attributeSet.add(attr);
    }
    return Array.from(attributeSet).sort();
  }, [events]);

  // Prepare word cloud data
  const wordCloudData = useMemo(() => {
    const points = prepareWordCloudData(attributeData);
    if (points.length === 0) return null;

    return {
      labels: points.map((p) => p.key),
      datasets: [
        {
          label: "Relay Attributes",
          data: points.map((p) => p.value),
        },
      ],
    };
  }, [attributeData]);

  const chartOptions = useMemo(() => {
    const dataSize = attributeData.length;
    const maxValue = Math.max(...attributeData.map((d) => d.relayCount), 1);

    // Scale font sizes based on container dimensions, dataset size, and density
    const containerArea = containerDimensions.width * containerDimensions.height;
    const density = dataSize > 0 ? containerArea / dataSize : containerArea;

    // Calculate base font size from available space per word
    const baseFontSize = Math.max(16, Math.min(120, Math.sqrt(density) * 0.15));
    const minFontSize = Math.max(10, baseFontSize * 0.4);
    const maxFontSize = Math.min(baseFontSize * 3, containerDimensions.height * 0.15);

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Relay Attributes (size = number of relays)",
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || "";
              const value = context.parsed || context.raw;
              return `${label}: ${value} relays`;
            },
          },
        },
        legend: {
          display: false,
        },
      },
      // Word cloud specific options
      elements: {
        word: {
          size: (ctx: any) => {
            const value = ctx.raw || 0;
            const normalized = value / maxValue;
            return minFontSize + (maxFontSize - minFontSize) * normalized;
          },
          color: () => {
            const colors = [
              "rgba(54, 162, 235, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
              "rgba(255, 159, 64, 0.8)",
              "rgba(255, 99, 132, 0.8)",
            ];
            return colors[Math.floor(Math.random() * colors.length)];
          },
          hoverColor: "rgba(255, 99, 132, 1)",
        },
      },
    };
  }, [attributeData, containerDimensions]);

  // Count total unique relays
  const totalRelays = useMemo(() => {
    if (!events || events.length === 0) return 0;
    const relaySet = new Set<string>();
    for (const event of events) {
      if (!isValidRelayDiscovery(event)) continue;
      const relayUrl = getRelayDiscoveryURL(event);
      if (relayUrl) relaySet.add(relayUrl);
    }
    return relaySet.size;
  }, [events]);

  // Extract relay data with attributes
  const relayData = useMemo(() => {
    if (!events || events.length === 0) return [];
    return extractRelayData(events);
  }, [events]);

  // Handle attribute button click - add to input
  const handleAttributeClick = (attribute: string) => {
    if (!attributeInput.includes(attribute)) {
      setAttributeInput((prev) => (prev.trim() ? `${prev.trim()} ${attribute}` : attribute));
    }
  };

  return (
    <div className="container mx-auto p-2 h-full">
      <div className="flex gap-2 justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Relay Discovery Attributes</h1>
        <RelayPicker value={relayUrl} onChange={setRelayUrl} common={["wss://relay.nostr.watch/", ...COMMON_RELAYS]} />
      </div>

      <Nip91Warning relayUrl={relayUrl} supportsNip91={supportsNip91} supportedNips={supportedNips} />

      <AttributeFilterInput
        attributeInput={attributeInput}
        setAttributeInput={setAttributeInput}
        attributeFilters={attributeFilters}
      />

      {allAttributes.length > 0 && (
        <AttributeButtons
          allAttributes={allAttributes}
          attributeFilters={attributeFilters}
          onAttributeClick={handleAttributeClick}
        />
      )}

      <StatsDisplay relayUrl={relayUrl} totalRelays={totalRelays} eventCount={events?.length || 0} />

      <WordCloudChart
        relayUrl={relayUrl}
        wordCloudData={wordCloudData}
        chartOptions={chartOptions}
        containerRef={containerRef}
      />

      {relayUrl && relayData.length > 0 && (
        <RelaysTable relayData={relayData} onAttributeClick={handleAttributeClick} />
      )}
    </div>
  );
}

// Component: NIP-91 Warning
interface Nip91WarningProps {
  relayUrl: string | null;
  supportsNip91: boolean;
  supportedNips: number[] | null | undefined;
}

function Nip91Warning({ relayUrl, supportsNip91, supportedNips }: Nip91WarningProps) {
  if (!relayUrl || supportsNip91 || supportedNips === null) return null;

  return (
    <div className="alert alert-warning mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>
        This relay does not support NIP-91 (AND tag filters). Multiple attribute filtering may not work as expected.
      </span>
    </div>
  );
}

// Component: Attribute Filter Input
interface AttributeFilterInputProps {
  attributeInput: string;
  setAttributeInput: (value: string) => void;
  attributeFilters: string[];
}

function AttributeFilterInput({ attributeInput, setAttributeInput, attributeFilters }: AttributeFilterInputProps) {
  return (
    <div className="mb-4">
      <label className="label">
        <span className="label-text">Filter by attributes (space or comma separated)</span>
      </label>
      <input
        type="text"
        placeholder="attribute1 attribute2"
        className="input input-bordered w-full"
        value={attributeInput}
        onChange={(e) => setAttributeInput(e.target.value)}
      />
      {attributeFilters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {attributeFilters.map((attr) => (
            <span key={attr} className="badge badge-primary">
              {attr}
              <button
                className="ml-1 hover:font-bold"
                onClick={() => {
                  const newFilters = attributeFilters.filter((a) => a !== attr);
                  setAttributeInput(newFilters.join(" "));
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Component: Attribute Buttons
interface AttributeButtonsProps {
  allAttributes: string[];
  attributeFilters: string[];
  onAttributeClick: (attribute: string) => void;
}

function AttributeButtons({ allAttributes, attributeFilters, onAttributeClick }: AttributeButtonsProps) {
  return (
    <div className="mb-4">
      <label className="label">
        <span className="label-text">Available attributes (click to add)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {allAttributes.map((attr) => (
          <button
            key={attr}
            className="btn btn-sm btn-outline"
            onClick={() => onAttributeClick(attr)}
            disabled={attributeFilters.includes(attr)}
          >
            {attr}
          </button>
        ))}
      </div>
    </div>
  );
}

// Component: Stats Display
interface StatsDisplayProps {
  relayUrl: string | null;
  totalRelays: number;
  eventCount: number;
}

function StatsDisplay({ relayUrl, totalRelays, eventCount }: StatsDisplayProps) {
  if (!relayUrl) return null;

  return (
    <div className="mb-4 text-sm text-base-content/70">
      Found {totalRelays} unique relays from {eventCount} NIP-66 reports
    </div>
  );
}

// Component: Word Cloud Chart
interface WordCloudChartProps {
  relayUrl: string | null;
  wordCloudData: { labels: string[]; datasets: Array<{ label: string; data: number[] }> } | null;
  chartOptions: any;
  containerRef: React.RefObject<HTMLDivElement>;
}

function WordCloudChart({ relayUrl, wordCloudData, chartOptions, containerRef }: WordCloudChartProps) {
  if (!relayUrl) {
    return (
      <div className="text-center text-base-content/70 py-8">
        Please select a relay to start exploring relay attributes.
      </div>
    );
  }

  if (!wordCloudData) {
    return (
      <div className="text-center text-base-content/70 py-8">
        No relay discovery events found. Try selecting a different relay.
      </div>
    );
  }

  return (
    <div className="card bg-base-100 mb-4">
      <div className="card-body">
        <div ref={containerRef} style={{ height: "600px" }}>
          <Chart type="wordCloud" data={wordCloudData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

// Component: Relays Table
interface RelaysTableProps {
  relayData: RelayData[];
  onAttributeClick: (attribute: string) => void;
}

function RelaysTable({ relayData, onAttributeClick }: RelaysTableProps) {
  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <h2 className="text-xl font-bold mb-4">Relays ({relayData.length})</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Relay URL</th>
                <th>Attributes</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {relayData.map((relay) => (
                <tr key={relay.url}>
                  <td>
                    <code className="text-sm">{relay.url}</code>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {relay.attributes.map((attr) => (
                        <span
                          key={attr}
                          className="badge badge-outline cursor-pointer hover:badge-primary"
                          onClick={() => onAttributeClick(attr)}
                        >
                          {attr}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{relay.attributes.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
