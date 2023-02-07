import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Flex,
  Heading,
  SkeletonText,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Box,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { UserNotesTab } from "./notes";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatar } from "../../components/user-avatar";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserRelaysTab } from "./relays";
import { UserFollowingTab } from "./following";
import { normalizeToHex } from "../../helpers/nip-19";
import { Page } from "../../components/page";
import { UserProfileMenu } from "./user-profile-menu";
import { UserFollowersTab } from "./followers";
import { UserRepliesTab } from "./replies";

export const UserPage = () => {
  const params = useParams();
  let id = normalizeToHex(params.pubkey ?? "");

  if (!id) {
    return (
      <Page>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Invalid pubkey</AlertTitle>
          <AlertDescription>"{params.pubkey}" dose not look like a valid pubkey</AlertDescription>
        </Alert>
      </Page>
    );
  }

  return (
    <Page>
      <UserView pubkey={id} />
    </Page>
  );
};

export type UserViewProps = {
  pubkey: string;
};

export const UserView = ({ pubkey }: UserViewProps) => {
  const isMobile = useIsMobile();

  const metadata = useUserMetadata(pubkey, [], true);
  const label = getUserDisplayName(metadata, pubkey);

  const header = (
    <Flex gap="4" padding="2">
      <UserAvatar pubkey={pubkey} size={isMobile ? "md" : "xl"} />
      <Flex direction="column" gap={isMobile ? 0 : 2}>
        <Heading size={isMobile ? "md" : "lg"}>{label}</Heading>
        {!metadata ? <SkeletonText /> : <Text>{metadata?.about}</Text>}
      </Flex>
      <Box ml="auto">
        <UserProfileMenu pubkey={pubkey} />
      </Box>
    </Flex>
  );

  return (
    <Flex direction="column" alignItems="stretch" gap="2" overflow={isMobile ? "auto" : "hidden"} height="100%">
      {/* {metadata?.banner && <Image src={metadata.banner} />} */}
      {header}
      <Tabs display="flex" flexDirection="column" flexGrow="1" overflow={isMobile ? undefined : "hidden"} isLazy>
        <TabList overflow={isMobile ? "auto" : undefined}>
          <Tab>Notes</Tab>
          <Tab>Replies</Tab>
          <Tab>Followers</Tab>
          <Tab>Following</Tab>
          <Tab>Relays</Tab>
        </TabList>

        <TabPanels overflow={isMobile ? undefined : "auto"} height="100%">
          <TabPanel pr={0} pl={0}>
            <UserNotesTab pubkey={pubkey} />
          </TabPanel>
          <TabPanel pr={0} pl={0}>
            <UserRepliesTab pubkey={pubkey} />
          </TabPanel>
          <TabPanel>
            <UserFollowersTab pubkey={pubkey} />
          </TabPanel>
          <TabPanel>
            <UserFollowingTab pubkey={pubkey} />
          </TabPanel>
          <TabPanel pr={0} pl={0}>
            <UserRelaysTab pubkey={pubkey} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
};
