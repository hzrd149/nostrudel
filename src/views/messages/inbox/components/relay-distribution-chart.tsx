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
import { GiftWrapsModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Colors);

export default function RelayDistributionChart() {
  const account = useActiveAccount()!;
  const events = useEventModel(GiftWrapsModel, [account.pubkey]);
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
          label: "Messages",
          data,
        },
      ],
    };

    return chartData;
  }, [events]);

  // Show message if no data to display
  if (!events || events.length === 0) {
    return <div>No messages to display</div>;
  }

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
            text: "Messages from inboxes",
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
