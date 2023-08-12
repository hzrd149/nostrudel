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

import { safeRelayUrl } from "../../../helpers/url";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import { RelayDebugButton, RelayJoinAction, RelayMetadata } from "../components/relay-card";
import SupportedNIPs from "../components/supported-nips";
import { ExternalLinkIcon } from "../../../components/icons";
import RelayReviewForm from "./relay-review-form";
import RelayReviews from "./relay-reviews";
import RelayNotes from "./relay-notes";

function RelayPage({ relay }: { relay: string }) {
  const { info } = useRelayInfo(relay);
  const showReviewForm = useDisclosure();

  return (
    <Flex direction="column" alignItems="stretch" gap="2" p="2">
      <Flex gap="2" alignItems="center" wrap="wrap" justifyContent="space-between">
        <Heading isTruncated size={{ base: "md", sm: "lg" }}>
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
      <RelayMetadata url={relay} />
      {info?.supported_nips && <SupportedNIPs nips={info?.supported_nips} />}
      <Tabs display="flex" flexDirection="column" flexGrow="1" isLazy colorScheme="brand">
        <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
          <Tab>Reviews</Tab>
          <Tab>Notes</Tab>
        </TabList>

        <TabPanels>
          <TabPanel py="2" px="0">
            {showReviewForm.isOpen ? (
              <RelayReviewForm onClose={showReviewForm.onClose} relay={relay} />
            ) : (
              <Button colorScheme="brand" ml="aut" mb="2" onClick={showReviewForm.onOpen}>
                Write review
              </Button>
            )}
            <RelayReviews relay={relay} />
          </TabPanel>
          <TabPanel py="2" px="0">
            <RelayNotes relay={relay} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default function RelayView() {
  const { relay } = useParams<string>();
  if (!relay) return <>No relay url</>;

  const safeUrl = safeRelayUrl(relay);

  if (!safeUrl) return <>Bad relay url</>;

  return <RelayPage relay={safeUrl} />;
}
