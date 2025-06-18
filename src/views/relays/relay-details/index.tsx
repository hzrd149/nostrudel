import {
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  useDisclosure,
} from "@chakra-ui/react";
import { isSafeRelayURL, normalizeURL } from "applesauce-core/helpers";
import { lazy, useMemo } from "react";
import { useParams } from "react-router-dom";

import PeopleListSelection from "../../../components/people-list-selection/people-list-selection";
import RelayFavicon from "../../../components/relay-favicon";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import PeopleListProvider from "../../../providers/local/people-list-provider";
import { RelayDebugButton, RelayMetadata } from "../components/relay-card";
import SupportedNIPs from "../components/supported-nips";
import RelayNotes from "./relay-notes";
import RelayReviewForm from "./relay-review-form";
import RelayReviews from "./relay-reviews";
import RelayUsersTab from "./relay-users";
const RelayDetailsTab = lazy(() => import("./relay-details"));

function RelayPage({ relay }: { relay: string }) {
  const { info } = useRelayInfo(relay, true);
  const showReviewForm = useDisclosure();

  const uiURL = useMemo(() => {
    const url = new URL(relay);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    return url.toString();
  }, [relay]);

  return (
    <Flex direction="column" alignItems="stretch" flexGrow={1} gap="2" p="2">
      <Flex gap="2" alignItems="center" wrap="wrap">
        <RelayFavicon relay={relay} />
        <Heading isTruncated size={{ base: "md", sm: "lg" }} mr="auto">
          {relay}
          {info?.payments_url && (
            <Tag
              as="a"
              variant="solid"
              colorScheme="green"
              size={{ base: "sm", md: "lg" }}
              ml="2"
              target="_blank"
              href={info.payments_url}
            >
              Paid
            </Tag>
          )}
        </Heading>
        <ButtonGroup size={["sm", "md"]}>
          <RelayDebugButton url={relay} ml="auto" />
          {/* <RelayListButton relay={relay} aria-label="Add to set" /> */}
        </ButtonGroup>
      </Flex>
      <RelayMetadata url={relay} extended />
      {info?.supported_nips && <SupportedNIPs nips={info?.supported_nips} />}
      <Tabs display="flex" flexDirection="column" flexGrow="1" isLazy colorScheme="primary">
        <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
          <Tab>Reviews</Tab>
          <Tab>UI</Tab>
          <Tab>Notes</Tab>
          <Tab>Users</Tab>
          <Tab>Details</Tab>
        </TabList>

        <TabPanels flexGrow={1}>
          <TabPanel py="2" px="0">
            <Flex gap="2">
              <PeopleListSelection />
              {!showReviewForm.isOpen && (
                <Button colorScheme="primary" ml="auto" mb="2" onClick={showReviewForm.onOpen}>
                  Write review
                </Button>
              )}
            </Flex>
            {showReviewForm.isOpen && <RelayReviewForm onClose={showReviewForm.onClose} relay={relay} my="4" />}
            <RelayReviews relay={relay} />
          </TabPanel>
          <TabPanel p="0" h="full">
            <Flex as="iframe" src={uiURL} w="full" h="full" />
          </TabPanel>
          <TabPanel py="2" px="0">
            <RelayNotes relay={relay} />
          </TabPanel>
          <TabPanel py="2" px="0">
            <RelayUsersTab relay={relay} />
          </TabPanel>
          <TabPanel py="2" px="0">
            <RelayDetailsTab relay={relay} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default function RelayDetailsView() {
  const { relay } = useParams<string>();
  if (!relay) return <>No relay url</>;

  if (!isSafeRelayURL(relay)) return <>Bad relay url</>;

  return (
    <PeopleListProvider initList="global">
      <RelayPage relay={normalizeURL(relay)} />
    </PeopleListProvider>
  );
}
