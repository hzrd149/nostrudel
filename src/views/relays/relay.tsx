import { useParams } from "react-router-dom";
import { Box, Flex, Heading, Tab, TabList, TabPanel, TabPanels, Tabs, Tag, Tooltip } from "@chakra-ui/react";

import { safeRelayUrl } from "../../helpers/url";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { RelayDebugButton, RelayJoinAction, RelayMetadata } from "./components/relay-card";
import useSubject from "../../hooks/use-subject";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import RelayReviewNote from "./components/relay-review-note";

// copied from github
const NIP_NAMES: Record<string, string> = {
  "01": "Basic protocol",
  "02": "Contact List and Petnames",
  "03": "OpenTimestamps Attestations for Events",
  "04": "Encrypted Direct Message",
  "05": "Mapping Nostr keys to DNS-based internet identifiers",
  "06": "Basic key derivation from mnemonic seed phrase",
  "07": "window.nostr capability for web browsers",
  "08": "Handling Mentions",
  "09": "Event Deletion",
  "10": "Conventions for clients' use of e and p tags in text events",
  "11": "Relay Information Document",
  "12": "Generic Tag Queries",
  "13": "Proof of Work",
  "14": "Subject tag in text events",
  "15": "Nostr Marketplace",
  "16": "Event Treatment",
  "18": "Reposts",
  "19": "bech32-encoded entities",
  "20": "Command Results",
  "21": "nostr: URI scheme",
  "22": "Event created_at Limits",
  "23": "Long-form Content",
  "25": "Reactions",
  "26": "Delegated Event Signing",
  "27": "Text Note References",
  "28": "Public Chat",
  "30": "Custom Emoji",
  "31": "Dealing with Unknown Events",
  "32": "Labeling",
  "33": "Parameterized Replaceable Events",
  "36": "Sensitive Content",
  "39": "External Identities in Profiles",
  "40": "Expiration Timestamp",
  "42": "Authentication of clients to relays",
  "45": "Counting results",
  "46": "Nostr Connect",
  "47": "Wallet Connect",
  "50": "Keywords filter",
  "51": "Lists",
  "52": "Calendar Events",
  "53": "Live Activities",
  "56": "Reporting",
  "57": "Lightning Zaps",
  "58": "Badges",
  "65": "Relay List Metadata",
  "78": "Application-specific data",
  "89": "Recommended Application Handlers",
  "94": "File Metadata",
  "98": "HTTP Auth",
  "99": "Classified Listings",
};

function NipTag({ nip }: { nip: number }) {
  const nipStr = String(nip).padStart(2, "0");

  return (
    <Tooltip label={NIP_NAMES[nipStr]}>
      <Tag as="a" target="_blank" href={`https://github.com/nostr-protocol/nips/blob/master/${nipStr}.md`}>
        NIP-{nip}
      </Tag>
    </Tooltip>
  );
}

function RelayReviews({ relay }: { relay: string }) {
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${relay}-reviews`, readRelays, {
    kinds: [1985],
    "#r": [relay],
    "#l": ["review/relay"],
  });

  const events = useSubject(timeline.timeline);

  return (
    <Flex direction="column" gap="2">
      {events.map((event) => (
        <RelayReviewNote key={event.id} event={event} hideUrl />
      ))}
    </Flex>
  );
}

function RelayPage({ relay }: { relay: string }) {
  const { info } = useRelayInfo(relay);

  return (
    <Flex direction="column" alignItems="stretch" gap="2" py="2">
      <Flex gap="2" alignItems="center">
        <Heading>{relay}</Heading>
        <RelayDebugButton url={relay} ml="auto" />
        <RelayJoinAction url={relay} />
      </Flex>
      <RelayMetadata url={relay} />
      <Flex gap="2">
        {info?.supported_nips?.map((nip) => (
          <NipTag key={nip} nip={nip} />
        ))}
      </Flex>
      <Tabs display="flex" flexDirection="column" flexGrow="1" isLazy colorScheme="brand">
        <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
          <Tab>Reviews</Tab>
          <Tab isDisabled>Notes</Tab>
        </TabList>

        <TabPanels>
          <TabPanel py="2" px="0">
            <RelayReviews relay={relay} />
          </TabPanel>
          <TabPanel py="2" px="0"></TabPanel>
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
