import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { Outlet, useMatches, useNavigate } from "react-router-dom";

const tabs = [
  { label: "Following", path: "/following" },
  // { label: "Discover", path: "/discover" },
  // { label: "Popular", path: "/popular" },
  { label: "Global", path: "/global" },
];

export default function HomeView() {
  const navigate = useNavigate();
  const matches = useMatches();

  const activeTab = tabs.indexOf(tabs.find((t) => matches[matches.length - 1].pathname === t.path) ?? tabs[0]);

  return (
    <Tabs
      display="flex"
      flexDirection="column"
      flexGrow="1"
      overflow="hidden"
      isLazy
      index={activeTab}
      onChange={(v) => navigate(tabs[v].path)}
      colorScheme="brand"
    >
      <TabList>
        {tabs.map(({ label }) => (
          <Tab key={label}>{label}</Tab>
        ))}
      </TabList>
      <TabPanels overflow="hidden" h="full">
        {tabs.map(({ label }) => (
          <TabPanel key={label} p={0} overflow="hidden" h="full" display="flex" flexDirection="column">
            <Outlet />
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}
