import {
  Flex,
  Heading,
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
import { UserAvatar } from "../../components/user-avatar";
import { getUserFullName } from "../../helpers/user-metadata";

export const UserView = () => {
  const { pubkey } = useParams();
  if (!pubkey) {
    // TODO: better 404
    throw new Error("No pubkey");
  }

  const { metadata, loading: loadingMetadata } = useUserMetadata(pubkey);
  const label = metadata ? getUserFullName(metadata) || pubkey : pubkey;

  return (
    <VStack alignItems="stretch" spacing={4}>
      {" "}
      <Flex gap="4">
        <UserAvatar pubkey={pubkey} size="xl" />
        <Flex direction="column" gap="2">
          <Heading>{label}</Heading>
          {loadingMetadata ? <SkeletonText /> : <Text>{metadata?.about}</Text>}
        </Flex>
      </Flex>
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
