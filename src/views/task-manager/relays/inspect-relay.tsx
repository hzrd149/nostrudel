import { useMemo } from "react";
import {
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
  useInterval,
} from "@chakra-ui/react";
import { useParams } from "react-router";
import { useObservable } from "applesauce-react/hooks";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/router/back-button";
import relayPoolService from "../../../services/relay-pool";

import ProcessBranch from "../processes/process/process-tree";
import processManager from "../../../services/process-manager";
import { IconRelayAuthButton } from "../../../components/relays/relay-auth-button";
import { RelayStatus } from "../../../components/relays/relay-status";
import Timestamp from "../../../components/timestamp";
import RelayConnectSwitch from "../../../components/relays/relay-connect-switch";
import useForceUpdate from "../../../hooks/use-force-update";

export default function InspectRelayView() {
  const { url } = useParams();
  if (!url) throw new Error("Missing url param");

  const update = useForceUpdate();
  useInterval(update, 500);

  const relay = useMemo(() => relayPoolService.requestRelay(url, false), [url]);

  const rootProcesses = processManager.getRootProcessesForRelay(relay);
  const notices = useObservable(relayPoolService.notices.get(relay));

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton size="sm" />
        <Heading size="md">{url}</Heading>
        <RelayStatus relay={relay} />
        <Spacer />
        <IconRelayAuthButton relay={relay} size="sm" variant="ghost" />
        <RelayConnectSwitch relay={relay} />
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
            {notices.map((notice, i) => (
              <Text fontFamily="monospace" key={notice.date + i}>
                {notice.message} <Timestamp timestamp={notice.date} color="gray.500" />
              </Text>
            ))}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VerticalPageLayout>
  );
}
