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
  const { pubkey } = useParams();
  if (!pubkey) {
    // TODO: better 404
    throw new Error("No pubkey");
  }

  const observable = useMemo(
    () => userMetadata.requestUserMetadata(pubkey),
    [pubkey]
  );
  // @ts-ignore
  const metadata = useObservable(observable);

  return (
    <>
      {/* @ts-ignore */}
      <Heading>{metadata?.name ?? pubkey}</Heading>
      <Tabs>
        <TabList>
          <Tab>Posts</Tab>
          <Tab>Other</Tab>
          <Tab>Relays</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <UserPostsTab pubkey={pubkey} />
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
