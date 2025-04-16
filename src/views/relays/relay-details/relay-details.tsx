import { Button, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { unixNow } from "applesauce-core/helpers";
import { RelayTimelineLoader } from "applesauce-loaders";
import { useObservable } from "applesauce-react/hooks";

import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Colors,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

import { useCallback, useEffect, useMemo, useRef } from "react";
import EventKindsPieChart from "../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../components/charts/event-kinds-table";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { getSortedKinds } from "../../../helpers/nostr/event";
import { useAppTitle } from "../../../hooks/use-app-title";
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
