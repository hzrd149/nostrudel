import React from "react";
import {
  Avatar,
  Box,
  Heading,
  HStack,
  SkeletonText,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { UserPostsTab } from "./posts";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import ReactMarkdown from "react-markdown";

export const UserView = () => {
  const { pubkey } = useParams();
  if (!pubkey) {
    // TODO: better 404
    throw new Error("No pubkey");
  }

  const metadata = useUserMetadata(pubkey);

  return (
    <VStack alignItems="stretch" spacing={4}>
      {" "}
      <HStack spacing={4}>
        <Avatar src={metadata?.picture} />
        <Box>
          <Heading>{metadata?.name ?? pubkey}</Heading>
          <Text>{metadata?.display_name}</Text>
        </Box>
      </HStack>
      {metadata?.about ? (
        <ReactMarkdown>{metadata.about}</ReactMarkdown>
      ) : (
        <SkeletonText />
      )}
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
    </VStack>
  );
};
