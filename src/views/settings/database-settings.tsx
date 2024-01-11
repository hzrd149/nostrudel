import { useState } from "react";
import {
  Button,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  ButtonGroup,
  Text,
} from "@chakra-ui/react";
import { useAsync } from "react-use";
import { countEvents, countEventsByKind } from "nostr-idb";

import { clearCacheData, deleteDatabase } from "../../services/db";
import { DatabaseIcon } from "../../components/icons";
import { localCacheDatabase } from "../../services/local-cache-relay";

function DatabaseStats() {
  const { value: count } = useAsync(async () => await countEvents(localCacheDatabase), []);
  const { value: kinds } = useAsync(async () => await countEventsByKind(localCacheDatabase), []);

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
        <ButtonGroup>
          <Button onClick={handleClearData} isLoading={clearing} isDisabled={clearing}>
            Clear cache data
          </Button>
          <Button colorScheme="red" onClick={handleDeleteDatabase} isLoading={deleting} isDisabled={deleting}>
            Delete database
          </Button>
        </ButtonGroup>
      </AccordionPanel>
    </AccordionItem>
  );
}
