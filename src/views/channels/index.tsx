import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Link } from "@chakra-ui/react";

import { ErrorBoundary } from "../../components/error-boundary";
import ChannelCard from "./components/channel-card";
import { useReadRelays } from "../../hooks/use-client-relays";
import ContainedParentView from "../../components/layout/presets/contained-parent-view";
import useUserChannelsList from "../../hooks/use-user-channels-list";
import useSingleEvents from "../../hooks/use-single-events";
import RouterLink from "../../components/router-link";

export default function ChannelsHomeView() {
  const relays = useReadRelays();
  const { pointers } = useUserChannelsList();
  const channels = useSingleEvents(pointers.map((p) => p.id));

  return (
    <ContainedParentView
      title="Public channels"
      path="/channels"
      width="sm"
      actions={
        <Button as={RouterLink} to="explore" ms="auto" size="sm">
          Explore
        </Button>
      }
    >
      <Alert status="info">
        <AlertIcon />
        <Box>
          <AlertTitle>Deprecated</AlertTitle>
          <AlertDescription>
            <Link href="https://github.com/nostr-protocol/nips/blob/master/28.md">NIP-28</Link> public channels a
            deprecated in favor of <Link href="https://github.com/nostr-protocol/nips/blob/master/29.md">NIP-29</Link>{" "}
            relay based groups
          </AlertDescription>
        </Box>
      </Alert>
      {channels?.map((channel) => (
        <ErrorBoundary key={channel.id}>
          <ChannelCard channel={channel} additionalRelays={relays} />
        </ErrorBoundary>
      ))}

      {channels.length === 0 && (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No channels
          </AlertTitle>
          <AlertDescription maxWidth="sm">Looks like you have not joined any channels.</AlertDescription>
          <Button as={RouterLink} to="explore" variant="link" p="2">
            Explore
          </Button>
        </Alert>
      )}
    </ContainedParentView>
  );
}
