import React, { useMemo } from "react";
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
import { useObservable } from "react-use";
import userMetadata from "../../services/user-metadata";

export const UserView = () => {
  const params = useParams();

  if (!params.pubkey) {
    // TODO: better 404
    throw new Error("No pubkey");
  }

  const observable = useMemo(
    () => userMetadata.requestUserMetadata(params.pubkey),
    [params.pubkey]
  );
  const metadata = useObservable(observable);

  return (
    <>
      <Heading>{metadata?.name ?? params.pubkey}</Heading>
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
