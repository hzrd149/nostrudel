import { Tab, TabIndicator, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const tabs = ["network", "publish-log", "database"];

export default function TaskManagerLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const index = tabs.indexOf(location.pathname.split("/")[1] || "network");

  return (
    <Tabs
      display="flex"
      flexDirection="column"
      flexGrow="1"
      isLazy
      colorScheme="primary"
      position="relative"
      variant="unstyled"
      index={index}
      onChange={(i) => navigate("/" + tabs[i], { replace: true })}
    >
      <TabList overflowX="auto" overflowY="hidden" flexShrink={0} mr="10">
        <Tab>Network</Tab>
        <Tab>Publish Log</Tab>
        <Tab>Database</Tab>
      </TabList>
      <TabIndicator height="2px" bg="primary.500" borderRadius="1px" />

      <TabPanels>
        <TabPanel p={0} minH="50vh">
          <Outlet />
        </TabPanel>
        <TabPanel p={0} minH="50vh">
          <Outlet />
        </TabPanel>
        <TabPanel minH="50vh">
          <Outlet />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
