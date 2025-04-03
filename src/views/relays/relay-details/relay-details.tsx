import { Button, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { unixNow } from "applesauce-core/helpers";
import { RelayTimelineLoader } from "applesauce-loaders";
import { useObservable } from "applesauce-react/hooks";

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

import { useAppTitle } from "../../../hooks/use-app-title";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { NostrEvent } from "../../../types/nostr-event";
import { groupByTime } from "../../../helpers/notification";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getSortedKinds } from "../../../helpers/nostr/event";
import EventKindsPieChart from "../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../components/charts/event-kinds-table";
import { eventStore } from "../../../services/event-store";
import { nostrRequest } from "../../../services/rx-nostr";

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

  const last = useRef(unixNow());
  const events = useRef(new Map());

  const loader = useMemo(() => new RelayTimelineLoader(nostrRequest, relay, [{}], { limit: 500 }), [relay]);

  // start the loader
  useEffect(() => {
    const sub = loader.subscribe((event) => {
      events.current.set(event.id, event);
      last.current = event.created_at;

      eventStore.add(event);
    });

    return () => sub.unsubscribe();
  }, [loader]);

  // load first batch when mounted
  useEffect(() => loader.next(), [loader]);

  const loadMore = useCallback(() => {
    loader.next(-Infinity);
  }, [loader]);

  const loading = useObservable(loader.loading$);
  const kinds = getSortedKinds(Array.from(events.current.values()));

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <Text>Events loaded: {events.current.size}</Text>
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
      </Flex>
    </VerticalPageLayout>
  );
}
