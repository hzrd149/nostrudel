import React from "react";
import {
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { UserPostsTab } from "./posts";

export const UserView = () => {
  const params = useParams();

  if (!params.pubkey) {
    // TODO: better 404
    throw new Error("No pubkey");
  }

  return (
    <>
      <Heading>{params.pubkey}</Heading>
      <Tabs>
        <TabList>
          <Tab>Posts</Tab>
          <Tab>Other</Tab>
          <Tab>Relays</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <UserPostsTab pubkey={params.pubkey} />
          </TabPanel>
          <TabPanel>
            <p>two!</p>
          </TabPanel>
          <TabPanel>
            <p>three!</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
};
