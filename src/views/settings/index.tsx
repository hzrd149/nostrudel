import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Switch,
  useColorMode,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  AccordionItem,
  Accordion,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
} from "@chakra-ui/react";
import { SyntheticEvent, useState } from "react";
import { useAsync } from "react-use";
import { TrashIcon } from "../../components/icons";
import { RelayStatus } from "./relay-status";
import useSubject from "../../hooks/use-subject";
import settings from "../../services/settings";
import { clearData } from "../../services/db";

export const SettingsView = () => {
  const relays = useSubject(settings.relays);
  const [relayInputValue, setRelayInputValue] = useState("");

  const { value: relaysJson, loading: loadingRelaysJson } = useAsync(async () =>
    fetch("/relays.json").then((res) => res.json() as Promise<{ relays: string[] }>)
  );
  const relaySuggestions = relaysJson?.relays.filter((url) => !relays.includes(url)) ?? [];

  const { colorMode, setColorMode } = useColorMode();

  const handleRemoveRelay = (url: string) => {
    settings.relays.next(relays.filter((v) => v !== url));
  };
  const handleAddRelay = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    settings.relays.next([...relays, relayInputValue]);
    setRelayInputValue("");
  };

  const [clearing, setClearing] = useState(false);
  const handleClearData = async () => {
    setClearing(true);
    await clearData();
    setClearing(false);
  };

  return (
    <Flex direction="column" pt="2" pb="2" overflow="auto">
      <Accordion defaultIndex={[0]} allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Relays
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel>
            <TableContainer mb="4">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Url</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {relays.map((url) => (
                    <Tr key={url}>
                      <Td>{url}</Td>
                      <Td>
                        <RelayStatus url={url} />
                      </Td>
                      <Td isNumeric>
                        <IconButton
                          icon={<TrashIcon />}
                          title="Remove Relay"
                          aria-label="Remove Relay"
                          size="sm"
                          onClick={() => handleRemoveRelay(url)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            <form onSubmit={handleAddRelay}>
              <FormControl>
                <FormLabel htmlFor="relay-url-input">Add Relay</FormLabel>
                <Flex gap="2">
                  <Input
                    id="relay-url-input"
                    value={relayInputValue}
                    onChange={(e) => setRelayInputValue(e.target.value)}
                    required
                    list="relay-suggestions"
                    type="url"
                    isDisabled={loadingRelaysJson}
                  />
                  <datalist id="relay-suggestions">
                    {relaySuggestions.map((url) => (
                      <option key={url} value={url}>
                        {url}
                      </option>
                    ))}
                  </datalist>
                  <Button type="submit">Add</Button>
                </Flex>
              </FormControl>
            </form>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Display
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel>
            <Flex direction="column" gap="2">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="use-dark-theme" mb="0">
                  Use dark theme
                </FormLabel>
                <Switch
                  id="use-dark-theme"
                  isChecked={colorMode === "dark"}
                  onChange={(v) => setColorMode(v.target.checked ? "dark" : "light")}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="show-ads" mb="0">
                  Show Ads
                </FormLabel>
                <Switch
                  id="show-ads"
                  isChecked={false}
                  onChange={(v) => alert("Sorry, that feature will never be finished.")}
                />
              </FormControl>
            </Flex>
          </AccordionPanel>
        </AccordionItem>

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
            <Button colorScheme="red" onClick={handleClearData} isLoading={clearing} isDisabled={clearing}>
              Remove All Data
            </Button>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Flex>
  );
};
