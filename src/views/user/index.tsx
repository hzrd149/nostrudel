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
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { UserPostsTab } from "./posts";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatar } from "../../components/user-avatar";
import { getUserFullName } from "../../helpers/user-metadata";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserRelaysTab } from "./relays";

export const UserView = () => {
  const isMobile = useIsMobile();
  const { pubkey } = useParams();
  if (!pubkey) {
    // TODO: better 404
    throw new Error("No pubkey");
  }

  const { metadata, loading: loadingMetadata } = useUserMetadata(pubkey, true);
  const label = metadata ? getUserFullName(metadata) || pubkey : pubkey;

  return (
    <Flex
      direction="column"
      alignItems="stretch"
      gap="2"
      overflow="hidden"
      height="100%"
    >
      <Flex gap="4" padding="2">
        <UserAvatar pubkey={pubkey} size={isMobile ? "md" : "xl"} />
        <Flex direction="column" gap={isMobile ? 0 : 2}>
          <Heading size={isMobile ? "md" : "lg"}>{label}</Heading>
          {loadingMetadata ? <SkeletonText /> : <Text>{metadata?.about}</Text>}
        </Flex>
      </Flex>
      <Tabs
        display="flex"
        flexDirection="column"
        flexGrow="1"
        overflow="hidden"
      >
        <TabList>
          <Tab>Posts</Tab>
          <Tab>Other</Tab>
          <Tab>Relays</Tab>
        </TabList>

        <TabPanels overflow="auto" height="100%">
          <TabPanel pr={0} pl={0}>
            <UserPostsTab pubkey={pubkey} />
          </TabPanel>
          <TabPanel>
            <p>two!</p>
          </TabPanel>
          <TabPanel pr={0} pl={0}>
            <UserRelaysTab pubkey={pubkey} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
};
