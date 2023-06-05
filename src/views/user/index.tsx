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
import { Outlet, useMatches, useNavigate, useParams } from "react-router-dom";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { Bech32Prefix, isHex, normalizeToBech32 } from "../../helpers/nip19";
import { useAppTitle } from "../../hooks/use-app-title";
import Header from "./components/header";
import { Suspense, useState } from "react";
import useFallbackUserRelays from "../../hooks/use-fallback-user-relays";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import relayScoreboardService from "../../services/relay-scoreboard";
import { RelayMode } from "../../classes/relay";
import { AdditionalRelayProvider } from "../../providers/additional-relay-context";
import { nip19 } from "nostr-tools";
import { unique } from "../../helpers/array";
import { RelayFavicon } from "../../components/relay-favicon";

const tabs = [
  { label: "Notes", path: "notes" },
  { label: "Media", path: "media" },
  { label: "Zaps", path: "zaps" },
  { label: "Followers", path: "followers" },
  { label: "Following", path: "following" },
  { label: "Relays", path: "relays" },
  { label: "Reports", path: "reports" },
];

function useUserPointer() {
  const { pubkey } = useParams() as { pubkey: string };
  if (isHex(pubkey)) return { pubkey, relays: [] };
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
  // get user relays
  const userRelays = useFallbackUserRelays(pubkey)
    .filter((r) => r.mode & RelayMode.WRITE)
    .map((r) => r.url);
  // merge the users relays with client relays
  const readRelays = useReadRelayUrls();
  if (userRelays.length === 0) return readRelays;
  const sorted = relayScoreboardService.getRankedRelays(userRelays);

  return !count ? sorted : sorted.slice(0, count);
}

const UserView = () => {
  const { pubkey, relays: pointerRelays } = useUserPointer();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [relayCount, setRelayCount] = useState(4);
  const userTopRelays = useUserTopRelays(pubkey, relayCount);
  const relayModal = useDisclosure();

  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];

  const activeTab = tabs.indexOf(tabs.find((t) => lastMatch.pathname.includes(t.path)) ?? tabs[0]);

  const metadata = useUserMetadata(pubkey, userTopRelays, true);
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);

  useAppTitle(getUserDisplayName(metadata, npub ?? pubkey));

  return (
    <>
      <AdditionalRelayProvider relays={unique([...userTopRelays, ...pointerRelays])}>
        <Flex direction="column" alignItems="stretch" gap="2" overflow={isMobile ? "auto" : "hidden"} height="100%">
          {/* {metadata?.banner && <Image src={metadata.banner} mb={-120} />} */}
          <Header pubkey={pubkey} showRelaySelectionModal={relayModal.onOpen} />
          <Tabs
            display="flex"
            flexDirection="column"
            flexGrow="1"
            overflow={isMobile ? undefined : "hidden"}
            isLazy
            index={activeTab}
            onChange={(v) => navigate(tabs[v].path)}
            colorScheme="brand"
          >
            <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
              {tabs.map(({ label }) => (
                <Tab key={label}>{label}</Tab>
              ))}
            </TabList>

            <TabPanels overflow={isMobile ? undefined : "auto"} height="100%">
              {tabs.map(({ label }) => (
                <TabPanel key={label} pr={0} pl={0}>
                  <Suspense fallback={<Spinner />}>
                    <Outlet context={{ pubkey, setRelayCount }} />
                  </Suspense>
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
