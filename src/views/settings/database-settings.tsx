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
import db, { clearCacheData, deleteDatabase } from "../../services/db";
import { DatabaseIcon } from "../../components/icons";
import { useAsync } from "react-use";

// copied from https://stackoverflow.com/a/39906526
const units = ["bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
function niceBytes(x: number) {
  let l = 0,
    n = x || 0;
  while (n >= 1024 && ++l) {
    n = n / 1024;
  }
  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
}

function DatabaseStats() {
  const { value: estimatedStorage } = useAsync(async () => await window.navigator?.storage?.estimate?.(), []);

  const { value: replaceableEventCount } = useAsync(async () => {
    const keys = await db.getAllKeys("replaceableEvents");
    return keys.length;
  }, []);
  const { value: relayInfoCount } = useAsync(async () => {
    const keys = await db.getAllKeys("relayInfo");
    return keys.length;
  }, []);
  const { value: nip05Count } = useAsync(async () => {
    const keys = await db.getAllKeys("dnsIdentifiers");
    return keys.length;
  }, []);

  return (
    <>
      <Text>{replaceableEventCount} cached replaceable events</Text>
      <Text>{relayInfoCount} cached relay info</Text>
      <Text>{nip05Count} cached NIP-05 IDs</Text>
      {estimatedStorage ? (
        <Text>
          {niceBytes(estimatedStorage?.usage ?? 0)} / {niceBytes(estimatedStorage?.quota ?? 0)} Used
        </Text>
      ) : null}
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
