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
  ButtonGroup,
  FormHelperText,
} from "@chakra-ui/react";
import { SyntheticEvent, useState } from "react";
import { GlobalIcon, TrashIcon } from "../../components/icons";
import { RelayStatus } from "./relay-status";
import useSubject from "../../hooks/use-subject";
import settings from "../../services/settings";
import { clearCacheData, deleteDatabase } from "../../services/db";
import { RelayUrlInput } from "../../components/relay-url-input";
import { useNavigate } from "react-router-dom";
import identity from "../../services/identity";

export const SettingsView = () => {
  const navigate = useNavigate();
  const relays = useSubject(settings.relays);
  const blurImages = useSubject(settings.blurImages);
  const autoShowMedia = useSubject(settings.autoShowMedia);
  const proxyUserMedia = useSubject(settings.proxyUserMedia);
  const [relayInputValue, setRelayInputValue] = useState("");

  const { colorMode, setColorMode } = useColorMode();

  const handleRemoveRelay = (url: string) => {
    settings.relays.next(relays.filter((v) => v !== url));
  };
  const handleAddRelay = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!relays.includes(relayInputValue)) {
      settings.relays.next([...relays, relayInputValue]);
      setRelayInputValue("");
    }
  };

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
                          icon={<GlobalIcon />}
                          onClick={() => navigate("/global?relay=" + url)}
                          size="sm"
                          aria-label="Global Feed"
                          mr="2"
                        />
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
                  <RelayUrlInput
                    id="relay-url-input"
                    value={relayInputValue}
                    onChange={(e) => setRelayInputValue(e.target.value)}
                    isRequired
                  />
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
            <Flex direction="column" gap="4">
              <FormControl>
                <Flex alignItems="center">
                  <FormLabel htmlFor="use-dark-theme" mb="0">
                    Use dark theme
                  </FormLabel>
                  <Switch
                    id="use-dark-theme"
                    isChecked={colorMode === "dark"}
                    onChange={(v) => setColorMode(v.target.checked ? "dark" : "light")}
                  />
                </Flex>
                <FormHelperText>
                  <span>Enabled: hacker mode</span>
                </FormHelperText>
              </FormControl>
              <FormControl>
                <Flex alignItems="center">
                  <FormLabel htmlFor="blur-images" mb="0">
                    Blur images from strangers
                  </FormLabel>
                  <Switch
                    id="blur-images"
                    isChecked={blurImages}
                    onChange={(v) => settings.blurImages.next(v.target.checked)}
                  />
                </Flex>
                <FormHelperText>
                  <span>Enabled: blur images for people you aren't following</span>
                </FormHelperText>
              </FormControl>
              <FormControl>
                <Flex alignItems="center">
                  <FormLabel htmlFor="show-ads" mb="0">
                    Show Ads
                  </FormLabel>
                  <Switch
                    id="show-ads"
                    isChecked={false}
                    onChange={(v) => alert("Sorry, that feature will never be finished.")}
                  />
                </Flex>
                <FormHelperText>
                  <span>Enabled: shows ads so I can steal your data</span>
                </FormHelperText>
              </FormControl>
            </Flex>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Performance
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel>
            <Flex direction="column" gap="4">
              <FormControl>
                <Flex alignItems="center">
                  <FormLabel htmlFor="proxy-user-media" mb="0">
                    Proxy user media
                  </FormLabel>
                  <Switch
                    id="proxy-user-media"
                    isChecked={proxyUserMedia}
                    onChange={(v) => settings.proxyUserMedia.next(v.target.checked)}
                  />
                </Flex>
                <FormHelperText>
                  <span>Enabled: media.nostr.band is used to get smaller of profile images (saves ~50Mb of data)</span>
                  <br />
                  <span>Side Effect: some user pictures may not load or may be outdated</span>
                </FormHelperText>
              </FormControl>
              <FormControl>
                <Flex alignItems="center">
                  <FormLabel htmlFor="auto-show-embeds" mb="0">
                    Automatically show media
                  </FormLabel>
                  <Switch
                    id="auto-show-embeds"
                    isChecked={autoShowMedia}
                    onChange={(v) => settings.autoShowMedia.next(v.target.checked)}
                  />
                </Flex>
                <FormHelperText>Disabled: images and videos will show expandable buttons.</FormHelperText>
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
      </Accordion>
      <Flex gap="2" padding="4">
        <Button onClick={() => identity.logout()}>Logout</Button>
      </Flex>
    </Flex>
  );
};
