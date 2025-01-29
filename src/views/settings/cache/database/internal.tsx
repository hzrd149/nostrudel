import { useState } from "react";
import { addEvents, countEvents, countEventsByKind, getEventUID, updateUsed } from "nostr-idb";
import {
  Button,
  ButtonGroup,
  Card,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from "@chakra-ui/react";
import { useAsync } from "react-use";
import { NostrEvent } from "nostr-tools";
import { useObservable } from "applesauce-react/hooks";

import { localDatabase } from "../../../../services/cache-relay";
import EventKindsPieChart from "../../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../../components/charts/event-kinds-table";
import ImportEventsButton from "./components/import-events-button";
import ExportEventsButton from "./components/export-events-button";
import { clearCacheData, deleteDatabase } from "../../../../services/db";
import localSettings from "../../../../services/local-settings";

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

  const maxEvents = useObservable(localSettings.idbMaxEvents);

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
