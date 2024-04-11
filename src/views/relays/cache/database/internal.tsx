import { useState } from "react";
import { addEvents, countEvents, countEventsByKind, getEventUID, updateUsed } from "nostr-idb";
import { Button, ButtonGroup, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { useAsync } from "react-use";
import { NostrEvent } from "nostr-tools";

import { localDatabase, localRelay } from "../../../../services/local-relay";
import EventKindsPieChart from "../../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../../components/charts/event-kinds-table";
import ImportEventsButton from "./components/import-events-button";
import ExportEventsButton from "./components/export-events-button";
import { clearCacheData, deleteDatabase } from "../../../../services/db";

async function importEvents(events: NostrEvent[]) {
  await addEvents(localDatabase, events);
  await updateUsed(
    localDatabase,
    events.map((e) => getEventUID(e)),
  );
}
async function exportEvents() {
  return (await localDatabase.getAll("events")).map((row) => row.event);
}

export default function InternalDatabasePage() {
  const { value: count } = useAsync(async () => await countEvents(localDatabase), []);
  const { value: kinds } = useAsync(async () => await countEventsByKind(localDatabase), []);

  const [clearing, setClearing] = useState(false);
  const handleClearData = async () => {
    setClearing(true);
    await clearCacheData();
    setClearing(false);
  };

  const [deleting, setDeleting] = useState(false);
  const handleDeleteDatabase = async () => {
    setDeleting(true);
    await deleteDatabase();
    setDeleting(false);
  };

  return (
    <>
      <Text>Total events: {count ?? "Loading..."}</Text>
      <ButtonGroup flexWrap="wrap">
        <ImportEventsButton onLoad={importEvents} />
        <ExportEventsButton getEvents={exportEvents} />
      </ButtonGroup>
      <ButtonGroup flexWrap="wrap">
        <Button onClick={handleClearData} isLoading={clearing} colorScheme="primary" variant="outline">
          Clear cache
        </Button>
        <Button colorScheme="red" onClick={handleDeleteDatabase} isLoading={deleting}>
          Delete database
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
