import { useEffect, useMemo, useState } from "react";
import { Button, ButtonGroup, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { localRelay } from "../../../../services/local-relay";
import EventKindsPieChart from "../../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../../components/charts/event-kinds-table";
import ImportEventsButton from "./components/import-events-button";
import ExportEventsButton from "./components/export-events-button";
import MemoryRelay from "../../../../classes/memory-relay";
import { getSortedKinds } from "../../../../helpers/nostr/event";

async function importEvents(events: NostrEvent[]) {
  for (const event of events) {
    localRelay?.publish(event);
  }
}
async function exportEvents() {
  if (localRelay instanceof MemoryRelay) {
    return localRelay.events.getSortedEvents();
  }
  return [];
}

export default function MemoryDatabasePage() {
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    if (localRelay instanceof MemoryRelay) {
      const sub = localRelay.events.onEvent.subscribe((e) => setUpdate((v) => v + 1));
      return () => sub.unsubscribe();
    }
  }, []);

  const count = useMemo(() => {
    if (localRelay instanceof MemoryRelay) return localRelay.events.events.size;
    return 0;
  }, [update]);

  const kinds = useMemo(() => {
    if (localRelay instanceof MemoryRelay) {
      return getSortedKinds(Array.from(localRelay.events.events.values()));
    }
    return {};
  }, [update]);

  const handleClearData = async () => {
    if (localRelay instanceof MemoryRelay) {
      localRelay.events.clear();
      setUpdate(-1);
    }
  };

  return (
    <>
      <Text>Total events: {count ?? "Loading..."}</Text>
      <ButtonGroup flexWrap="wrap">
        <ImportEventsButton onLoad={importEvents} />
        <ExportEventsButton getEvents={exportEvents} />
      </ButtonGroup>
      <ButtonGroup flexWrap="wrap">
        <Button onClick={handleClearData} colorScheme="primary" variant="outline">
          Clear cache
        </Button>
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
