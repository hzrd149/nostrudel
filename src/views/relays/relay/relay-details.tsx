import { Button, Card, Flex, Heading, Text, useColorModeValue, useTheme, useToast } from "@chakra-ui/react";

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
import { Filter } from "nostr-tools";
import _throttle from "lodash.throttle";

import { useAppTitle } from "../../../hooks/use-app-title";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { NostrEvent } from "../../../types/nostr-event";
import { groupByTime } from "../../../helpers/notification";
import { useCallback, useEffect, useMemo, useState } from "react";
import EventStore from "../../../classes/event-store";
import { getSortedKinds, sortByDate } from "../../../helpers/nostr/event";
import relayPoolService from "../../../services/relay-pool";
import EventKindsPieChart from "../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../components/charts/event-kinds-table";

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

  const toast = useToast();
  const theme = useTheme();
  const token = theme.semanticTokens.colors["chakra-body-text"];
  const color = useColorModeValue(token._light, token._dark) as string;

  const [_, update] = useState<Object>();
  const store = useMemo(() => new EventStore(), []);

  const [loading, setLoading] = useState(false);
  const loadMore = useCallback(() => {
    setLoading(true);
    const query: Filter = { limit: 500 };
    const last = store.getLastEvent();
    if (last) query.until = last.created_at;

    const throttleUpdate = _throttle(() => update({}), 100);
    const sub = relayPoolService.requestRelay(relay).subscribe([query], {
      onevent: (event) => {
        store.addEvent(event);
        throttleUpdate();
      },
      oneose: () => sub.close(),
      onclose: (reason) => {
        if (reason !== "closed by caller") toast({ status: "error", description: reason });
        setLoading(false);
      },
    });
  }, [relay, update, store]);

  useEffect(() => loadMore(), [relay, loadMore]);

  const events = Array.from(store.events.values()).sort(sortByDate);

  const kinds = getSortedKinds(events);

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
          <EventKindsPieChart kinds={kinds} />
        </Card>
        <Card p="2" minW="xs">
          <EventKindsTable kinds={kinds} />
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
