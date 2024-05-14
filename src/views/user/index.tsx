import { Suspense, useState } from "react";
import {
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
} from "@chakra-ui/react";

import { Outlet, useMatches, useNavigate } from "react-router-dom";
import useUserMetadata from "../../hooks/use-user-metadata";
import { getDisplayName } from "../../helpers/nostr/user-metadata";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelays } from "../../hooks/use-client-relays";
import relayScoreboardService from "../../services/relay-scoreboard";
import { AdditionalRelayProvider } from "../../providers/local/additional-relay-context";
import { unique } from "../../helpers/array";
import { RelayFavicon } from "../../components/relay-favicon";
import Header from "./components/header";
import { ErrorBoundary } from "../../components/error-boundary";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useUserMailboxes from "../../hooks/use-user-mailboxes";

const tabs = [
  { label: "About", path: "about" },
  { label: "Notes", path: "notes" },
  { label: "Articles", path: "articles" },
  { label: "Streams", path: "streams" },
  { label: "Zaps", path: "zaps" },
  { label: "Lists", path: "lists" },
  { label: "Following", path: "following" },
  { label: "Likes", path: "likes" },
  { label: "Relays", path: "relays" },
  { label: "Goals", path: "goals" },
  { label: "Tracks", path: "tracks" },
  { label: "Videos", path: "videos" },
  { label: "Emojis", path: "emojis" },
  { label: "Torrents", path: "torrents" },
  { label: "Reports", path: "reports" },
  { label: "Followers", path: "followers" },
  { label: "Muted by", path: "muted-by" },
];

function useUserBestOutbox(pubkey: string, count: number = 4) {
  const mailbox = useUserMailboxes(pubkey);
  const relays = useReadRelays();
  const sorted = relayScoreboardService.getRankedRelays(mailbox?.outbox.size ? mailbox?.outbox : relays);
  return !count ? sorted : sorted.slice(0, count);
}

const UserView = () => {
  const { pubkey, relays: pointerRelays = [] } = useParamsProfilePointer();
  const navigate = useNavigate();
  const [relayCount, setRelayCount] = useState(4);
  const userTopRelays = useUserBestOutbox(pubkey, relayCount);
  const relayModal = useDisclosure();
  const readRelays = unique([...userTopRelays, ...pointerRelays]);

  const metadata = useUserMetadata(pubkey, userTopRelays, { alwaysRequest: true });
  useAppTitle(getDisplayName(metadata, pubkey));

  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];

  const activeTab = tabs.indexOf(tabs.find((t) => lastMatch.pathname.endsWith(t.path)) ?? tabs[0]);

  return (
    <>
      <AdditionalRelayProvider relays={readRelays}>
        <Flex direction="column" alignItems="stretch" gap="2">
          <Header pubkey={pubkey} showRelaySelectionModal={relayModal.onOpen} />
          <Tabs
            display="flex"
            flexDirection="column"
            flexGrow="1"
            isLazy
            index={activeTab}
            onChange={(v) => navigate(tabs[v].path, { replace: true })}
            colorScheme="primary"
            h="full"
          >
            <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
              {tabs.map(({ label }) => (
                <Tab key={label} whiteSpace="pre">
                  {label}
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              {tabs.map(({ label }) => (
                <TabPanel key={label} p={0}>
                  <ErrorBoundary>
                    <Suspense fallback={<Spinner />}>
                      <Outlet context={{ pubkey, setRelayCount }} />
                    </Suspense>
                  </ErrorBoundary>
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Flex>
      </AdditionalRelayProvider>

      <Modal isOpen={relayModal.isOpen} onClose={relayModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader pb="1">Relay selection</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <List spacing="2">
              {userTopRelays.map((url) => (
                <ListItem key={url}>
                  <RelayFavicon relay={url} size="xs" mr="2" />
                  {url}
                </ListItem>
              ))}
            </List>

            <FormControl>
              <FormLabel>Max relays</FormLabel>
              <NumberInput min={0} step={1} value={relayCount} onChange={(v) => setRelayCount(parseInt(v) || 0)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>set to 0 to connect to all relays</FormHelperText>
            </FormControl>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserView;
