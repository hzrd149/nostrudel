import {
  Button,
  ButtonGroup,
  Card,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { addEvents, countEvents, countEventsByKind, getEventUID, updateUsed } from "nostr-idb";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";
import { useAsync } from "react-use";

import EventKindsPieChart from "../../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../../components/charts/event-kinds-table";
import { clearCacheData, deleteDatabase } from "../../../../services/database";
import localSettings from "../../../../services/preferences";
import ExportEventsButton from "./components/export-events-button";
import ImportEventsButton from "./components/import-events-button";

async function getDatabase() {
  const { database } = await import("../../../../services/event-cache/nostr-idb");
  return database;
}

async function importEvents(events: NostrEvent[]) {
  const database = await getDatabase();
  await addEvents(database, events);
  await updateUsed(
    database,
    events.map((e) => getEventUID(e)),
  );
}
async function exportEvents() {
  const database = await getDatabase();

  return (await database.getAll("events")).map((row) => row.event);
}

export default function InternalDatabasePage() {
  const { value: count } = useAsync(async () => {
    const database = await getDatabase();
    return await countEvents(database);
  }, []);
  const { value: kinds } = useAsync(async () => {
    const database = await getDatabase();
    return await countEventsByKind(database);
  }, []);

  const maxEvents = useObservableEagerState(localSettings.idbMaxEvents);

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
      <FormControl>
        <FormLabel>Maximum number of events</FormLabel>
        <NumberInput
          maxW="xs"
          value={maxEvents}
          onChange={(s, v) => {
            if (Number.isFinite(v)) localSettings.idbMaxEvents.next(v);
            else localSettings.idbMaxEvents.clear();
          }}
          step={1000}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
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
