import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
// import { useMatch, useNavigate } from "react-router-dom";
import { DiscoverTab } from "./discover-tab";
import { FollowingPostsTab } from "./following-posts-tab";
import { GlobalTab } from "./global-tab";

export const HomeView = () => {
  // const navigate = useNavigate();
  // const followingMatch = useMatch("/following");
  // const discoverMatch = useMatch("/discover");

  // const tabs = ["/following", "/discover", "/global"];

  return (
    <Tabs
      display="flex"
      flexDirection="column"
      flexGrow="1"
      overflow="hidden"
      isLazy
      // index={discoverMatch ? 1 : 0}
      // onChange={(v) => navigate(tabs[v])}
    >
      <TabList>
        <Tab>Following</Tab>
        <Tab>Discover</Tab>
        <Tab>Global</Tab>
      </TabList>
      <TabPanels overflow="auto" height="100%">
        <TabPanel pr={0} pl={0}>
          <FollowingPostsTab />
        </TabPanel>
        <TabPanel pr={0} pl={0}>
          <DiscoverTab />
        </TabPanel>
        <TabPanel pr={0} pl={0}>
          <GlobalTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
