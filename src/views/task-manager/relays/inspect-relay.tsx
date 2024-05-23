import { useCallback, useMemo } from "react";
import {
  Button,
  ButtonGroup,
  Flex,
  Heading,
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
  useToast,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/router/back-button";
import relayPoolService from "../../../services/relay-pool";
import useSubject from "../../../hooks/use-subject";

import ProcessBranch from "../processes/process/process-tree";
import processManager from "../../../services/process-manager";
import RelayAuthButton from "../../../components/relays/relay-auth-button";
import { RelayStatus } from "../../../components/relay-status";
import Timestamp from "../../../components/timestamp";

export default function InspectRelayView() {
  const toast = useToast();
  const { url } = useParams();
  if (!url) throw new Error("Missing url param");

  const update = useForceUpdate();
  useInterval(update, 500);

  const relay = useMemo(() => relayPoolService.requestRelay(url, false), [url]);
  const connecting = useSubject(relayPoolService.connecting.get(relay));

  const connect = useCallback(async () => {
    try {
      await relayPoolService.requestConnect(relay, false);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  }, [toast]);

  const rootProcesses = processManager.getRootProcessesForRelay(relay);
  const notices = useSubject(relayPoolService.notices.get(relay));

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton size="sm" />
        <Heading size="md">{url}</Heading>
        <RelayStatus relay={relay} />
        <Spacer />
        <ButtonGroup size="sm">
          <RelayAuthButton relay={relay} />
          <Button variant="outline" colorScheme={connecting ? "orange" : "green"} onClick={connect}>
            {connecting ? "Connecting..." : relay.connected ? "Connected" : "Connect"}
          </Button>
        </ButtonGroup>
      </Flex>

      <Tabs position="relative" variant="unstyled">
        <TabList>
          <Tab>Processes ({rootProcesses.size})</Tab>
          <Tab>Notices ({notices.length})</Tab>
        </TabList>
        <TabIndicator mt="-1.5px" height="2px" bg="primary.500" borderRadius="1px" />

        <TabPanels>
          <TabPanel p="0">
            {Array.from(rootProcesses).map((process) => (
              <ProcessBranch
                key={process.id}
                process={process}
                filter={(p) => (p.relays.size > 0 ? p.relays.has(relay) : p.children.size > 0)}
              />
            ))}
          </TabPanel>
          <TabPanel p="0">
            {notices.map((notice) => (
              <Text fontFamily="monospace" key={notice.date + notice.message}>
                [<Timestamp timestamp={notice.date} />] {notice.message}
              </Text>
            ))}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VerticalPageLayout>
  );
}
