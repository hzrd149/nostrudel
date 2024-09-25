import {
  Badge,
  Box,
  Flex,
  Link,
  LinkBox,
  Select,
  SimpleGrid,
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
import { useLocalStorage } from "react-use";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import relayPoolService from "../../../services/relay-pool";
import { RelayFavicon } from "../../../components/relay-favicon";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { localRelay } from "../../../services/local-relay";
import useSubjects from "../../../hooks/use-subjects";
import { IconRelayAuthButton, useRelayAuthMethod } from "../../../components/relays/relay-auth-button";
import RelayConnectSwitch from "../../../components/relays/relay-connect-switch";
import useRouteSearchValue from "../../../hooks/use-route-search-value";
import processManager from "../../../services/process-manager";
import { RelayAuthMode } from "../../../classes/relay-pool";
import Timestamp from "../../../components/timestamp";
import localSettings from "../../../services/local-settings";
import useSubject from "../../../hooks/use-subject";

function RelayCard({ relay }: { relay: AbstractRelay }) {
  return (
    <Flex gap="2" p="2" alignItems="center" borderWidth={1} rounded="md">
      <RelayFavicon relay={relay.url} size="sm" mr="2" />
      <Link as={RouterLink} to={`/r/${encodeURIComponent(relay.url)}`} isTruncated fontWeight="bold" py="1" pr="10">
        {relay.url}
      </Link>
      <Spacer />
      <IconRelayAuthButton relay={relay} size="sm" variant="ghost" />
      <RelayConnectSwitch relay={relay} />
    </Flex>
  );
}

function RelayAuthCard({ relay }: { relay: AbstractRelay }) {
  const { authenticated } = useRelayAuthMethod(relay);

  const defaultMode = useSubject(localSettings.defaultAuthenticationMode);

  const processes = processManager.getRootProcessesForRelay(relay);
  const [authMode, setAuthMode] = useLocalStorage<RelayAuthMode | "">(
    relayPoolService.getRelayAuthStorageKey(relay),
    "",
    {
      raw: true,
    },
  );

  return (
    <Flex gap="2" p="2" alignItems="center" borderWidth={1} rounded="md">
      <RelayFavicon relay={relay.url} size="sm" mr="2" />
      <Box isTruncated>
        <Link as={RouterLink} to={`/r/${encodeURIComponent(relay.url)}`} fontWeight="bold">
          {relay.url}
        </Link>
        <br />
        {authenticated ? <Badge colorScheme="green">Authenticated</Badge> : <Text>{processes.size} Processes</Text>}
      </Box>

      <Spacer />
      <Select
        size="sm"
        w="auto"
        rounded="md"
        flexShrink={0}
        value={authMode}
        onChange={(e) => setAuthMode(e.target.value as RelayAuthMode)}
      >
        <option value="">Default ({defaultMode})</option>
        <option value="always">Always</option>
        <option value="ask">Ask</option>
        <option value="never">Never</option>
      </Select>
      <IconRelayAuthButton relay={relay} variant="ghost" flexShrink={0} />
    </Flex>
  );
}

const TABS = ["relays", "auth", "notices"];

export default function TaskManagerRelays() {
  const update = useForceUpdate();
  useInterval(update, 2000);

  const { value: tab, setValue: setTab } = useRouteSearchValue("tab", TABS[0]);
  const tabIndex = TABS.indexOf(tab);

  const relays = Array.from(relayPoolService.relays.values())
    .filter((r) => r !== localRelay)
    .sort((a, b) => +b.connected - +a.connected || a.url.localeCompare(b.url));

  const notices = useSubjects(Array.from(relayPoolService.notices.values()))
    .flat()
    .sort((a, b) => b.date - a.date);

  const challenges = Array.from(relayPoolService.challenges.entries()).filter(([r, c]) => r.connected && !!c.value);

  return (
    <Tabs position="relative" variant="unstyled" index={tabIndex} onChange={(i) => setTab(TABS[i])} isLazy>
      <TabList>
        <Tab>Relays ({relays.length})</Tab>
        <Tab>Authentication ({challenges.length})</Tab>
        <Tab>Notices ({notices.length})</Tab>
      </TabList>
      <TabIndicator mt="-1.5px" height="2px" bg="primary.500" borderRadius="1px" />

      <TabPanels>
        <TabPanel p="0">
          <SimpleGrid spacing="2" columns={{ base: 1, md: 2 }} p="2">
            {localRelay instanceof AbstractRelay && <RelayCard relay={localRelay} />}
            {relays.map((relay) => (
              <RelayCard key={relay.url} relay={relay} />
            ))}
          </SimpleGrid>
        </TabPanel>
        <TabPanel p="0">
          <SimpleGrid spacing="2" columns={{ base: 1, md: 2 }} p="2">
            {challenges.map(([relay, challenge]) => (
              <RelayAuthCard key={relay.url} relay={relay} />
            ))}
          </SimpleGrid>
        </TabPanel>
        <TabPanel p="0">
          {notices.map((notice) => (
            <LinkBox key={notice.date + notice.message} px="2" py="1" fontFamily="monospace">
              <HoverLinkOverlay as={RouterLink} to={`/r/${encodeURIComponent(notice.relay.url)}`} fontWeight="bold">
                {notice.relay.url}
              </HoverLinkOverlay>
              <Timestamp timestamp={notice.date} ml={2} />
              <Text fontFamily="monospace">{notice.message}</Text>
            </LinkBox>
          ))}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
