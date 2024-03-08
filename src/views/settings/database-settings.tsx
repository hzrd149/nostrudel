import { useRef, useState } from "react";
import { useAsync } from "react-use";
import {
  Button,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  ButtonGroup,
  Text,
  Input,
  Flex,
} from "@chakra-ui/react";
import { addEvents, countEvents, countEventsByKind, getEventUID, updateUsed } from "nostr-idb";
import stringify from "json-stringify-deterministic";

import { clearCacheData, deleteDatabase } from "../../services/db";
import { DatabaseIcon } from "../../components/icons";
import { localDatabase } from "../../services/local-relay";
import { NostrEvent } from "../../types/nostr-event";

function DatabaseStats() {
  const { value: count } = useAsync(async () => await countEvents(localDatabase), []);
  const { value: kinds } = useAsync(async () => await countEventsByKind(localDatabase), []);

  return (
    <>
      <Text>{count} cached events</Text>
      <Text>
        {Object.entries(kinds || {})
          .map(([kind, count]) => `${kind} (${count})`)
          .join(", ")}
      </Text>
    </>
  );
}

function ImportButton() {
  const ref = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const importFile = (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.readAsText(file, "utf8");
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      const lines = reader.result.split("\n");
      const events: NostrEvent[] = [];
      for (const line of lines) {
        try {
          const event = JSON.parse(line) as NostrEvent;
          events.push(event);
        } catch (e) {}
      }
      await addEvents(localDatabase, events);
      await updateUsed(
        localDatabase,
        events.map((e) => getEventUID(e)),
      );
      alert(`Imported ${events.length} events`);
      setImporting(false);
    };
  };

  return (
    <>
      <Input
        hidden
        type="file"
        accept=".jsonl"
        onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
        ref={ref}
      />
      <Button onClick={() => ref.current?.click()} isLoading={importing}>
        Import events
      </Button>
    </>
  );
}

export default function DatabaseSettings() {
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

  const [exporting, setExporting] = useState(false);
  const exportDatabase = async () => {
    setExporting(true);
    const rows = await localDatabase.getAll("events");
    const lines = rows.map((row) => stringify(row.event));
    const file = new File([lines.join("\n")], "noStrudel-export.jsonl", {
      type: "application/jsonl",
    });
    const url = URL.createObjectURL(file);
    window.open(url);
    setExporting(false);
  };

  return (
    <AccordionItem>
      <h2>
        <AccordionButton fontSize="xl">
          <DatabaseIcon mr="2" />
          <Box as="span" flex="1" textAlign="left">
            Database
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <DatabaseStats />
        <Flex mt="2" gap="2" wrap="wrap">
          <Button onClick={handleClearData} isLoading={clearing}>
            Clear cache
          </Button>
          <ImportButton />
          <Button onClick={exportDatabase} isLoading={exporting}>
            Export database
          </Button>
          <Button colorScheme="red" onClick={handleDeleteDatabase} isLoading={deleting}>
            Delete database
          </Button>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
