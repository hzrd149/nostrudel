import { lazy } from "react";
import { useParams } from "react-router-dom";
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

import { useRelayInfo } from "../../../hooks/use-relay-info";
import { RelayDebugButton, RelayJoinAction, RelayMetadata } from "../components/relay-card";
import SupportedNIPs from "../components/supported-nips";
import { ExternalLinkIcon } from "../../../components/icons";
import RelayReviewForm from "./relay-review-form";
import RelayReviews from "./relay-reviews";
import RelayNotes from "./relay-notes";
import PeopleListProvider from "../../../providers/local/people-list-provider";
import PeopleListSelection from "../../../components/people-list-selection/people-list-selection";
import { RelayFavicon } from "../../../components/relay-favicon";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { safeRelayUrl } from "../../../helpers/relay";
const RelayDetailsTab = lazy(() => import("./relay-details"));

function RelayPage({ relay }: { relay: string }) {
  const { info } = useRelayInfo(relay);
  const showReviewForm = useDisclosure();

  return (
    <VerticalPageLayout alignItems="stretch">
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
          <Button
            as="a"
            href={`https://nostr.watch/relay/${new URL(relay).host}`}
            target="_blank"
            rightIcon={<ExternalLinkIcon />}
          >
            More info
          </Button>
          <RelayJoinAction url={relay} />
        </ButtonGroup>
      </Flex>
      <RelayMetadata url={relay} extended />
      {info?.supported_nips && <SupportedNIPs nips={info?.supported_nips} />}
      <Tabs display="flex" flexDirection="column" flexGrow="1" isLazy colorScheme="primary">
        <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
          <Tab>Reviews</Tab>
          <Tab>Notes</Tab>
          <Tab>Details</Tab>
        </TabList>

        <TabPanels>
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
          <TabPanel py="2" px="0">
            <RelayNotes relay={relay} />
          </TabPanel>
          <TabPanel py="2" px="0">
            <RelayDetailsTab relay={relay} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VerticalPageLayout>
  );
}

export default function RelayView() {
  const { relay } = useParams<string>();
  if (!relay) return <>No relay url</>;

  const safeUrl = safeRelayUrl(relay);
  if (!safeUrl) return <>Bad relay url</>;

  return (
    <PeopleListProvider initList="global">
      <RelayPage relay={safeUrl} />
    </PeopleListProvider>
  );
}
