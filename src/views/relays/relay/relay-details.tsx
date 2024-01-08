import { Button, Card, Flex, Heading, Text, useColorModeValue, useForceUpdate, useTheme } from "@chakra-ui/react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  Colors,
  Title,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import dayjs from "dayjs";
import _throttle from "lodash.throttle";

import { useAppTitle } from "../../../hooks/use-app-title";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { NostrEvent } from "../../../types/nostr-event";
import { groupByTime } from "../../../helpers/notification";
import { useEffect, useMemo } from "react";
import EventStore from "../../../classes/event-store";
import NostrRequest from "../../../classes/nostr-request";
import { sortByDate } from "../../../helpers/nostr/events";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Colors,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
);

function buildPieChartData(events: NostrEvent[]) {
  const countByKind: Record<number, number> = {};

  for (const event of events) {
    if (countByKind[event.kind] === undefined) countByKind[event.kind] = 0;
    countByKind[event.kind]++;
  }

  const sortedKinds = Object.entries(countByKind)
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  const data: ChartData<"pie", number[], string> = {
    labels: sortedKinds.map(({ kind }) => String(kind)),
    datasets: [{ label: "# of events", data: sortedKinds.map(({ count }) => count) }],
  };

  return data;
}
function buildLineChartData(events: NostrEvent[], timeBlock = 60 * 60): ChartData<"line", number[], string> {
  let minDate = Infinity;
  let maxDate = -Infinity;

  const byKind: Record<number, NostrEvent[]> = {};
  for (const event of events) {
    byKind[event.kind] = byKind[event.kind] || [];
    byKind[event.kind].push(event);

    if (event.created_at < minDate) minDate = Math.floor(event.created_at / timeBlock) * timeBlock;
    if (event.created_at > maxDate) maxDate = Math.ceil(event.created_at / timeBlock) * timeBlock;
  }

  if (minDate === Infinity || maxDate === -Infinity) return { labels: [], datasets: [] };

  const byKindAndDate: Record<string, Record<number, NostrEvent[]>> = {};
  for (const [kind, eventsByKind] of Object.entries(byKind)) {
    const byTime: Record<number, NostrEvent[]> = groupByTime(eventsByKind, timeBlock).reduce(
      (dir, group) => ({ ...dir, [group[0]]: group[1] }),
      {},
    );
    for (let i = minDate; i < maxDate; i += timeBlock) {
      if (!byTime[i]) byTime[i] = [];
    }
    byKindAndDate[kind] = byTime;
  }

  const sorted = Object.entries(byKindAndDate)
    .map(([kind, data]) => ({ kind: parseInt(kind), data }))
    .sort((a, b) => b.kind - a.kind);

  return {
    labels: Array((maxDate - minDate) / timeBlock).fill(""),
    datasets: sorted.map(({ data, kind }) => ({
      label: String(kind),
      data: Object.entries(data)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .map((d) => d[1].length),
    })),
  };
}

export default function RelayDetailsTab({ relay }: { relay: string }) {
  useAppTitle(`${relay} - Details`);

  const theme = useTheme();
  const token = theme.semanticTokens.colors["chakra-body-text"];
  const color = useColorModeValue(token._light, token._dark) as string;

  const update = useForceUpdate();
  const store = useMemo(() => new EventStore(), []);

  useEffect(() => {
    const request = new NostrRequest([relay]);
    request.onEvent.subscribe(store.addEvent, store);
    const throttle = _throttle(update, 100);
    request.onEvent.subscribe(() => throttle());
    request.start({ limit: 500 });
  }, [relay, update]);

  const events = Array.from(store.events.values()).sort(sortByDate);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <Text>Events loaded: {events.length}</Text>
      </Flex>
      <Flex wrap="wrap" gap="4">
        <Card p="2" maxW="sm">
          <Heading size="sm">Events by kind</Heading>
          <Pie
            data={buildPieChartData(events)}
            options={{
              color,
            }}
          />
        </Card>
        <Card p="2" w="full" aspectRatio={16 / 9}>
          <Heading size="sm">Event kinds over time</Heading>
          <Line data={buildLineChartData(events)} options={{ color, responsive: true }} />
        </Card>
      </Flex>
    </VerticalPageLayout>
  );
}
