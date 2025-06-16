import { Flex, Heading, Spacer, Tab, TabIndicator, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { Navigate, useParams } from "react-router-dom";

import BackButton from "../../../components/router/back-button";
import VerticalPageLayout from "../../../components/vertical-page-layout";

import { RelayAuthIconButton } from "../../../components/relays/relay-auth-icon-button";
import RelayStatusBadge from "../../../components/relays/relay-status";
import { notices$ } from "../../../services/pool";

export default function InspectRelayView() {
  const { relay } = useParams();
  if (!relay) return <Navigate to="/" />;

  const notices = useObservableEagerState(notices$).filter((n) => n.from === relay);

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
              <Text fontFamily="monospace" key={i}>
                {notice.message}
              </Text>
            ))}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VerticalPageLayout>
  );
}
