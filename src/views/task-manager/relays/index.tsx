import {
  Box,
  Flex,
  Heading,
  LinkBox,
  Spacer,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useForceUpdate,
  useInterval,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { AbstractRelay } from "nostr-tools";

import relayPoolService from "../../../services/relay-pool";
import { RelayFavicon } from "../../../components/relay-favicon";
import { RelayStatus } from "../../../components/relay-status";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { localRelay } from "../../../services/local-relay";
import useSubjects from "../../../hooks/use-subjects";
import Timestamp from "../../../components/timestamp";

function RelayRow({ relay }: { relay: AbstractRelay }) {
  return (
    <LinkBox display="flex" gap="2" p="2" alignItems="center">
      <RelayFavicon relay={relay.url} size="sm" mr="2" />
      <HoverLinkOverlay as={RouterLink} to={`/r/${encodeURIComponent(relay.url)}`} isTruncated fontWeight="bold">
        {relay.url}
      </HoverLinkOverlay>
      <Spacer />
      <RelayStatus relay={relay} />
    </LinkBox>
  );
}

export default function TaskManagerRelays() {
  const update = useForceUpdate();
  useInterval(update, 2000);

  const relays = Array.from(relayPoolService.relays.values())
    .filter((r) => r !== localRelay)
    .sort((a, b) => +b.connected - +a.connected || a.url.localeCompare(b.url));

  const notices = useSubjects(Array.from(relayPoolService.notices.values()))
    .flat()
    .sort((a, b) => b.date - a.date);

  return (
    <Tabs position="relative" variant="unstyled">
      <TabList>
        <Tab>Relays ({relays.length})</Tab>
        <Tab>Notices ({notices.length})</Tab>
      </TabList>
      <TabIndicator mt="-1.5px" height="2px" bg="primary.500" borderRadius="1px" />

      <TabPanels>
        <TabPanel p="0">
          <Flex direction="column">
            {localRelay instanceof AbstractRelay && <RelayRow relay={localRelay} />}
            {relays.map((relay) => (
              <RelayRow key={relay.url} relay={relay} />
            ))}
          </Flex>
        </TabPanel>
        <TabPanel p="0">
          {notices.map((notice) => (
            <LinkBox key={notice.date + notice.message} px="2" py="1">
              <HoverLinkOverlay
                as={RouterLink}
                to={`/r/${encodeURIComponent(notice.relay.url)}`}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {notice.relay.url}
              </HoverLinkOverlay>
              <Text fontFamily="monospace">{notice.message}</Text>
            </LinkBox>
          ))}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
