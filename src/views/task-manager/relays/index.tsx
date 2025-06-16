import { Tab, TabIndicator, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { useObservableEagerState, useObservableState } from "applesauce-react/hooks";

import useRouteSearchValue from "../../../hooks/use-route-search-value";
import authenticationSigner from "../../../services/authentication-signer";
import { connections$, notices$ } from "../../../services/pool";
import RelayAuthenticationTab from "./tabs/authentication";
import RelayConnectionsTab from "./tabs/connections";
import NoticesTab from "./tabs/notices";

const TABS = ["relays", "auth", "notices"];

export default function TaskManagerRelays() {
  const { value: tab, setValue: setTab } = useRouteSearchValue("tab", TABS[0]);
  const tabIndex = TABS.indexOf(tab);

  const notices = useObservableEagerState(notices$);

  const connections = useObservableState(connections$) ?? {};
  const connected = Object.values(connections).reduce((t, s) => (s === "connected" ? t + 1 : t), 0);
  const pending = useObservableEagerState(authenticationSigner.relayState$);

  return (
    <Tabs position="relative" variant="unstyled" index={tabIndex} onChange={(i) => setTab(TABS[i])} isLazy>
      <TabList>
        <Tab>
          Relays ({connected}/{Object.keys(connections).length})
        </Tab>
        <Tab>Authentication ({Object.keys(pending).length})</Tab>
        <Tab>Notices ({notices.length})</Tab>
      </TabList>
      <TabIndicator mt="-1.5px" height="2px" bg="primary.500" borderRadius="1px" />

      <TabPanels>
        <TabPanel p="0">
          <RelayConnectionsTab />
        </TabPanel>
        <TabPanel p="0">
          <RelayAuthenticationTab />
        </TabPanel>
        <TabPanel p="0">
          <NoticesTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
