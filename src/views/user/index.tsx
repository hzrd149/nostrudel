import { Suspense, useMemo, useState } from "react";
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
import { Kind, nip19 } from "nostr-tools";

import { Outlet, useMatches, useNavigate, useParams } from "react-router-dom";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { isHexKey } from "../../helpers/nip19";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import relayScoreboardService from "../../services/relay-scoreboard";
import { RelayMode } from "../../classes/relay";
import { AdditionalRelayProvider } from "../../providers/additional-relay-context";
import { unique } from "../../helpers/array";
import { RelayFavicon } from "../../components/relay-favicon";
import { useUserRelays } from "../../hooks/use-user-relays";
import Header from "./components/header";
import { ErrorBoundary } from "../../components/error-boundary";
import useEventExists from "../../hooks/use-event-exists";
import { STEMSTR_TRACK_KIND } from "../../helpers/nostr/stemstr";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import { TORRENT_KIND } from "../../helpers/nostr/torrents";
import { GOAL_KIND } from "../../helpers/nostr/goal";

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
  { label: "Emojis", path: "emojis" },
  { label: "Torrents", path: "torrents" },
  { label: "Reports", path: "reports" },
  { label: "Followers", path: "followers" },
  { label: "Muted by", path: "muted-by" },
];

function useUserPointer() {
  const { pubkey } = useParams() as { pubkey: string };
  if (isHexKey(pubkey)) return { pubkey, relays: [] };
  const pointer = nip19.decode(pubkey);

  switch (pointer.type) {
    case "npub":
      return { pubkey: pointer.data as string, relays: [] };
    case "nprofile":
      const d = pointer.data as nip19.ProfilePointer;
      return { pubkey: d.pubkey, relays: d.relays ?? [] };
    default:
      throw new Error(`Unknown type ${pointer.type}`);
  }
}

function useUserTopRelays(pubkey: string, count: number = 4) {
  const readRelays = useReadRelayUrls();
  // get user relays
  const userRelays = useUserRelays(pubkey, readRelays)
    .filter((r) => r.mode & RelayMode.WRITE)
    .map((r) => r.url);
  // merge the users relays with client relays
  if (userRelays.length === 0) return readRelays;
  const sorted = relayScoreboardService.getRankedRelays(userRelays);

  return !count ? sorted : sorted.slice(0, count);
}

const UserView = () => {
  const { pubkey, relays: pointerRelays } = useUserPointer();
  const navigate = useNavigate();
  const [relayCount, setRelayCount] = useState(4);
  const userTopRelays = useUserTopRelays(pubkey, relayCount);
  const relayModal = useDisclosure();
  const readRelays = unique([...userTopRelays, ...pointerRelays]);

  const metadata = useUserMetadata(pubkey, userTopRelays, { alwaysRequest: true });
  useAppTitle(getUserDisplayName(metadata, pubkey));

  const hasTorrents = useEventExists({ kinds: [TORRENT_KIND], authors: [pubkey] }, readRelays);
  const hasGoals = useEventExists({ kinds: [GOAL_KIND], authors: [pubkey] }, readRelays);
  const hasTracks = useEventExists({ kinds: [STEMSTR_TRACK_KIND], authors: [pubkey] }, [
    "wss://relay.stemstr.app",
    ...readRelays,
  ]);
  const hasArticles = useEventExists({ kinds: [Kind.Article], authors: [pubkey] }, readRelays);
  const hasStreams = useEventExists({ kinds: [STREAM_KIND], authors: [pubkey] }, [
    "wss://relay.snort.social",
    "wss://nos.lol",
    "wss://relay.damus.io",
    "wss://nostr.wine",
    ...readRelays,
  ]);

  const filteredTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        if (tab.path === "tracks" && hasTracks === false) return false;
        if (tab.path === "articles" && hasArticles === false) return false;
        if (tab.path === "streams" && hasStreams === false) return false;
        if (tab.path === "torrents" && hasTorrents === false) return false;
        if (tab.path === "goals" && hasGoals === false) return false;
        return true;
      }),
    [hasTracks, hasArticles, hasStreams, hasTorrents, hasGoals, tabs],
  );

  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];

  const activeTab = filteredTabs.indexOf(
    filteredTabs.find((t) => lastMatch.pathname.endsWith(t.path)) ?? filteredTabs[0],
  );

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
            onChange={(v) => navigate(filteredTabs[v].path, { replace: true })}
            colorScheme="primary"
            h="full"
          >
            <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
              {filteredTabs.map(({ label }) => (
                <Tab key={label} whiteSpace="pre">
                  {label}
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              {filteredTabs.map(({ label }) => (
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
