import { Box, Button, Card, Flex, Heading, Text } from "@chakra-ui/react";

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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EventKindsPieChart from "../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../components/charts/event-kinds-table";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { getSortedKinds } from "../../../helpers/nostr/event";
import { useAppTitle } from "../../../hooks/use-app-title";
import useForceUpdate from "../../../hooks/use-force-update";
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

  const update = useForceUpdate();
  const events = useRef(new Map());

  const [loading, setLoading] = useState(false);
  const loader = useMemo(() => createTimelineLoader(pool, [relay], [{}], { limit: 500, eventStore }), [relay]);

  const loadMore = useCallback(() => {
    setLoading(true);
    loader().subscribe({
      next: (event) => {
        events.current.set(event.id, event);
      },
      complete: () => {
        setLoading(false);
        update();
      },
    });
  }, [loader]);

  // load first batch when mounted
  useEffect(() => {
    loadMore();
  }, [loadMore]);

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
        <Card p="2">
          <Heading size="sm">Events by kind</Heading>
          <Box maxH="50vh">
            <EventKindsPieChart kinds={kinds} />
          </Box>
        </Card>
        <Card p="2" minW="xs">
          <EventKindsTable kinds={kinds} />
        </Card>
      </Flex>
    </VerticalPageLayout>
  );
}
