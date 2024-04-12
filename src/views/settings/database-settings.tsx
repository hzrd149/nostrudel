import { useState } from "react";
import { useAsync } from "react-use";
import {
  Button,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  Text,
  Flex,
} from "@chakra-ui/react";
import { countEvents, countEventsByKind } from "nostr-idb";
import { Link as RouterLink } from "react-router-dom";

import { clearCacheData, deleteDatabase } from "../../services/db";
import { DatabaseIcon } from "../../components/icons";
import { localDatabase } from "../../services/local-relay";

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
          <DatabaseIcon mr="2" boxSize={5} />
          <Box as="span" flex="1" textAlign="left">
            Database
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Text>Database tools have moved</Text>
        <Button as={RouterLink} to="/relays/cache/database" size="sm" colorScheme="primary">
          Database Tools
        </Button>
      </AccordionPanel>
    </AccordionItem>
  );
}
