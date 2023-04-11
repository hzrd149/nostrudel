import {
  Button,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  ButtonGroup,
} from "@chakra-ui/react";
import { useState } from "react";
import { clearCacheData, deleteDatabase } from "../../services/db";

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
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Database
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
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
