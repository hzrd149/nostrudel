import {
  Button,
  Card,
  Flex,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useTheme,
} from "@chakra-ui/react";

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
import { Pie } from "react-chartjs-2";
import _throttle from "lodash.throttle";

import { useAppTitle } from "../../../hooks/use-app-title";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { NostrEvent } from "../../../types/nostr-event";
import { groupByTime } from "../../../helpers/notification";
import { useCallback, useEffect, useMemo, useState } from "react";
import EventStore from "../../../classes/event-store";
import NostrRequest from "../../../classes/nostr-request";
import { sortByDate } from "../../../helpers/nostr/event";
import { NostrQuery } from "../../../types/nostr-relay";

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

function getMinMaxTime(events: NostrEvent[], timeBlock = 60 * 60) {
  let minDate = Infinity;
  let maxDate = -Infinity;

  for (const event of events) {
    if (event.created_at < minDate) minDate = Math.floor(event.created_at / timeBlock) * timeBlock;
    if (event.created_at > maxDate) maxDate = Math.ceil(event.created_at / timeBlock) * timeBlock;
  }

  return { minDate, maxDate };
}

function groupByKind(events: NostrEvent[]) {
  const byKind: Record<number, NostrEvent[]> = {};
  for (const event of events) {
    byKind[event.kind] = byKind[event.kind] || [];
    byKind[event.kind].push(event);
  }
  return byKind;
}

function buildPieChartData(events: NostrEvent[]) {
  const byKind = groupByKind(events);

  const sortedKinds = Object.entries(byKind)
    .map(([kind, events]) => ({ kind, count: events.length }))
    .sort((a, b) => b.count - a.count);

  const data: ChartData<"pie", number[], string> = {
    labels: sortedKinds.map(({ kind }) => String(kind)),
    datasets: [{ label: "# of events", data: sortedKinds.map(({ count }) => count) }],
  };

  return data;
}
function buildTableData(events: NostrEvent[]) {
  const byKind = groupByKind(events);

  const sortedKinds = Object.entries(byKind)
    .map(([kind, events]) => ({ kind, count: events.length }))
    .sort((a, b) => b.count - a.count);

  return sortedKinds;
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

  const [_, update] = useState<Object>();
  const store = useMemo(() => new EventStore(), []);

  const [loading, setLoading] = useState(false);
  const loadMore = useCallback(() => {
    setLoading(true);
    const request = new NostrRequest([relay]);
    const throttle = _throttle(() => update({}), 100);
    request.onEvent.subscribe((e) => {
      store.addEvent(e);
      throttle();
    });
    request.onComplete.then(() => setLoading(false));

    const query: NostrQuery = { limit: 500 };
    const last = store.getLastEvent();
    if (last) query.until = last.created_at;
    request.start(query);
  }, [relay, update, store]);

  useEffect(() => loadMore(), [relay, loadMore]);

  const events = Array.from(store.events.values()).sort(sortByDate);

  const pieChartData = buildPieChartData(events);
  const tableData = buildTableData(events);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <Text>Events loaded: {events.length}</Text>
        <Button size="sm" onClick={loadMore} isLoading={loading}>
          Load more
        </Button>
      </Flex>
      <Flex wrap="wrap" gap="4" alignItems="flex-start">
        <Card p="2" w="50%">
          <Heading size="sm">Events by kind</Heading>
          <Pie
            data={pieChartData}
            options={{
              color,
              plugins: { colors: { forceOverride: true } },
            }}
          />
        </Card>
        <Card p="2" minW="xs">
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th isNumeric>Kind</Th>
                  <Th isNumeric>Count</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tableData.map(({ kind, count }) => (
                  <Tr key={kind}>
                    <Td isNumeric>{kind}</Td>
                    <Td isNumeric>{count}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Card>
        {/* <Card p="2" w="full" aspectRatio={16 / 9}>
          <Heading size="sm">Event kinds over time</Heading>
          <Line
            data={buildLineChartData(events, 60)}
            options={{ color, responsive: true, plugins: { colors: { forceOverride: true } } }}
          />
        </Card> */}
      </Flex>
    </VerticalPageLayout>
  );
}
