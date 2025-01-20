import { useEffect, useMemo } from "react";
import { ButtonGroup, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import EventKindsPieChart from "../../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../../components/charts/event-kinds-table";
import ImportEventsButton from "./components/import-events-button";
import ExportEventsButton from "./components/export-events-button";
import MemoryRelay from "../../../../classes/memory-relay";
import { getSortedKinds } from "../../../../helpers/nostr/event";
import useForceUpdate from "../../../../hooks/use-force-update";
import { cacheRelay$ } from "../../../../services/cache-relay";

export default function MemoryDatabasePage() {
  const cacheRelay = useObservable(cacheRelay$);
  const update = useForceUpdate();

  useEffect(() => {
    if (cacheRelay instanceof MemoryRelay) {
      const sub = cacheRelay.store.database.inserted.subscribe(update);
      return () => sub.unsubscribe();
    }
  }, []);

  const importEvents = async (events: NostrEvent[]) => {
    for (const event of events) {
      cacheRelay?.publish(event);
    }
  };
  const exportEvents = async () => {
    if (cacheRelay instanceof MemoryRelay) {
      return Array.from(cacheRelay.store.database.iterateTime(0, Infinity));
    }
    return [];
  };

  const count = useMemo(() => {
    if (cacheRelay instanceof MemoryRelay) return cacheRelay.store.database.events.size;
    return 0;
  }, [update]);

  const kinds = useMemo(() => {
    if (cacheRelay instanceof MemoryRelay) {
      return getSortedKinds(Array.from(cacheRelay.store.database.iterateTime(0, Infinity)));
    }
    return {};
  }, [update]);

  return (
    <>
      <Text>Total events: {count ?? "Loading..."}</Text>
      <ButtonGroup flexWrap="wrap">
        <ImportEventsButton onLoad={importEvents} />
        <ExportEventsButton getEvents={exportEvents} />
      </ButtonGroup>
      <Flex gap="2" wrap="wrap" alignItems="flex-start" w="full">
        {kinds && (
          <>
            <Card p="2" minW="sm" maxW="lg" flex={1}>
              <Heading size="sm">Events by kind</Heading>
              <EventKindsPieChart kinds={kinds} />
            </Card>
            <Card p="2" minW="sm" maxW="md" flex={1}>
              <EventKindsTable kinds={kinds} />
            </Card>
          </>
        )}
      </Flex>
    </>
  );
}
