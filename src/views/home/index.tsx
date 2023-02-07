import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { DiscoverTab } from "./discover-tab";
import { FollowingTab } from "./following-tab";

export const HomeView = () => {
  return (
    <Tabs
      display="flex"
      flexDirection="column"
      flexGrow="1"
      overflow="hidden"
      isLazy
    >
      <TabList>
        <Tab>Following</Tab>
        <Tab>Discover</Tab>
      </TabList>
      <TabPanels overflow="auto" height="100%">
        <TabPanel pr={0} pl={0}>
          <FollowingTab />
        </TabPanel>
        <TabPanel pr={0} pl={0}>
          <DiscoverTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
