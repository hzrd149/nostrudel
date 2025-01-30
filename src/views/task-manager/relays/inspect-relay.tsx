import { Flex, Heading, Spacer, Tab, TabIndicator, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { Navigate, useParams } from "react-router-dom";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/router/back-button";

import processManager from "../../../services/process-manager";
import { RelayAuthIconButton } from "../../../components/relays/relay-auth-icon-button";
import RelayStatusBadge from "../../../components/relays/relay-status";
import useRelayNotices from "../../../hooks/use-relay-notices";
import Timestamp from "../../../components/timestamp";

export default function InspectRelayView() {
  const { relay } = useParams();
  if (!relay) return <Navigate to="/" />;

  const rootProcesses = processManager.getRootProcessesForRelay(relay);
  const notices = useRelayNotices(relay);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton size="sm" />
        <Heading size="md">{relay}</Heading>
        <RelayStatusBadge relay={relay} />
        <Spacer />
        <RelayAuthIconButton relay={relay} size="sm" variant="ghost" />
      </Flex>

      <Tabs position="relative" variant="unstyled">
        <TabList>
          <Tab>Notices ({notices.length})</Tab>
          {/* <Tab>Processes ({rootProcesses.size})</Tab> */}
        </TabList>
        <TabIndicator mt="-1.5px" height="2px" bg="primary.500" borderRadius="1px" />

        <TabPanels>
          <TabPanel p="0">
            {notices.map((notice, i) => (
              <Text fontFamily="monospace" key={notice.id}>
                {notice.message} <Timestamp timestamp={notice.timestamp} />
              </Text>
            ))}
          </TabPanel>
          {/* <TabPanel p="0">
            {Array.from(rootProcesses).map((process) => (
              <ProcessBranch
                key={process.id}
                process={process}
                filter={(p) => (p.relays.size > 0 ? p.relays.has(relay) : p.children.size > 0)}
              />
            ))}
          </TabPanel> */}
        </TabPanels>
      </Tabs>
    </VerticalPageLayout>
  );
}
