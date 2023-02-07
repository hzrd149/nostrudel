import {
  Box,
  Heading,
  HStack,
  SkeletonText,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { UserPostsTab } from "./posts";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import ReactMarkdown from "react-markdown";
import { UserAvatar } from "../../components/user-avatar";
import { getUserFullName } from "../../helpers/user-metadata";

export const UserView = () => {
  const { pubkey } = useParams();
  if (!pubkey) {
    // TODO: better 404
    throw new Error("No pubkey");
  }

  const metadata = useUserMetadata(pubkey);
  const label = metadata ? getUserFullName(metadata) || pubkey : pubkey;

  return (
    <VStack alignItems="stretch" spacing={4}>
      {" "}
      <HStack spacing={4}>
        <UserAvatar pubkey={pubkey} />
        <Box>
          <Heading>{label}</Heading>
          {/* <Text>{metadata?.name}</Text> */}
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
