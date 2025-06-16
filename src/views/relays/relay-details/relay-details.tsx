import { Button, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { unixNow } from "applesauce-core/helpers";

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

import { createTimelineLoader } from "applesauce-loaders/loaders";
import { useCallback, useEffect, useMemo, useRef } from "react";
import EventKindsPieChart from "../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../components/charts/event-kinds-table";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { getSortedKinds } from "../../../helpers/nostr/event";
import { useAppTitle } from "../../../hooks/use-app-title";
import { eventStore } from "../../../services/event-store";
import pool from "../../../services/pool";

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

  const loader = useMemo(() => createTimelineLoader(pool, [relay], [{}], { limit: 500, eventStore }), [relay]);

  // load first batch when mounted
  useEffect(() => {
    loader().subscribe((event) => {
      events.current.set(event.id, event);
      last.current = event.created_at;
    });
  }, [loader]);

  const loadMore = useCallback(() => {
    loader().subscribe((event) => {
      events.current.set(event.id, event);
      last.current = event.created_at;
    });
  }, [loader]);

  const kinds = getSortedKinds(Array.from(events.current.values()));

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <Text>Events loaded: {events.current.size}</Text>
        <Button size="sm" onClick={loadMore}>
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
