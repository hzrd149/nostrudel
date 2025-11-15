import { useMemo } from "react";
import { useColorModeValue, useTheme } from "@chakra-ui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,
  ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getSeenRelays, isFromCache } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Colors);

export type RelayDistributionChartProps = {
  events: NostrEvent[];
  title?: string;
};

export default function RelayDistributionChart({ events, title = "Events from relays" }: RelayDistributionChartProps) {
  const theme = useTheme();
  const token = theme.semanticTokens.colors["chakra-body-text"];
  const color = useColorModeValue(token._light, token._dark) as string;

  const chartData = useMemo(() => {
    const relayCount: Record<string, number> = {};
    let cacheCount = 0;

    // Process events to count messages per relay and cache
    if (events) {
      events.forEach((event) => {
        if (isFromCache(event)) cacheCount++;

        // Also check relay sources (an event can be from cache AND have relay info)
        const seenRelays = getSeenRelays(event);
        if (seenRelays) {
          seenRelays.forEach((relay) => {
            relayCount[relay] = (relayCount[relay] || 0) + 1;
          });
        }
      });
    }

    // Sort relays by count (descending)
    const sortedRelays = Object.entries(relayCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Limit to top 10 relays to keep chart readable

    // Create chart data
    const labels = [...sortedRelays.map(([relay]) => relay)];
    const data = [...sortedRelays.map(([, count]) => count)];

    // Add cache data if there are cached messages
    if (cacheCount > 0) {
      labels.push("Cache");
      data.push(cacheCount);
    }

    const chartData: ChartData<"bar", number[], string> = {
      labels,
      datasets: [
        {
          label: "Events",
          data,
        },
      ],
    };

    return chartData;
  }, [events]);

  return (
    <Bar
      data={chartData}
      options={{
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        color,
        plugins: {
          colors: {
            enabled: true,
            forceOverride: true,
          },
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: `${title} (${events.length} total)`,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      }}
    />
  );
}
